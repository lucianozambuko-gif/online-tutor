import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService, truncateForContext } from '../groq/groq.service';
import { GenerateFlashcardsDto } from './dto/generate-flashcards.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const SYSTEM_PROMPT =
  'You generate flashcards for school students. Respond with ONLY valid JSON, no markdown. Write any math/chemistry notation in plain LaTeX with $...$ delimiters (e.g. $C_6H_{12}O_6$), never as unicode subscript/superscript characters or \\u escapes — those break JSON parsing.';

interface FlashcardsResponse {
  cards: { front: string; back: string }[];
}

@Injectable()
export class FlashcardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async generate(studentId: string, dto: GenerateFlashcardsDto) {
    await this.subscriptions.checkAndIncrementUsage(studentId, 'GENERATION');

    let topic = dto.topic;
    let sourceText: string | undefined;

    if (dto.noteId) {
      const note = await this.prisma.note.findFirst({
        where: { id: dto.noteId, studentId },
      });
      if (!note) throw new NotFoundException('Note not found');
      topic = note.topic;
      sourceText = truncateForContext(note.content);
    }

    if (!topic) {
      throw new BadRequestException('Either topic or noteId is required');
    }

    const count = dto.count ?? 8;

    const { cards } = await this.groq.chatJson<FlashcardsResponse>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create ${count} flashcards about "${topic}"${sourceText ? ` based on this material:\n${sourceText}` : ''}. Respond as JSON: { "cards": [ { "front": string, "back": string } ] }`,
        },
      ],
      { maxTokens: 2000, temperature: 0.6 },
    );

    // The model occasionally returns technically-valid JSON with a missing or
    // empty cards array — treat that as a failed generation rather than
    // silently creating (and the student opening) an empty set.
    if (!cards || cards.length === 0) {
      throw new ServiceUnavailableException(
        'No flashcards could be generated for that topic, try again.',
      );
    }

    return this.prisma.flashcardSet.create({
      data: {
        studentId,
        noteId: dto.noteId,
        topic,
        cards: { create: cards },
      },
      include: { cards: true },
    });
  }

  list(studentId: string) {
    return this.prisma.flashcardSet.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
  }

  async findOne(studentId: string, id: string) {
    const set = await this.prisma.flashcardSet.findFirst({
      where: { id, studentId },
      include: { cards: true },
    });
    if (!set) {
      throw new NotFoundException('Flashcard set not found');
    }
    return set;
  }

  recentSummary(studentId: string, take = 3) {
    return this.prisma.flashcardSet.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        topic: true,
        createdAt: true,
        _count: { select: { cards: true } },
      },
    });
  }

  count(studentId: string) {
    return this.prisma.flashcardSet.count({ where: { studentId } });
  }
}
