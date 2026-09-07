import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export type GroqContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  // A plain string for ordinary text turns; an array of parts (text +
  // image_url) for a vision-model call, matching Groq's OpenAI-compatible
  // multimodal message format.
  content: string | GroqContentPart[];
}

// Keeps source material (e.g. a full generated note) from eating too much of
// the model's context/output token budget when it's reused as input for
// another generation (flashcards/quiz from a note).
export function truncateForContext(text: string, maxChars = 3000): string {
  return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
}

interface GroqChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Ask Groq for strict JSON output (still returned as a string — parse it yourself). */
  json?: boolean;
  /** Override the default text model — used for the one-off vision-capable call. */
  model?: string;
  /** 'hidden' drops a reasoning model's <think> trace, returning only its final answer. */
  reasoningFormat?: 'raw' | 'parsed' | 'hidden';
}

// Shared by every feature that calls Groq (AI chat, notes, flashcards, quizzes)
// so the fetch/error-handling/model-selection logic lives in one place instead
// of being copy-pasted per module. Plain fetch against Groq's OpenAI-compatible
// endpoint rather than an SDK dependency — this is the only thing any of those
// modules need from it.
@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);

  async chat(
    messages: GroqMessage[],
    options: GroqChatOptions = {},
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'The AI helper is not set up yet — ask an admin to add a GROQ_API_KEY.',
      );
    }

    let res: Response;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:
            options.model ?? process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
          messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 1024,
          ...(options.json ? { response_format: { type: 'json_object' } } : {}),
          ...(options.reasoningFormat
            ? { reasoning_format: options.reasoningFormat }
            : {}),
        }),
      });
    } catch (err) {
      this.logger.error(
        `Groq request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new ServiceUnavailableException(
        'The AI helper is temporarily unavailable, try again shortly.',
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Groq API error ${res.status}: ${body}`);
      throw new ServiceUnavailableException(
        'The AI helper is temporarily unavailable, try again shortly.',
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? '';
  }

  async chatJson<T>(
    messages: GroqMessage[],
    options: Omit<GroqChatOptions, 'json'> = {},
  ): Promise<T> {
    const raw = await this.chat(messages, { ...options, json: true });
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.error(`Groq returned invalid JSON: ${raw}`);
      throw new ServiceUnavailableException(
        'The AI helper returned an unexpected response, try again.',
      );
    }
  }
}
