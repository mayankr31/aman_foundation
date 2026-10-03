import { prisma } from "../src/lib/prisma.js";

const LEGACY_RATING_KEYS = [
  "lessonPlan",
  "culture",
  "lessonFlow",
  "content",
  "communityEngagement",
];

const DEFAULT_CATEGORIES = [
  { key: "lessonPlan", label: "Lesson Plan" },
  { key: "culture", label: "Culture" },
  { key: "lessonFlow", label: "Lesson Flow" },
  { key: "content", label: "Content" },
  { key: "communityEngagement", label: "Community Engagement" },
];

async function main() {
  console.log("Backfilling fellow performance ratings...");

  // 1. Seed default rating categories if none exist.
  const existingCategories = await prisma.performanceRatingCategory.count();
  if (existingCategories === 0) {
    await prisma.performanceRatingCategory.createMany({
      data: DEFAULT_CATEGORIES.map((category, index) => ({
        key: category.key,
        label: category.label,
        order: index,
      })),
      skipDuplicates: true,
    });
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default rating categories.`);
  } else {
    console.log(`Found ${existingCategories} existing rating categories, skipping seed.`);
  }

  // 2. Move legacy column values into the ratings JSON for records that need it.
  const performances = await prisma.fellowPerformance.findMany();
  let updated = 0;

  for (const record of performances) {
    const hasRatings =
      record.ratings && typeof record.ratings === "object" && Object.keys(record.ratings).length > 0;
    if (hasRatings) continue;

    const ratings = {};
    for (const key of LEGACY_RATING_KEYS) {
      if (record[key] !== null && record[key] !== undefined) {
        ratings[key] = record[key];
      }
    }
    if (Object.keys(ratings).length === 0) continue;

    await prisma.fellowPerformance.update({
      where: { id: record.id },
      data: { ratings },
    });
    updated += 1;
  }

  console.log(`Backfilled ratings for ${updated} record(s).`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
