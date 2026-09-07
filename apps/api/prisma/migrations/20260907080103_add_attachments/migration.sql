-- AlterTable
ALTER TABLE "AiMessage" ADD COLUMN     "imageData" TEXT,
ADD COLUMN     "imageMimeType" TEXT;

-- AlterTable
ALTER TABLE "TutorNote" ADD COLUMN     "attachmentData" TEXT,
ADD COLUMN     "attachmentMimeType" TEXT,
ADD COLUMN     "attachmentName" TEXT;
