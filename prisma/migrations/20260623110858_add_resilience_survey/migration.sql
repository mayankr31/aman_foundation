-- CreateTable
CREATE TABLE "ResilienceSurvey" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responses" JSONB NOT NULL,
    "lifeSatisfactionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planningScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterReadinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterBeliefsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterMindsetScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialResilienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthResilienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialConnectednessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialProtectionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disasterWarningScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vulnerabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResilienceSurvey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResilienceSurvey" ADD CONSTRAINT "ResilienceSurvey_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
