-- CreateTable
CREATE TABLE "ImprovementProof" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "beforeMark" TEXT NOT NULL,
    "afterMark" TEXT NOT NULL,
    "documentData" TEXT NOT NULL,
    "documentMimeType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImprovementProof_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ImprovementProof" ADD CONSTRAINT "ImprovementProof_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
