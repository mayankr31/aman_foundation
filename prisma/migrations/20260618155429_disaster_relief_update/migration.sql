-- AlterTable
ALTER TABLE "DisasterIncident" ADD COLUMN     "expectedFamiliesAffected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "humanLossDied" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "humanLossInjured" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "humanLossMissing" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "propertyLossEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "IncidentResourceNeed" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "resourceItemId" TEXT NOT NULL,
    "quantityNeeded" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "quantityReceived" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "transactionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentResourceNeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncidentResourceNeed_incidentId_resourceItemId_key" ON "IncidentResourceNeed"("incidentId", "resourceItemId");

-- AddForeignKey
ALTER TABLE "IncidentResourceNeed" ADD CONSTRAINT "IncidentResourceNeed_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "DisasterIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentResourceNeed" ADD CONSTRAINT "IncidentResourceNeed_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
