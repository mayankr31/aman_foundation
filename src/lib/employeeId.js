import { prisma } from "@/lib/prisma";

const EMPLOYEE_ID_PREFIX = "AF-EMP";

export function getEmployeeIdPrefix(year = new Date().getFullYear()) {
  return `${EMPLOYEE_ID_PREFIX}-${year}-`;
}

export function formatEmployeeId(year, sequence) {
  return `${getEmployeeIdPrefix(year)}${String(sequence).padStart(4, "0")}`;
}

/**
 * Generates the next employee ID for the given calendar year.
 * IDs use the form AF-EMP-2026-0001. A Prisma transaction client can be
 * passed when the ID must be created inside a larger transaction.
 */
export async function generateEmployeeId(client = prisma, { year = new Date().getFullYear() } = {}) {
  const prefix = getEmployeeIdPrefix(year);
  const rows = await client.user.findMany({
    where: { employeeId: { startsWith: prefix } },
    select: { employeeId: true },
  });

  let highest = 0;
  for (const row of rows) {
    const sequence = Number.parseInt(String(row.employeeId).slice(prefix.length), 10);
    if (Number.isFinite(sequence) && sequence > highest) highest = sequence;
  }

  return formatEmployeeId(year, highest + 1);
}
