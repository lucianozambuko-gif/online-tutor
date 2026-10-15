import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { BookingStatus, Role } from '../prisma/prisma-enums';

const SENDER_SELECT = { id: true, name: true, role: true } as const;

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
        attachmentData: attachment
          ? attachment.buffer.toString('base64')
          : undefined,
        attachmentMimeType: attachment ? attachment.mimetype : undefined,
        attachmentName: attachment ? attachment.originalname : undefined,
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
}
