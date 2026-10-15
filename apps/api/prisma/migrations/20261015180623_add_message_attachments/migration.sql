-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachmentData" TEXT,
ADD COLUMN     "attachmentMimeType" TEXT,
ADD COLUMN     "attachmentName" TEXT,
ALTER COLUMN "body" DROP NOT NULL;
