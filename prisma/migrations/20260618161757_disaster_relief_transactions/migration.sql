-- AlterTable
ALTER TABLE "InventoryLedger" ADD COLUMN     "incidentResourceNeedId" TEXT;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_incidentResourceNeedId_fkey" FOREIGN KEY ("incidentResourceNeedId") REFERENCES "IncidentResourceNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
