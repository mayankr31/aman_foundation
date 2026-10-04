import { prisma } from "@/lib/prisma";
import { LIVELIHOOD_TYPES } from "@/lib/livelihoodTypes";

function defaultsFromStatic() {
  return Object.entries(LIVELIHOOD_TYPES).map(([key, config], index) => ({
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
}

// Seeds the built-in livelihood types once, when the table is still empty.
export async function ensureLivelihoodTypesSeeded() {
  const count = await prisma.livelihoodType.count();
  if (count > 0) return;
  await prisma.livelihoodType.createMany({
    data: defaultsFromStatic(),
    skipDuplicates: true,
  });
}

export async function getAllLivelihoodTypes() {
  await ensureLivelihoodTypesSeeded();
  return prisma.livelihoodType.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getActiveLivelihoodTypes(category) {
  await ensureLivelihoodTypesSeeded();
  const where = { active: true };
  if (category) where.category = category;
  return prisma.livelihoodType.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export function slugifyTypeKey(label) {
  return (
    String(label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "type"
  );
}
