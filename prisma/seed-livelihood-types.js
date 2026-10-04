import { prisma } from "../src/lib/prisma.js";
import { LIVELIHOOD_TYPES } from "../src/lib/livelihoodTypes.js";

async function main() {
  console.log("Seeding livelihood types...");

  const existing = await prisma.livelihoodType.count();
  if (existing > 0) {
    console.log(`Skipped: ${existing} livelihood types already exist.`);
    return;
  }

  const data = Object.entries(LIVELIHOOD_TYPES).map(([key, config], index) => ({
    key,
    category: config.category,
    label: config.label,
    icon: config.icon || "category",
    description: config.description || null,
    programTargetUnit: config.programTargetUnit || null,
    fields: config.fields || [],
    eventTypes: config.eventTypes || [],
    tableColumns: config.tableColumns || [],
    kpiCards: config.kpiCards || [],
    order: index,
  }));

  const result = await prisma.livelihoodType.createMany({ data, skipDuplicates: true });
  console.log(`Seeded ${result.count} livelihood types.`);
}

main()
  .catch((err) => {
    console.error("Seed livelihood types error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
