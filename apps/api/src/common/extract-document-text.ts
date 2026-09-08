import { BadRequestException } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

// Keeps a single attached document from dominating the model's context
// window/token budget on top of the conversation history already being sent.
const MAX_EXTRACTED_CHARS = 12000;

export async function extractDocumentText(
  file: Express.Multer.File,
): Promise<string> {
  let text: string;

  if (file.mimetype === 'application/pdf') {
    const result = await pdfParse(file.buffer);
    text = result.text;
  } else if (
    file.mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value;
  } else {
    throw new BadRequestException(
      'Only PDF or Word (.docx) documents are supported',
    );
  }

  text = text.trim();
  if (!text) {
    throw new BadRequestException(
      "Couldn't find any text in that file — it may be a scanned document without selectable text.",
    );
  }

  if (text.length > MAX_EXTRACTED_CHARS) {
    text = `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[...document truncated, it was longer than can be shared in one go...]`;
  }

  return text;
}
