import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const DEFAULT_FROM = 'Lumen <onboarding@resend.dev>';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set — emails will be logged instead of sent. ' +
          'Fine for local dev, not for production.',
      );
    }
  }

  async send({ to, subject, html }: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      // Logged, not thrown — a failed notification email shouldn't fail the
      // request that triggered it (e.g. registration should still succeed
      // even if the guardian-consent email bounces).
      this.logger.error(
        `Failed to send email to ${to} ("${subject}"): ${error.message}`,
      );
    }
  }
}
