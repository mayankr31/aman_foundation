import { prisma } from "@/lib/prisma";
import { DEFAULT_RATING_FIELDS } from "@/data/fellowPerformanceConstants";

// Returns the active rating categories ordered for display. If none have been
// configured yet, seeds the default categories once and returns them.
export async function getActiveRatingCategories() {
  let categories = await prisma.performanceRatingCategory.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (categories.length === 0) {
    await prisma.performanceRatingCategory.createMany({
      data: DEFAULT_RATING_FIELDS.map((field, index) => ({
        key: field.key,
        label: field.label,
        order: index,
      })),
      skipDuplicates: true,
    });
    categories = await prisma.performanceRatingCategory.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  return categories;
}

export function isValidRating(value) {
  const num = Number(value);
  return !Number.isNaN(num) && num >= 1 && num <= 4;
}
