-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "transcriptData" TEXT,
ADD COLUMN     "transcriptMimeType" TEXT,
ADD COLUMN     "transcriptName" TEXT,
ADD COLUMN     "transcriptVerified" BOOLEAN NOT NULL DEFAULT false;
