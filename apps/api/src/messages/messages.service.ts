import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { BookingStatus, Role, UserStatus } from '../prisma/prisma-enums';

const SENDER_SELECT = { id: true, name: true, role: true } as const;

function attachmentFields(attachment?: Express.Multer.File) {
  return {
    attachmentData: attachment
      ? attachment.buffer.toString('base64')
      : undefined,
    attachmentMimeType: attachment ? attachment.mimetype : undefined,
    attachmentName: attachment ? attachment.originalname : undefined,
  };
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  // Conversations are 1:1 with a booking and created lazily on first message
  // — there's no value in a conversation row sitting empty before anyone's
  // actually said anything.
  private async getOrCreateConversation(
    bookingId: string,
    studentId: string,
    tutorId: string,
  ) {
    const existing = await this.prisma.conversation.findUnique({
      where: { bookingId },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        bookingId,
        participants: {
          create: [{ userId: studentId }, { userId: tutorId }],
        },
      },
    });
  }

  async list(bookingId: string, userId: string, role: Role) {
    // Reuses BookingsService's own lookup — it already throws NotFound if the
    // booking doesn't exist and Forbidden if the caller isn't the student,
    // tutor, or an admin, so messaging gets the exact same access rule as
    // viewing the booking itself.
    await this.bookingsService.findOne(bookingId, userId, role);

    const conversation = await this.prisma.conversation.findUnique({
      where: { bookingId },
    });
    if (!conversation) return [];

    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { sentAt: 'asc' },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  // Student/tutor side: how many unread messages per booking, plus a total
  // for a single sidebar indicator. "Unread" = sent by the other side, after
  // this user last opened that booking's chat (or ever, if they never have).
  async getUnreadSummary(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId, conversation: { bookingId: { not: null } } },
      select: {
        lastReadAt: true,
        conversation: { select: { id: true, bookingId: true } },
      },
    });

    const byBooking: Record<string, number> = {};
    let totalUnread = 0;
    for (const p of participations) {
      if (!p.conversation.bookingId) continue;
      const count = await this.prisma.message.count({
        where: {
          conversationId: p.conversation.id,
          senderId: { not: userId },
          sentAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
        },
      });
      if (count > 0) {
        byBooking[p.conversation.bookingId] = count;
        totalUnread += count;
      }
    }
    return { totalUnread, byBooking };
  }

  async markRead(bookingId: string, userId: string, role: Role) {
    await this.bookingsService.findOne(bookingId, userId, role);
    const conversation = await this.prisma.conversation.findUnique({
      where: { bookingId },
    });
    if (!conversation) return { ok: true };

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation.id, userId },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  async send(
    bookingId: string,
    userId: string,
    role: Role,
    dto: CreateMessageDto,
    attachment?: Express.Multer.File,
  ) {
    if (!dto.body?.trim() && !attachment) {
      throw new BadRequestException('Message must have text or an attachment');
    }

    const booking = await this.bookingsService.findOne(bookingId, userId, role);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ForbiddenException(
        'This booking has been cancelled — messaging is no longer available',
      );
    }

    const conversation = await this.getOrCreateConversation(
      bookingId,
      booking.studentId,
      booking.tutorId,
    );

    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body: dto.body,
        ...attachmentFields(attachment),
      },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  async flag(messageId: string, userId: string, role: Role) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId,
    );
    if (role !== Role.ADMIN && !isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { flagged: true },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  // Admin-only: surfaces every flagged message across the platform so an
  // admin can review a safeguarding concern without having to go booking by
  // booking.
  adminListFlagged() {
    return this.prisma.message.findMany({
      where: { flagged: true },
      orderBy: { sentAt: 'desc' },
      include: {
        sender: { select: SENDER_SELECT },
        conversation: {
          include: {
            booking: { select: { id: true, subject: true, scheduledAt: true } },
            participants: { include: { user: { select: SENDER_SELECT } } },
          },
        },
      },
    });
  }

  // Direct admin<->user conversations aren't tied to a booking (bookingId is
  // null), which is otherwise unused — safe to key off "has no booking" as
  // long as this stays the only kind of booking-less conversation.
  private async getOrCreateDirectConversation(userId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { bookingId: null, participants: { some: { userId } } },
    });
    if (existing) return existing;

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            ...admins
              .filter((a) => a.id !== userId)
              .map((a) => ({ userId: a.id })),
          ],
        },
      },
    });
  }

  // Student/tutor side: their own thread with Lumen admin. Returns [] rather
  // than creating a conversation on a bare read — nothing to show until
  // either side has actually sent something.
  async listMyAdminMessages(userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { bookingId: null, participants: { some: { userId } } },
    });
    if (!conversation) return [];

    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { sentAt: 'asc' },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  async sendMyAdminMessage(
    userId: string,
    dto: CreateMessageDto,
    attachment?: Express.Multer.File,
  ) {
    if (!dto.body?.trim() && !attachment) {
      throw new BadRequestException('Message must have text or an attachment');
    }
    const conversation = await this.getOrCreateDirectConversation(userId);
    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body: dto.body,
        ...attachmentFields(attachment),
      },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  // Admin side: every direct conversation, with the other participant and a
  // preview of the latest message, for an inbox-style list.
  async adminListConversations() {
    const conversations = await this.prisma.conversation.findMany({
      where: { bookingId: null },
      include: {
        participants: { include: { user: { select: SENDER_SELECT } } },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { body: true, sentAt: true, attachmentName: true },
        },
      },
    });
    return conversations
      .map((c) => ({
        id: c.id,
        otherParticipant: c.participants.find((p) => p.user.role !== Role.ADMIN)
          ?.user,
        lastMessage: c.messages[0] ?? null,
      }))
      .filter((c) => c.otherParticipant)
      .sort(
        (a, b) =>
          (b.lastMessage?.sentAt.getTime() ?? 0) -
          (a.lastMessage?.sentAt.getTime() ?? 0),
      );
  }

  // Admin-only: starts (or returns the existing) direct conversation with a
  // specific student/tutor, so an admin can initiate contact rather than
  // only ever replying to someone who messaged first.
  async adminStartConversation(targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.role === Role.ADMIN) {
      throw new BadRequestException(
        'Cannot start a conversation with another admin',
      );
    }
    return this.getOrCreateDirectConversation(targetUserId);
  }

  private async requireDirectConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || conversation.bookingId) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async adminListMessages(conversationId: string) {
    await this.requireDirectConversation(conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  async adminSendMessage(
    adminId: string,
    conversationId: string,
    dto: CreateMessageDto,
    attachment?: Express.Multer.File,
  ) {
    if (!dto.body?.trim() && !attachment) {
      throw new BadRequestException('Message must have text or an attachment');
    }
    await this.requireDirectConversation(conversationId);
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: adminId,
        body: dto.body,
        ...attachmentFields(attachment),
      },
      include: { sender: { select: SENDER_SELECT } },
    });
  }
}
