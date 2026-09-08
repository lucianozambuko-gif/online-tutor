import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService, type GroqMessage } from '../groq/groq.service';
import { AiMessageRole } from '../prisma/prisma-enums';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { extractDocumentText } from '../common/extract-document-text';

const DEFAULT_VISION_MODEL = 'qwen/qwen3.6-27b';

const SYSTEM_PROMPT = `You are a friendly, patient AI study helper on a South African online tutoring platform, for school and university students.

- Explain concepts and work through problems step by step, guiding the student's own reasoning rather than just handing over final answers to what look like graded homework or assignment questions.
- If asked to check an answer, work through the reasoning yourself first, then compare.
- Keep answers clear and appropriately concise for a student.
- Stay focused on schoolwork/coursework. Politely decline requests unrelated to study, or anything inappropriate.
- If you're not confident about a fact, say so rather than guessing.
- Format any math with $...$ for inline and $$...$$ for display equations (not \\( \\) or \\[ \\]) — the chat renders LaTeX via KaTeX using that syntax.
- You can help format citations and reference lists (APA, MLA, Harvard, etc.) and build a bibliography from sources the student gives you, when asked.
- If a student shares their own written work and asks you to check it for originality, review it for things that read as copied or under-cited — unattributed quotes or statistics, claims that need a source, sudden shifts in tone or vocabulary — and point out where a citation looks needed. Always make clear this is a writing-quality read-through, not a plagiarism-detection scan against any database or the web, since you have no way to verify whether text appears elsewhere.`;

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
    private readonly subscriptions: SubscriptionsService,
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

  async sendMessage(
    studentId: string,
    rawContent: string | undefined,
    image?: Express.Multer.File,
    document?: Express.Multer.File,
  ) {
    const content = rawContent?.trim() ?? '';
    if (!content && !image && !document) {
      throw new BadRequestException('Type a message or attach a file first');
    }

    // Documents are free on every plan — only images need the vision check.
    const plan = await this.subscriptions.checkAndIncrementUsage(
      studentId,
      'AI_MESSAGE',
      { requiresVision: !!image },
    );

    const conversation = await this.getConversation(studentId);

    // Built from history BEFORE the current turn is inserted, so the image
    // (if any) can be attached to just this one call instead of being mixed
    // into a row already fetched as plain text.
    const priorMessages = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    const priorHistory = priorMessages.slice(
      -this.subscriptions.historyMessageLimit(plan),
    );

    const imageData = image ? image.buffer.toString('base64') : null;
    const imageMimeType = image?.mimetype ?? null;
    const documentText = document ? await extractDocumentText(document) : null;
    const documentName = document?.originalname ?? null;

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content:
          content || (image ? '(shared an image)' : '(shared a document)'),
        imageData,
        imageMimeType,
        documentText,
        documentName,
      },
    });

    // The document's extracted text is only sent to the model on this turn,
    // same as images — later turns just carry a short note for continuity.
    const textForModel = documentText
      ? `Attached document "${documentName}":\n"""\n${documentText}\n"""\n\n${content || 'Please help me with this document.'}`
      : content;

    const currentContent: GroqMessage['content'] = image
      ? [
          {
            type: 'text',
            text:
              textForModel || "What's in this image? Please help me with it.",
          },
          {
            type: 'image_url',
            image_url: { url: `data:${image.mimetype};base64,${imageData}` },
          },
        ]
      : textForModel;

    const replyText = await this.groq.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        ...priorHistory.map((m): GroqMessage => ({
          role: m.role === AiMessageRole.USER ? 'user' : 'assistant',
          content: m.imageData
            ? `${m.content}\n[shared an image]`
            : m.documentName
              ? `${m.content}\n[shared a document: ${m.documentName}]`
              : m.content,
        })),
        { role: 'user', content: currentContent },
      ],
      image
        ? {
            // The preview vision model's account-level output-token-per-minute
            // limit is 1000 — stay comfortably under it.
            model: process.env.GROQ_VISION_MODEL ?? DEFAULT_VISION_MODEL,
            maxTokens: 800,
            reasoningFormat: 'hidden',
          }
        : undefined,
    );

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
