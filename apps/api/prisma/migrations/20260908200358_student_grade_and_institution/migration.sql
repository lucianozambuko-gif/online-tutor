-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'COLLEGE', 'VARSITY', 'ONLINE_INSTITUTE');

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "institutionType" "InstitutionType";
