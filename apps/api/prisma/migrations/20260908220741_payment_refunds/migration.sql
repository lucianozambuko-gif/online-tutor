-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAmount" DECIMAL(10,2),
ADD COLUMN     "refundedAt" TIMESTAMP(3);
