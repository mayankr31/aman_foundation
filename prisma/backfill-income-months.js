import { prisma } from "../src/lib/prisma.js";

function getPeriod(record) {
  const year = Number(record.incomeYear);
  const month = Number(record.incomeMonth);
  if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
    return { year, month };
  }

  const date = new Date(record.incomeDate);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function firstDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0, 0));
}

function combine(values, separator) {
  const unique = [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  return unique.join(separator);
}

async function main() {
  const records = await prisma.incomeRecord.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (records.length === 0) {
    console.log("No income records found. Nothing to backfill.");
    return;
  }

  const groups = new Map();
  for (const record of records) {
    const { year, month } = getPeriod(record);
    const key = `${record.beneficiaryId}:${year}:${month}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...record, _year: year, _month: month });
  }

  let updated = 0;
  let duplicatesMerged = 0;

  for (const group of groups.values()) {
    // Prefer a record that already has month/year populated, then the oldest
    // submission. This keeps the script safe to re-run.
    const sorted = [...group].sort((a, b) => {
      const aHasPeriod = Boolean(a.incomeYear && a.incomeMonth);
      const bHasPeriod = Boolean(b.incomeYear && b.incomeMonth);
      if (aHasPeriod !== bHasPeriod) return aHasPeriod ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const keeper = sorted[0];
    const year = keeper._year;
    const month = keeper._month;
    const amount = group.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
    const source = combine(group.map((record) => record.source), " + ");
    const notes = combine(group.map((record) => record.notes), " | ");

    if (group.length > 1) {
      await prisma.incomeRecord.deleteMany({
        where: { id: { in: sorted.slice(1).map((record) => record.id) } },
      });
      duplicatesMerged += group.length - 1;
    }

    await prisma.incomeRecord.update({
      where: { id: keeper.id },
      data: {
        incomeMonth: month,
        incomeYear: year,
        incomeDate: firstDayOfMonth(year, month),
        amount,
        source: source || null,
        notes: notes || null,
      },
    });
    updated += 1;
  }

  console.log(
    `Income backfill complete: ${updated} monthly record(s) updated, ${duplicatesMerged} duplicate record(s) merged.`
  );
}

main()
  .catch((error) => {
    console.error("Income backfill error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
