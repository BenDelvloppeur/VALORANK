-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CoachProfile_featured_idx" ON "CoachProfile"("featured");
