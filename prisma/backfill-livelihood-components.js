import { prisma } from "../src/lib/prisma.js";

// Backfills the multi-type livelihood model:
// 1. Every existing program gets a component row derived from its primary `type`.
// 2. Every existing enrollment gets a `typeKey` from its program's primary type.
//
// Safe to run repeatedly.

async function main() {
  console.log("Backfilling livelihood program components...");

  const programs = await prisma.livelihoodProgram.findMany({
    include: { components: true },
  });

  let createdComponents = 0;
  let taggedAssignments = 0;

  for (const program of programs) {
    if (!program.type) {
      console.warn(`Skipping program ${program.id} (${program.name}): no primary type.`);
      continue;
    }

    if (program.components.length === 0) {
      await prisma.livelihoodProgramComponent.create({
        data: {
          programId: program.id,
          typeKey: program.type,
          target: program.totalTarget ?? null,
          order: 0,
        },
      });
      createdComponents += 1;
    }

    const result = await prisma.beneficiaryLivelihood.updateMany({
      where: { programId: program.id, typeKey: null },
      data: { typeKey: program.type },
    });
    taggedAssignments += result.count;
  }

  console.log(`Created ${createdComponents} program component(s).`);
  console.log(`Tagged ${taggedAssignments} enrolment(s) with their type.`);
}

main()
  .catch((err) => {
    console.error("Backfill livelihood components error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
