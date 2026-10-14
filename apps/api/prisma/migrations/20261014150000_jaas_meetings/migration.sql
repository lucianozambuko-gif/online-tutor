-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetingEndedAt" TIMESTAMP(3),
ADD COLUMN     "meetingStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MeetingEvent" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingEvent_idempotencyKey_key" ON "MeetingEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MeetingEvent_bookingId_occurredAt_idx" ON "MeetingEvent"("bookingId", "occurredAt");

-- AddForeignKey
ALTER TABLE "MeetingEvent" ADD CONSTRAINT "MeetingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
