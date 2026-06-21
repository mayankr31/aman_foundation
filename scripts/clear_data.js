const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function main() {
  console.log("Clearing data from deprecated tables and columns...");

  // Update InventoryLedger to drop foreign keys
  await prisma.inventoryLedger.updateMany({
    data: {
      donorProviderId: null,
      recipientFamilyId: null,
      recipientProviderId: null
    }
  });
  console.log("Cleared InventoryLedger columns");

  // Delete from AffectedFamily
  await prisma.affectedFamily.deleteMany({});
  console.log("Cleared AffectedFamily table");

  // Delete from BroadcastAlert
  await prisma.broadcastAlert.deleteMany({});
  console.log("Cleared BroadcastAlert table");

  // Delete from HelpProviderIncident
  await prisma.helpProviderIncident.deleteMany({});
  console.log("Cleared HelpProviderIncident table");

  console.log("Data cleared successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
