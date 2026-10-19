require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma");

// Adds newly required subject options without touching existing responses or
// replacing any options that admins may have customized.
const UPDATES = [
  {
    subjectNames: ["english", "assamese"],
    option: "paragraph (STD 2 level text)",
  },
  {
    subjectNames: ["maths", "math"],
    option: "Division",
  },
];

function hasOption(options, value) {
  return options.some(
    (option) => String(option).trim().toLowerCase() === value.toLowerCase()
  );
}

function insertBeforeAbsent(options, value) {
  const absentIndex = options.findIndex(
    (option) => String(option).trim().toLowerCase() === "absent"
  );
  if (absentIndex >= 0) {
    options.splice(absentIndex, 0, value);
  } else {
    options.push(value);
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const templates = await prisma.subjectAssessmentTemplate.findMany();
    let updated = 0;

    for (const template of templates) {
      const name = String(template.name || "").trim().toLowerCase();
      const options = Array.isArray(template.options) ? [...template.options] : [];
      let changed = false;

      for (const update of UPDATES) {
        if (!update.subjectNames.includes(name)) continue;
        if (hasOption(options, update.option)) continue;
        insertBeforeAbsent(options, update.option);
        changed = true;
      }

      if (!changed) continue;

      await prisma.subjectAssessmentTemplate.update({
        where: { id: template.id },
        data: { options },
      });
      updated += 1;
      console.log(`Updated ${template.name}: ${options.join(", ")}`);
    }

    console.log(`Done. ${updated} subject template(s) updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to update assessment options:", error);
  process.exit(1);
});
