import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// Files are stored inline as base64 in Postgres (no object storage set up),
// so this cap keeps rows small and requests fast rather than reflecting any
// real image-quality need.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    callback(null, true);
  },
};

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const attachmentUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) {
      callback(
        new BadRequestException('Unsupported file type — images and PDFs only'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

// The AI Helper accepts an image OR a document per message (two named form
// fields on one request), each with its own allowed mimetypes — checked here
// by fieldname since FileFieldsInterceptor only takes one MulterOptions.
export const aiAttachmentUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === 'image') {
      if (!file.mimetype.startsWith('image/')) {
        callback(
          new BadRequestException('Only image files are allowed'),
          false,
        );
        return;
      }
    } else if (file.fieldname === 'document') {
      if (!ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) {
        callback(
          new BadRequestException(
            'Only PDF or Word (.docx) documents are allowed',
          ),
          false,
        );
        return;
      }
    }
    callback(null, true);
  },
};
