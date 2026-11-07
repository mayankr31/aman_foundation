import { prisma } from "@/lib/prisma";

// Student IDs are generated on the server so two quick submissions can never
// create duplicate rows just because the browser picked a new random ID.
const STUDENT_PREFIX = "STU";
const AFTER_SCHOOL_PREFIX = "AST";

async function nextId(client, model, prefix, year = new Date().getFullYear()) {
  const base = `${prefix}-${year}-`;
  const rows = await client[model].findMany({
    where: { studentId: { startsWith: base } },
    select: { studentId: true },
  });

  let highest = 0;
  for (const row of rows) {
    const sequence = Number.parseInt(String(row.studentId).slice(base.length), 10);
    if (Number.isFinite(sequence) && sequence > highest) highest = sequence;
  }

  return `${base}${String(highest + 1).padStart(4, "0")}`;
}

export function generateStudentId(client = prisma) {
  return nextId(client, "student", STUDENT_PREFIX);
}

export function generateAfterSchoolStudentId(client = prisma) {
  return nextId(client, "afterSchoolStudent", AFTER_SCHOOL_PREFIX);
}
