-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "recordingFee" DECIMAL(10,2),
ADD COLUMN     "recordingRequested" BOOLEAN NOT NULL DEFAULT false;
