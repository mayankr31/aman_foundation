import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("Starting Livelihood Seed (Goat Rearing & Sugarcane)...");

  // Create Goat Rearing Program
  let goatProgram = await prisma.goatRearingProgram.findFirst();
  if (!goatProgram) {
    goatProgram = await prisma.goatRearingProgram.create({
      data: {
        name: "Community Goat Rearing Initiative",
        description: "Empowering rural women through sustainable goat rearing",
        totalGoats: 100
      }
    });
    console.log("Created Goat Rearing Program");
  }

  // Create Sugarcane Program
  let sugarcaneProgram = await prisma.sugarcaneProgram.findFirst();
  if (!sugarcaneProgram) {
    sugarcaneProgram = await prisma.sugarcaneProgram.create({
      data: {
        name: "Sustainable Sugarcane Farming",
        description: "Promoting high-yield sugarcane cultivation with modern techniques",
        totalLandHectares: 50.5
      }
    });
    console.log("Created Sugarcane Program");
  }

  // Create Beneficiaries
  let ben1 = await prisma.beneficiary.findUnique({ where: { enrolmentId: "BEN-GOAT-001" } });
  if (!ben1) {
    ben1 = await prisma.beneficiary.create({
      data: {
        enrolmentId: "BEN-GOAT-001",
        name: "Amina Begum",
        resilienceScore: 65,
        tier: "Tier 1"
      }
    });
    
    // Link to Goat Rearing
    await prisma.beneficiaryGoatRearing.create({
      data: {
        beneficiaryId: ben1.id,
        goatRearingProgramId: goatProgram.id,
        goatsAssigned: 5,
        investment: 15000,
        returnsAmount: 0,
        roiPercentage: 0,
        notes: "Initial allocation"
      }
    });
    console.log("Created Beneficiary 1 and linked to Goat Rearing");
  }

  let ben2 = await prisma.beneficiary.findUnique({ where: { enrolmentId: "BEN-CANE-001" } });
  if (!ben2) {
    ben2 = await prisma.beneficiary.create({
      data: {
        enrolmentId: "BEN-CANE-001",
        name: "Rahim Ali",
        resilienceScore: 70,
        tier: "Tier 2"
      }
    });
    
    // Link to Sugarcane
    await prisma.beneficiarySugarcane.create({
      data: {
        beneficiaryId: ben2.id,
        sugarcaneProgramId: sugarcaneProgram.id,
        hectaresAllotted: 1.5,
        soilType: "Alluvial",
        waterSource: "Canal",
        cropStage: "Vegetative"
      }
    });
    console.log("Created Beneficiary 2 and linked to Sugarcane Cultivation");
  }

  console.log("Livelihood Seed complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
