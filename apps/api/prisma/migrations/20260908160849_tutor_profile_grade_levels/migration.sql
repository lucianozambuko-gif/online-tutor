-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('PRIMARY', 'HIGH_SCHOOL', 'VARSITY');

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "gradeLevels" "GradeLevel"[] DEFAULT ARRAY[]::"GradeLevel"[];
