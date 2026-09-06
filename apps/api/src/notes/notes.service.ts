import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService } from '../groq/groq.service';
import { GenerateNoteDto } from './dto/generate-note.dto';

const SYSTEM_PROMPT =
  'You write clear, well-structured study notes for school and university students, using markdown headings and bullet points. Base notes strictly on the given topic and any supplied source material — never invent facts. Format any math with $...$ inline or $$...$$ display delimiters.';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
  ) {}

  async generate(studentId: string, dto: GenerateNoteDto) {
    const userPrompt = dto.sourceText
      ? `Topic: ${dto.topic}\nSubject: ${dto.subject ?? 'general'}\nSource material:\n${dto.sourceText}`
      : `Topic: ${dto.topic}\nSubject: ${dto.subject ?? 'general'}`;

    const content = await this.groq.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1500, temperature: 0.5 },
    );

    return this.prisma.note.create({
      data: {
        studentId,
        topic: dto.topic,
        subject: dto.subject,
        content:
          content ||
          'No notes could be generated for this topic — try rephrasing it.',
        sourceType: dto.sourceText ? 'TEXT' : null,
      },
    });
  }

  list(studentId: string) {
    return this.prisma.note.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(studentId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, studentId } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  recentSummary(studentId: string, take = 3) {
    return this.prisma.note.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, topic: true, subject: true, createdAt: true },
    });
  }

  count(studentId: string) {
    return this.prisma.note.count({ where: { studentId } });
  }
}
