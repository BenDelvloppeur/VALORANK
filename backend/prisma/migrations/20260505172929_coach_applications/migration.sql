-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CoachApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" "ValorantRank" NOT NULL,
    "trackerUrl" TEXT,
    "screenshotUrl" TEXT,
    "description" TEXT NOT NULL,
    "experience" TEXT,
    "hourlyRate" INTEGER NOT NULL,
    "specialties" TEXT[],
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachApplication_userId_key" ON "CoachApplication"("userId");

-- CreateIndex
CREATE INDEX "CoachApplication_status_createdAt_idx" ON "CoachApplication"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
