-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED');

-- CreateTable
CREATE TABLE "evidence_verifications" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_verifications_evidenceId_idx" ON "evidence_verifications"("evidenceId");

-- CreateIndex
CREATE INDEX "evidence_verifications_reviewedById_idx" ON "evidence_verifications"("reviewedById");

-- AddForeignKey
ALTER TABLE "evidence_verifications" ADD CONSTRAINT "evidence_verifications_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_verifications" ADD CONSTRAINT "evidence_verifications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
