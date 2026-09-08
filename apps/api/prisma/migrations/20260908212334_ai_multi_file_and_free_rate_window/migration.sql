/*
  Warnings:

  - You are about to drop the column `documentName` on the `AiMessage` table. All the data in the column will be lost.
  - You are about to drop the column `documentText` on the `AiMessage` table. All the data in the column will be lost.
  - You are about to drop the column `imageData` on the `AiMessage` table. All the data in the column will be lost.
  - You are about to drop the column `imageMimeType` on the `AiMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AiMessage" DROP COLUMN "documentName",
DROP COLUMN "documentText",
DROP COLUMN "imageData",
DROP COLUMN "imageMimeType",
ADD COLUMN     "attachments" JSONB;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "aiMessageWindowStart" TIMESTAMP(3);
