import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService, type GroqMessage } from '../groq/groq.service';
import { AiMessageRole } from '../prisma/prisma-enums';

const SYSTEM_PROMPT = `You are a friendly, patient AI study helper on a South African online tutoring platform, for school and university students.

- Explain concepts and work through problems step by step, guiding the student's own reasoning rather than just handing over final answers to what look like graded homework or assignment questions.
- If asked to check an answer, work through the reasoning yourself first, then compare.
- Keep answers clear and appropriately concise for a student.
- Stay focused on schoolwork/coursework. Politely decline requests unrelated to study, or anything inappropriate.
- If you're not confident about a fact, say so rather than guessing.
- Format any math with $...$ for inline and $$...$$ for display equations (not \\( \\) or \\[ \\]) — the chat renders LaTeX via KaTeX using that syntax.`;

// How many prior messages to actually send as context — full history stays in
// the DB, but an unbounded window would grow token cost/latency forever.
const MAX_HISTORY_MESSAGES = 20;

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
  ) {}

  async getConversation(studentId: string) {
    const existing = await this.prisma.aiConversation.findUnique({
      where: { studentId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (existing) return existing;

    return this.prisma.aiConversation.create({
      data: { studentId },
      include: { messages: true },
    });
  }

  async sendMessage(studentId: string, content: string) {
    const conversation = await this.getConversation(studentId);

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content,
      },
    });

    const allMessages = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    const recentHistory = allMessages.slice(-MAX_HISTORY_MESSAGES);

    const replyText = await this.groq.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map((m): GroqMessage => ({
        role: m.role === AiMessageRole.USER ? 'user' : 'assistant',
        content: m.content,
      })),
    ]);

    return this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.ASSISTANT,
        content:
          replyText || "Sorry, I couldn't come up with an answer to that.",
      },
    });
  }
}
