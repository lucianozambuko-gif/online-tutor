-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('SAVINGS', 'CHEQUE');

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "accountHolder" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "accountType" "BankAccountType",
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "branchCode" TEXT;
