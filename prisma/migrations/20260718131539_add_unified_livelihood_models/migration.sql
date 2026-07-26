-- CreateEnum
CREATE TYPE "LivelihoodCategory" AS ENUM ('FARM', 'NON_FARM');

-- CreateTable
CREATE TABLE "LivelihoodProgram" (
    "id" TEXT NOT NULL,
    "category" "LivelihoodCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalTarget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivelihoodProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficiaryLivelihood" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "notes" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiaryLivelihood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivelihoodEvent" (
    "id" TEXT NOT NULL,
    "livelihoodId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrl" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivelihoodEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeneficiaryLivelihood_beneficiaryId_idx" ON "BeneficiaryLivelihood"("beneficiaryId");

-- CreateIndex
CREATE INDEX "BeneficiaryLivelihood_programId_idx" ON "BeneficiaryLivelihood"("programId");

-- CreateIndex
CREATE INDEX "LivelihoodEvent_livelihoodId_idx" ON "LivelihoodEvent"("livelihoodId");

-- AddForeignKey
ALTER TABLE "BeneficiaryLivelihood" ADD CONSTRAINT "BeneficiaryLivelihood_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryLivelihood" ADD CONSTRAINT "BeneficiaryLivelihood_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LivelihoodProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivelihoodEvent" ADD CONSTRAINT "LivelihoodEvent_livelihoodId_fkey" FOREIGN KEY ("livelihoodId") REFERENCES "BeneficiaryLivelihood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
