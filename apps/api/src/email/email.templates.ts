// Plain inline-styled HTML — email clients have poor CSS support, so this
// deliberately skips the web app's actual design system (gradients, custom
// fonts) in favor of something that renders consistently everywhere.
function layout(title: string, bodyHtml: string): string {
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #12233b;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 24px;">Lumen</p>
  <h1 style="font-size: 20px; margin: 0 0 16px;">${title}</h1>
  ${bodyHtml}
  <p style="margin-top: 32px; font-size: 12px; color: #7c93ab;">
    Lumen Tutoring &middot; if you didn't expect this email, you can safely ignore it.
  </p>
</div>`.trim();
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #1f5f9c; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600;">${label}</a>`;
}

export function guardianConsentEmail(params: {
  guardianName: string;
  studentName: string;
  consentUrl: string;
}): { subject: string; html: string } {
  const { guardianName, studentName, consentUrl } = params;
  return {
    subject: `${studentName} wants to join Lumen — your consent is needed`,
    html: layout(
      'A parent/guardian consent request',
      `
      <p>Hi ${guardianName},</p>
      <p><strong>${studentName}</strong> has registered on Lumen, a tutoring platform, and listed you as their parent/guardian. Since they're under 18, we need your consent before their account is activated.</p>
      ${button(consentUrl, 'Review and respond')}
      <p style="font-size: 13px; color: #3d5470;">This link expires in 7 days.</p>
      `,
    ),
  };
}

export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  const { name, resetUrl } = params;
  return {
    subject: 'Reset your Lumen password',
    html: layout(
      'Reset your password',
      `
      <p>Hi ${name},</p>
      <p>We received a request to reset your Lumen password. Click below to choose a new one.</p>
      ${button(resetUrl, 'Reset password')}
      <p style="font-size: 13px; color: #3d5470;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
      `,
    ),
  };
}
