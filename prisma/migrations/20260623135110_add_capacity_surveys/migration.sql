-- CreateTable
CREATE TABLE "AdaptiveCapacitySurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdaptiveCapacitySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsorptiveCapacitySurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsorptiveCapacitySurvey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdaptiveCapacitySurvey" ADD CONSTRAINT "AdaptiveCapacitySurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptiveCapacitySurvey" ADD CONSTRAINT "AbsorptiveCapacitySurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
