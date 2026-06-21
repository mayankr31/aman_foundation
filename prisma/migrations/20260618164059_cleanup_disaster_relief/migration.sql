/*
  Warnings:

  - You are about to drop the column `donorProviderId` on the `InventoryLedger` table. All the data in the column will be lost.
  - You are about to drop the column `recipientFamilyId` on the `InventoryLedger` table. All the data in the column will be lost.
  - You are about to drop the column `recipientProviderId` on the `InventoryLedger` table. All the data in the column will be lost.
  - You are about to drop the `AffectedFamily` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BroadcastAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HelpProviderIncident` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AffectedFamily" DROP CONSTRAINT "AffectedFamily_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "BroadcastAlert" DROP CONSTRAINT "BroadcastAlert_sentByUserId_fkey";

-- DropForeignKey
ALTER TABLE "HelpProviderIncident" DROP CONSTRAINT "HelpProviderIncident_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "HelpProviderIncident" DROP CONSTRAINT "HelpProviderIncident_providerId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLedger" DROP CONSTRAINT "InventoryLedger_donorProviderId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLedger" DROP CONSTRAINT "InventoryLedger_recipientFamilyId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLedger" DROP CONSTRAINT "InventoryLedger_recipientProviderId_fkey";

-- AlterTable
ALTER TABLE "InventoryLedger" DROP COLUMN "donorProviderId",
DROP COLUMN "recipientFamilyId",
DROP COLUMN "recipientProviderId";

-- DropTable
DROP TABLE "AffectedFamily";

-- DropTable
DROP TABLE "BroadcastAlert";

-- DropTable
DROP TABLE "HelpProviderIncident";
