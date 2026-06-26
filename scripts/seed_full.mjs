import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Starting seed...");
  // 1. Check if FELLOW role exists, otherwise create it
  let fellowRole = await prisma.role.findUnique({ where: { name: "FELLOW" } });
  if (!fellowRole) {
    fellowRole = await prisma.role.create({
      data: { name: "FELLOW", description: "Fellow Role" }
    });
    console.log("Created FELLOW role");
  }

  // 2. Create Fellows & Users
  const password = await bcrypt.hash("fellow123", 10);
  const fellowUsersData = [
    { name: "John Doe", email: "john@example.com", username: "johndoe", password, roleId: fellowRole.id, status: "ACTIVE" },
    { name: "Jane Smith", email: "jane@example.com", username: "janesmith", password, roleId: fellowRole.id, status: "ACTIVE" }
  ];

  const credentials = [];

  for (const f of fellowUsersData) {
    let user = await prisma.user.findUnique({ where: { email: f.email } });
    if (!user) {
      user = await prisma.user.create({ data: f });
      
      await prisma.fellow.create({
        data: {
          name: user.name,
          email: user.email,
          userId: user.id,
          cohort: "Cohort '24",
          address: "Sample Address",
          progress: 20
        }
      });
      credentials.push({ email: f.email, password: "fellow123", role: "FELLOW" });
      console.log(`Created fellow: ${f.name}`);
    } else {
      credentials.push({ email: f.email, password: "fellow123", role: "FELLOW" });
    }
  }

  // 3. Education Data
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "Test School",
        address: "123 Education Lane",
        status: "Active"
      }
    });
    console.log("Created School");
  }

  let student = await prisma.student.findFirst();
  if (!student) {
    await prisma.student.create({
      data: {
        studentId: "STU-001",
        name: "Alice Johnson",
        grade: "5",
        gradeGroup: "Primary",
        schoolId: school.id,
        status: "On Track"
      }
    });
    console.log("Created Student");
  }

  // 4. Livelihood Data
  let scheme = await prisma.scheme.findFirst();
  if (!scheme) {
    scheme = await prisma.scheme.create({
      data: { name: "Rural Development Scheme", description: "Test scheme" }
    });
    console.log("Created Scheme");
  }

  let beneficiary = await prisma.beneficiary.findFirst();
  if (!beneficiary) {
    beneficiary = await prisma.beneficiary.create({
      data: {
        enrolmentId: "BEN-001",
        name: "Test Beneficiary",
        resilienceScore: 60,
        tier: "Tier 1"
      }
    });
    await prisma.schemeEnrollment.create({
      data: {
        beneficiaryId: beneficiary.id,
        schemeId: scheme.id
      }
    });
    console.log("Created Beneficiary & Enrollment");
  }

  // 5. Disaster Management Data
  let incident = await prisma.disasterIncident.findFirst();
  if (!incident) {
    incident = await prisma.disasterIncident.create({
      data: {
        name: "Test Flood",
        location: "River Bank",
        type: "Flood",
        active: true
      }
    });
    console.log("Created Disaster Incident");
  }

  let resource = await prisma.resourceItem.findFirst();
  if (!resource) {
    resource = await prisma.resourceItem.create({
      data: {
        itemName: "Food Packets",
        availableStock: 500,
        unit: "Packs",
        status: "Optimal"
      }
    });
    
    await prisma.incidentResourceNeed.create({
      data: {
        incidentId: incident.id,
        resourceItemId: resource.id,
        quantityNeeded: 100,
        quantityReceived: 50
      }
    });
    console.log("Created Resource & Incident Need");
  }

  console.log("Seed complete.");
  console.log("CREDENTIALS_JSON:" + JSON.stringify(credentials));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
