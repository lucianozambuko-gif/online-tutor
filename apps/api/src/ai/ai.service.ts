import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqService, type GroqMessage } from '../groq/groq.service';
import { AiMessageRole } from '../prisma/prisma-enums';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { extractDocumentText } from '../common/extract-document-text';

const DEFAULT_VISION_MODEL = 'qwen/qwen3.6-27b';

export type AiAttachment =
  | { kind: 'IMAGE'; name: string; mimeType: string; data: string }
  | { kind: 'DOCUMENT'; name: string; mimeType: string; text: string };

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
    images: Express.Multer.File[] = [],
    documents: Express.Multer.File[] = [],
  ) {
    const content = rawContent?.trim() ?? '';
    const totalFiles = images.length + documents.length;
    if (!content && totalFiles === 0) {
      throw new BadRequestException('Type a message or attach a file first');
    }

    // Documents are free on every plan — only images need the vision check.
    const plan = await this.subscriptions.checkAndIncrementUsage(
      studentId,
      'AI_MESSAGE',
      { requiresVision: images.length > 0 },
    );

    const maxFiles = this.subscriptions.maxFilesPerMessage(plan);
    if (totalFiles > maxFiles) {
      throw new ForbiddenException(
        `Your ${plan} plan allows up to ${maxFiles} file${maxFiles === 1 ? '' : 's'} per message — you attached ${totalFiles}. Upgrade for more.`,
      );
    }

    const conversation = await this.getConversation(studentId);

    // Built from history BEFORE the current turn is inserted, so this turn's
    // attachments can be sent to the model just once, instead of being
    // mixed into a row already fetched as plain text.
    const priorMessages = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    const priorHistory = priorMessages.slice(
      -this.subscriptions.historyMessageLimit(plan),
    );

    const attachments: AiAttachment[] = [
      ...images.map((img): AiAttachment => ({
        kind: 'IMAGE',
        name: img.originalname,
        mimeType: img.mimetype,
        data: img.buffer.toString('base64'),
      })),
      ...(await Promise.all(
        documents.map(async (doc): Promise<AiAttachment> => ({
          kind: 'DOCUMENT',
          name: doc.originalname,
          mimeType: doc.mimetype,
          text: await extractDocumentText(doc),
        })),
      )),
    ];

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content: content || defaultAttachmentLabel(attachments),
        attachments: attachments.length > 0 ? attachments : undefined,
      },
    });

    // Attachments are only sent to the model on this turn — later turns just
    // carry a short note for continuity instead of resending everything.
    const documentBlobs = attachments
      .filter(
        (a): a is Extract<AiAttachment, { kind: 'DOCUMENT' }> =>
          a.kind === 'DOCUMENT',
      )
      .map((doc) => `Attached document "${doc.name}":\n"""\n${doc.text}\n"""`)
      .join('\n\n');
    const textForModel = [documentBlobs, content].filter(Boolean).join('\n\n');

    const imageAttachments = attachments.filter(
      (a): a is Extract<AiAttachment, { kind: 'IMAGE' }> => a.kind === 'IMAGE',
    );

    const currentContent: GroqMessage['content'] =
      imageAttachments.length > 0
        ? [
            {
              type: 'text',
              text:
                textForModel || "What's in this image? Please help me with it.",
            },
            ...imageAttachments.map((img) => ({
              type: 'image_url' as const,
              image_url: { url: `data:${img.mimeType};base64,${img.data}` },
            })),
          ]
        : textForModel || 'Please help me with this.';

    const replyText = await this.groq.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        ...priorHistory.map((m): GroqMessage => ({
          role: m.role === AiMessageRole.USER ? 'user' : 'assistant',
          content: `${m.content}${attachmentContinuityNote(m.attachments as AiAttachment[] | null)}`,
        })),
        { role: 'user', content: currentContent },
      ],
      imageAttachments.length > 0
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

function defaultAttachmentLabel(attachments: AiAttachment[]): string {
  const imageCount = attachments.filter((a) => a.kind === 'IMAGE').length;
  const docCount = attachments.filter((a) => a.kind === 'DOCUMENT').length;
  const parts: string[] = [];
  if (imageCount > 0)
    parts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);
  if (docCount > 0)
    parts.push(`${docCount} document${docCount > 1 ? 's' : ''}`);
  return parts.length > 0 ? `(shared ${parts.join(' and ')})` : '';
}

function attachmentContinuityNote(attachments: AiAttachment[] | null): string {
  if (!attachments || attachments.length === 0) return '';
  const imageCount = attachments.filter((a) => a.kind === 'IMAGE').length;
  const docNames = attachments
    .filter((a) => a.kind === 'DOCUMENT')
    .map((a) => a.name);
  let note = '';
  if (imageCount > 0)
    note += `\n[shared ${imageCount} image${imageCount > 1 ? 's' : ''}]`;
  if (docNames.length > 0)
    note += `\n[shared document(s): ${docNames.join(', ')}]`;
  return note;
}
