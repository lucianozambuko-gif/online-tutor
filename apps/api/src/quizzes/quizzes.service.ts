import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService, truncateForContext } from '../groq/groq.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

const SYSTEM_PROMPT =
  'You generate practice quiz questions for school students. Respond with ONLY valid JSON, no markdown. Write any math/chemistry notation in plain LaTeX with $...$ delimiters (e.g. $C_6H_{12}O_6$), never as unicode subscript/superscript characters or \\u escapes — those break JSON parsing.';

interface QuizQuestionDraft {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
  ) {}

  async generate(studentId: string, dto: GenerateQuizDto) {
    let topic = dto.topic;
    let sourceText: string | undefined;

    if (dto.noteId) {
      const note = await this.prisma.note.findFirst({ where: { id: dto.noteId, studentId } });
      if (!note) throw new NotFoundException('Note not found');
      topic = note.topic;
      sourceText = truncateForContext(note.content);
    }

    if (!topic) {
      throw new BadRequestException('Either topic or noteId is required');
    }

    const count = dto.count ?? 5;
    const difficulty = dto.difficulty ?? 'medium';

    const { questions } = await this.groq.chatJson<{ questions: QuizQuestionDraft[] }>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create ${count} ${difficulty} difficulty multiple-choice questions about "${topic}"${sourceText ? ` based on this material:\n${sourceText}` : ''}. Respond as JSON: { "questions": [ { "question": string, "options": string[], "answerIndex": number, "explanation": string } ] }`,
        },
      ],
      { maxTokens: 2500, temperature: 0.7 },
    );

    if (!questions || questions.length === 0) {
      throw new ServiceUnavailableException('No quiz questions could be generated for that topic, try again.');
    }

    return this.prisma.quiz.create({
      data: {
        studentId,
        topic,
        difficulty,
        noteId: dto.noteId,
        questions: { create: questions },
      },
      include: { questions: true },
    });
  }

  list(studentId: string) {
    return this.prisma.quiz.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  async findOne(studentId: string, id: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, studentId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async submit(studentId: string, id: string, dto: SubmitQuizDto) {
    const quiz = await this.findOne(studentId, id);

    if (dto.answers.length !== quiz.questions.length) {
      throw new BadRequestException('Answer count does not match question count');
    }

    const score = quiz.questions.reduce((acc, q, i) => acc + (q.answerIndex === dto.answers[i] ? 1 : 0), 0);

    return this.prisma.quiz.update({
      where: { id },
      data: { attempted: true, score, totalQuestions: quiz.questions.length, completedAt: new Date() },
      include: { questions: true },
    });
  }

  recentSummary(studentId: string, take = 3) {
    return this.prisma.quiz.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, topic: true, createdAt: true, attempted: true, score: true, totalQuestions: true },
    });
  }

  count(studentId: string) {
    return this.prisma.quiz.count({ where: { studentId } });
  }
}
