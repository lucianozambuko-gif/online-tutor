-- DropForeignKey
ALTER TABLE "TutorNote" DROP CONSTRAINT "TutorNote_studentId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetingUrl" TEXT;

-- AlterTable
ALTER TABLE "TutorNote" ALTER COLUMN "studentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TutorNote" ADD CONSTRAINT "TutorNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
