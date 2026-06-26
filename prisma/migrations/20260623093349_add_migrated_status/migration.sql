-- AlterTable
ALTER TABLE "Beneficiary" ADD COLUMN     "isMigrated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "isMigrated" BOOLEAN NOT NULL DEFAULT false;
