import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import sharp from 'sharp';

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

const AVATAR_SIZE_PX = 256;

// Avatars are embedded as base64 directly in every tutor-list response (no
// object storage), so an un-resized upload bloats that response for every
// student browsing tutors, not just the one profile — this is what made
// /tutors a 10MB+ response for one tutor's full-size photo. Re-encoding to a
// small square JPEG keeps each one in the tens of KB regardless of what was
// uploaded, and strips EXIF metadata (e.g. GPS location) as a side benefit.
export async function resizeAvatarImage(
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const resized = await sharp(buffer)
    .rotate() // apply EXIF orientation before stripping it, or sideways photos stay sideways
    .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, {
      fit: 'cover',
      position: 'attention',
    })
    .jpeg({ quality: 82 })
    .toBuffer();
  return { buffer: resized, mimeType: 'image/jpeg' };
}

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

// The AI Helper accepts any mix of images and documents per message (two
// named, repeatable form fields on one request), each with its own allowed
// mimetypes — checked here by fieldname since FileFieldsInterceptor only
// takes one MulterOptions. How many files a plan is actually allowed is
// enforced in AiService, not here — this only bounds what any plan could
// ever send.
export const aiAttachmentUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === 'images') {
      if (!file.mimetype.startsWith('image/')) {
        callback(
          new BadRequestException('Only image files are allowed'),
          false,
        );
        return;
      }
    } else if (file.fieldname === 'documents') {
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
