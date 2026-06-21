-- AlterTable
ALTER TABLE "BeneficiaryGoatRearing" ADD COLUMN     "goatRearingProgramId" TEXT;

-- AlterTable
ALTER TABLE "BeneficiarySugarcane" ADD COLUMN     "sugarcaneProgramId" TEXT;

-- CreateTable
CREATE TABLE "GoatRearingProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoatRearingProgram_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BeneficiaryGoatRearing" ADD CONSTRAINT "BeneficiaryGoatRearing_goatRearingProgramId_fkey" FOREIGN KEY ("goatRearingProgramId") REFERENCES "GoatRearingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiarySugarcane" ADD CONSTRAINT "BeneficiarySugarcane_sugarcaneProgramId_fkey" FOREIGN KEY ("sugarcaneProgramId") REFERENCES "SugarcaneProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
