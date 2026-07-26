require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma/client");

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log("Starting data migration to unified livelihood models...\n");

  // 1. Migrate Goat Rearing Programs
  const goatPrograms = await prisma.goatRearingProgram.findMany();
  console.log(`Found ${goatPrograms.length} Goat Rearing Programs`);

  const programMap = new Map(); // oldId -> newId

  for (const gp of goatPrograms) {
    const existing = await prisma.livelihoodProgram.findFirst({
      where: { type: "goat_rearing", name: gp.name },
    });
    if (existing) {
      programMap.set(gp.id, existing.id);
      console.log(`  Skipped (already exists): ${gp.name}`);
      continue;
    }
    const np = await prisma.livelihoodProgram.create({
      data: {
        category: "NON_FARM",
        type: "goat_rearing",
        name: gp.name,
        description: gp.description,
        totalTarget: gp.totalGoats ? parseFloat(gp.totalGoats) : null,
      },
    });
    programMap.set(gp.id, np.id);
    console.log(`  Migrated: ${gp.name} -> ${np.id}`);
  }

  // 2. Migrate Sugarcane Programs
  const canePrograms = await prisma.sugarcaneProgram.findMany();
  console.log(`\nFound ${canePrograms.length} Sugarcane Programs`);

  for (const sp of canePrograms) {
    const existing = await prisma.livelihoodProgram.findFirst({
      where: { type: "sugarcane_cultivation", name: sp.name },
    });
    if (existing) {
      programMap.set(sp.id, existing.id);
      console.log(`  Skipped (already exists): ${sp.name}`);
      continue;
    }
    const np = await prisma.livelihoodProgram.create({
      data: {
        category: "FARM",
        type: "sugarcane_cultivation",
        name: sp.name,
        description: sp.description,
        totalTarget: sp.totalLandHectares ? parseFloat(sp.totalLandHectares) : null,
      },
    });
    programMap.set(sp.id, np.id);
    console.log(`  Migrated: ${sp.name} -> ${np.id}`);
  }

  // 3. Migrate Goat Rearing Assignments + Events
  const goatAssignments = await prisma.beneficiaryGoatRearing.findMany({
    include: { events: true },
  });
  console.log(`\nFound ${goatAssignments.length} Goat Rearing Assignments`);

  for (const ga of goatAssignments) {
    const newProgramId = programMap.get(ga.goatRearingProgramId);
    if (!newProgramId) {
      console.log(`  Skipped assignment ${ga.id}: no matching new program found`);
      continue;
    }

    const existing = await prisma.beneficiaryLivelihood.findFirst({
      where: { beneficiaryId: ga.beneficiaryId, programId: newProgramId },
    });

    let newAssign;
    if (existing) {
      newAssign = existing;
      console.log(`  Skipped assignment (already exists): beneficiary ${ga.beneficiaryId}`);
    } else {
      newAssign = await prisma.beneficiaryLivelihood.create({
        data: {
          beneficiaryId: ga.beneficiaryId,
          programId: newProgramId,
          attributes: {
            goatsAssigned: ga.goatsAssigned,
            investment: ga.investment,
            returnsAmount: ga.returnsAmount,
            roiPercentage: ga.roiPercentage,
            advantagesLog: ga.advantagesLog,
          },
          notes: ga.notes,
          enrolledAt: ga.createdAt,
        },
      });
      console.log(`  Migrated goat assignment: ${newAssign.id}`);
    }

    // Migrate events
    for (const evt of ga.events || []) {
      const evtExists = await prisma.livelihoodEvent.findFirst({
        where: {
          livelihoodId: newAssign.id,
          eventType: evt.eventType,
          eventDate: evt.eventDate,
        },
      });
      if (!evtExists) {
        await prisma.livelihoodEvent.create({
          data: {
            livelihoodId: newAssign.id,
            eventType: evt.eventType,
            eventDate: evt.eventDate,
            quantity: evt.quantity,
            notes: evt.notes,
            photoUrl: evt.photoUrl,
            recordedBy: evt.recordedBy,
          },
        });
      }
    }
    if (ga.events?.length > 0) console.log(`    Migrated ${ga.events.length} events`);
  }

  // 4. Migrate Sugarcane Assignments
  const caneAssignments = await prisma.beneficiarySugarcane.findMany();
  console.log(`\nFound ${caneAssignments.length} Sugarcane Assignments`);

  for (const sa of caneAssignments) {
    const newProgramId = programMap.get(sa.sugarcaneProgramId);
    if (!newProgramId) {
      console.log(`  Skipped assignment ${sa.id}: no matching new program found`);
      continue;
    }

    const existing = await prisma.beneficiaryLivelihood.findFirst({
      where: { beneficiaryId: sa.beneficiaryId, programId: newProgramId },
    });

    if (existing) {
      console.log(`  Skipped sugarcane assignment (already exists): beneficiary ${sa.beneficiaryId}`);
    } else {
      await prisma.beneficiaryLivelihood.create({
        data: {
          beneficiaryId: sa.beneficiaryId,
          programId: newProgramId,
          attributes: {
            hectaresAllotted: sa.hectaresAllotted,
            soilType: sa.soilType,
            waterSource: sa.waterSource,
            cropStage: sa.cropStage,
            estimatedYieldTons: sa.estimatedYieldTons,
            actualYieldTons: sa.actualYieldTons,
            fertilizersDistributed: sa.fertilizersDistributed,
            estimatedRevenue: sa.estimatedRevenue,
            actualRevenue: sa.actualRevenue,
          },
          notes: null,
          enrolledAt: sa.createdAt,
        },
      });
      console.log(`  Migrated sugarcane assignment`);
    }
  }

  console.log("\nMigration completed successfully!");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
