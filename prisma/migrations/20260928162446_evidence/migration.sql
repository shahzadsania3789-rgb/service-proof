-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PHOTO', 'DOCUMENT', 'COMPLETION_NOTE');

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "serviceJobId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_serviceJobId_idx" ON "evidence"("serviceJobId");

-- CreateIndex
CREATE INDEX "evidence_submittedById_idx" ON "evidence"("submittedById");

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_serviceJobId_fkey" FOREIGN KEY ("serviceJobId") REFERENCES "service_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
