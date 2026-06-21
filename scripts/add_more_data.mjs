import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const schools = await prisma.school.findMany();
  const school1 = schools[0];
  const school2 = schools[1];

  console.log("Adding fellows...");
  const fellows = [
    { name: "Priya Sharma", cohort: "2025", gender: "Female", email: "priya@example.com" },
    { name: "Rahul Verma", cohort: "2025", gender: "Male", email: "rahul@example.com" },
    { name: "Anita Desai", cohort: "2024", gender: "Female", email: "anita@example.com" },
    { name: "Suresh Kumar", cohort: "2025", gender: "Male", email: "suresh@example.com" },
    { name: "Zara Ali", cohort: "2024", gender: "Female", email: "zara@example.com" },
    { name: "Kiran Patel", cohort: "2025", gender: "Other", email: "kiran@example.com" },
    { name: "Deepak Singh", cohort: "2025", gender: "Male", email: "deepak@example.com" },
    { name: "Meera Reddy", cohort: "2024", gender: "Female", email: "meera@example.com" }
  ];

  for (const f of fellows) {
    try {
      await prisma.fellow.create({ data: f });
      console.log(`Created fellow ${f.name}`);
    } catch (e) {
       console.log(`Failed (maybe exists): ${f.name}`);
    }
  }

  console.log("Adding students...");
  const students = [
    { name: "Aarav Gupta", gender: "Male", grade: "5th", gradeGroup: "Primary", schoolId: school1?.id },
    { name: "Diya Shah", gender: "Female", grade: "6th", gradeGroup: "Middle", schoolId: school1?.id },
    { name: "Neha Joshi", gender: "Female", grade: "4th", gradeGroup: "Primary", schoolId: school2?.id },
    { name: "Rohan Das", gender: "Male", grade: "8th", gradeGroup: "Middle", schoolId: school2?.id },
    { name: "Sneha Iyer", gender: "Female", grade: "5th", gradeGroup: "Primary", schoolId: school1?.id },
    { name: "Aryan Nair", gender: "Male", grade: "7th", gradeGroup: "Middle", schoolId: school1?.id },
    { name: "Ananya Mishra", gender: "Female", grade: "3rd", gradeGroup: "Primary", schoolId: school2?.id },
    { name: "Kavya Menon", gender: "Female", grade: "6th", gradeGroup: "Middle", schoolId: school1?.id },
    { name: "Arjun Bhat", gender: "Male", grade: "4th", gradeGroup: "Primary", schoolId: school2?.id },
    { name: "Pooja Reddy", gender: "Female", grade: "5th", gradeGroup: "Primary", schoolId: school1?.id },
    { name: "Samir Khan", gender: "Male", grade: "7th", gradeGroup: "Middle", schoolId: school2?.id },
    { name: "Riya Sen", gender: "Female", grade: "6th", gradeGroup: "Middle", schoolId: school1?.id },
    { name: "Amitabh Bose", gender: "Male", grade: "8th", gradeGroup: "Middle", schoolId: school1?.id },
    { name: "Nisha Varma", gender: "Female", grade: "5th", gradeGroup: "Primary", schoolId: school2?.id },
    { name: "Tariq Ali", gender: "Male", grade: "6th", gradeGroup: "Middle", schoolId: school2?.id }
  ];

  let idCounter = 1000;
  for (const s of students) {
    try {
      await prisma.student.create({
        data: {
          ...s,
          studentId: `STU${Date.now()}${idCounter++}`
        }
      });
      console.log(`Created student ${s.name}`);
    } catch (e) {
      console.log(`Failed student: ${s.name}`);
    }
  }

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
