const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const incident = await prisma.disasterIncident.create({
    data: {
      name: "Assam Floods",
      location: "Kalgachia, Assam",
      type: "Flood",
      expectedFamiliesAffected: 1200,
      humanLossDied: 12,
      humanLossInjured: 45,
      humanLossMissing: 8,
      propertyLossEstimate: 1500000.0,
      active: true
    }
  });

  const resource1 = await prisma.resourceItem.create({
    data: {
      itemName: "Drinking Water " + Date.now(),
      unit: "Liters",
      availableStock: 500,
      status: "Optimal"
    }
  });

  const resource2 = await prisma.resourceItem.create({
    data: {
      itemName: "Medical Kits " + Date.now(),
      unit: "Boxes",
      availableStock: 50,
      status: "Critical"
    }
  });

  await prisma.incidentResourceNeed.create({
    data: {
      incidentId: incident.id,
      resourceItemId: resource1.id,
      quantityNeeded: 10000,
      quantityReceived: 4500,
      transactionsCount: 15
    }
  });

  await prisma.incidentResourceNeed.create({
    data: {
      incidentId: incident.id,
      resourceItemId: resource2.id,
      quantityNeeded: 500,
      quantityReceived: 120,
      transactionsCount: 3
    }
  });

  console.log("Seeded data!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
