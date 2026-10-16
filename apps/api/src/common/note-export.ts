import PDFDocument from 'pdfkit';

// A note's markdown content rendered as plain lines with light formatting —
// not a full markdown renderer, just enough to make headings and bullets
// read cleanly in a PDF rather than showing raw "##"/"-" syntax.
function renderMarkdownLine(doc: PDFKit.PDFDocument, rawLine: string) {
  const line = rawLine.trimEnd();

  if (!line.trim()) {
    doc.moveDown(0.5);
    return;
  }

  const heading = line.match(/^(#{1,3})\s+(.*)/);
  if (heading) {
    const level = heading[1].length;
    doc
      .font('Helvetica-Bold')
      .fontSize(level === 1 ? 16 : level === 2 ? 14 : 12.5)
      .text(heading[2].replace(/\*\*/g, ''), { paragraphGap: 4 });
    doc.font('Helvetica').fontSize(11);
    return;
  }

  const bullet = line.match(/^[-*]\s+(.*)/);
  if (bullet) {
    doc.text(`•  ${bullet[1].replace(/\*\*/g, '')}`, {
      indent: 14,
      paragraphGap: 2,
    });
    return;
  }

  doc.text(line.replace(/\*\*/g, ''), { paragraphGap: 4 });
}

// Same lightweight markdown stripping as the PDF renderer, but to a plain
// string — used when a note's content gets posted into a booking chat,
// which only ever renders plain text (no markdown).
export function markdownToPlainText(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trimEnd();
      const heading = trimmed.match(/^(#{1,3})\s+(.*)/);
      if (heading) return heading[2].replace(/\*\*/g, '');
      const bullet = trimmed.match(/^[-*]\s+(.*)/);
      if (bullet) return `• ${bullet[1].replace(/\*\*/g, '')}`;
      return trimmed.replace(/\*\*/g, '');
    })
    .join('\n');
}

const MAX_SHARED_MESSAGE_CHARS = 4800;

export function formatNoteForChat(topic: string, content: string): string {
  const plain = markdownToPlainText(content);
  const body = `📝 Shared note: ${topic}\n\n${plain}`;
  if (body.length <= MAX_SHARED_MESSAGE_CHARS) return body;
  return `${body.slice(0, MAX_SHARED_MESSAGE_CHARS)}\n\n[...note truncated, see your Library for the full version]`;
}

export function generateNotePdf(params: {
  title: string;
  metaLine: string;
  content: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(params.title, { paragraphGap: 2 });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text(params.metaLine);
    doc.fillColor('#000000').moveDown(1);

    doc.fontSize(11);
    for (const rawLine of params.content.split('\n')) {
      renderMarkdownLine(doc, rawLine);
    }

    doc.end();
  });
}
