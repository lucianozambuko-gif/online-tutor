import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService } from '../groq/groq.service';
import { GenerateTutorNoteDto } from './dto/generate-tutor-note.dto';
import { extractDocumentText } from '../common/extract-document-text';

const EXTRACTABLE_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const SYSTEM_PROMPT =
  "You help tutors turn rough session notes into a clear, structured progress note about a student, for the tutor's own record-keeping. Use markdown headings and bullet points. Base the note strictly on the tutor's input — never invent facts about the student's performance or behaviour. If a document (e.g. a worksheet or test) is attached, you may reference specific items from it (e.g. a particular question the student struggled with) to make the note more concrete.";

@Injectable()
export class TutorNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
  ) {}

  private async assertHasTutored(tutorId: string, studentId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { tutorId, studentId },
    });
    if (!booking) {
      throw new ForbiddenException(
        'You can only write notes for students you have a booking with',
      );
    }
  }

  async generate(
    tutorId: string,
    dto: GenerateTutorNoteDto,
    attachment?: Express.Multer.File,
  ) {
    if (dto.studentId) {
      await this.assertHasTutored(tutorId, dto.studentId);
    }

    if (dto.bookingId && dto.studentId) {
      const booking = await this.prisma.booking.findFirst({
        where: { id: dto.bookingId, tutorId, studentId: dto.studentId },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found for this student');
      }
    }

    // PDF/.docx attachments get their text pulled in as extra context (e.g.
    // a worksheet or test the AI can reference specifics from); a photo
    // attachment is just filed alongside the note, not readable as text.
    let documentText: string | null = null;
    if (attachment && EXTRACTABLE_MIME_TYPES.has(attachment.mimetype)) {
      documentText = await extractDocumentText(attachment);
    }

    const userContent = documentText
      ? `Topic: ${dto.topic}\nTutor's rough notes:\n${dto.rawInput}\n\nAttached document:\n${documentText}`
      : `Topic: ${dto.topic}\nTutor's rough notes:\n${dto.rawInput}`;

    const content = await this.groq.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      { maxTokens: 1000, temperature: 0.4 },
    );

    return this.prisma.tutorNote.create({
      data: {
        tutorId,
        studentId: dto.studentId,
        bookingId: dto.bookingId,
        topic: dto.topic,
        content: content || dto.rawInput,
        attachmentData: attachment
          ? attachment.buffer.toString('base64')
          : null,
        attachmentMimeType: attachment?.mimetype ?? null,
        attachmentName: attachment?.originalname ?? null,
      },
      include: { student: { select: { id: true, name: true } } },
    });
  }

  list(tutorId: string, studentId?: string) {
    return this.prisma.tutorNote.findMany({
      where: { tutorId, ...(studentId ? { studentId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true } } },
    });
  }

  async findOne(tutorId: string, id: string) {
    const note = await this.prisma.tutorNote.findFirst({
      where: { id, tutorId },
      include: { student: { select: { id: true, name: true } } },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }
}
