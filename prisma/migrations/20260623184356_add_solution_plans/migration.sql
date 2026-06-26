-- CreateTable
CREATE TABLE "SolutionPlan" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planData" JSONB NOT NULL,

    CONSTRAINT "SolutionPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SolutionPlan" ADD CONSTRAINT "SolutionPlan_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
