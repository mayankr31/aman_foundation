-- DropIndex
DROP INDEX "BeneficiaryGoatRearing_beneficiaryId_key";

-- DropIndex
DROP INDEX "BeneficiarySugarcane_beneficiaryId_key";

-- AlterTable
ALTER TABLE "GoatRearingProgram" ADD COLUMN     "totalGoats" INTEGER NOT NULL DEFAULT 0;
