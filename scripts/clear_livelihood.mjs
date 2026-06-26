import { prisma } from "../src/lib/prisma.js";

async function clearLivelihoodData() {
  console.log("Clearing all livelihood data...");
  
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await prisma.beneficiaryGoatRearing.deleteMany({});
    await prisma.beneficiarySugarcane.deleteMany({});
    await prisma.goatRearingProgram.deleteMany({});
    await prisma.sugarcaneProgram.deleteMany({});
    await prisma.schemeEnrollment.deleteMany({});
    await prisma.scheme.deleteMany({});
    await prisma.beneficiary.deleteMany({}); // Due to onDelete: Cascade, this will also delete FamilyMember, Livestock, Surveys, etc.

    console.log("Successfully cleared all livelihood data.");
  } catch (error) {
    console.error("Error clearing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearLivelihoodData();
