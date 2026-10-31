// Applies the leave-policy revision to an existing database.
// Usage: node prisma/seed-leave-policy.js
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { DEFAULT_LEAVE_CONFIGS } from "../src/lib/leavePolicyDefaults.js";
import { addDays, parseDateOnly } from "../src/lib/leavePolicy.js";

async function main() {
  console.log("Applying leave policy defaults...");

  for (const config of DEFAULT_LEAVE_CONFIGS) {
    const data = {
      ...config,
      quarterlyQuota: null,
      active: true,
      isSystem: true,
    };
    await prisma.leaveTypeConfig.upsert({
      where: { key: config.key },
      update: data,
      create: data,
    });
    console.log(`  - ${config.name} (${config.key})`);
  }

  // Keep the old Emergency Leave type for historical requests, but stop it
  // appearing in new leave applications.
  const legacyEmergency = await prisma.leaveTypeConfig.findUnique({ where: { key: "EMERGENCY" } });
  if (legacyEmergency) {
    await prisma.leaveTypeConfig.update({
      where: { key: "EMERGENCY" },
      data: { active: false, isSystem: true, sortOrder: 99 },
    });
    console.log("  - Emergency Leave deactivated for new requests");
  }

  // Compensatory leave now expires 90 days after the worked date.
  const credits = await prisma.compOffCredit.findMany({
    select: { id: true, workedDate: true },
  });
  for (const credit of credits) {
    const workedDate = parseDateOnly(credit.workedDate);
    if (!workedDate) continue;
    await prisma.compOffCredit.update({
      where: { id: credit.id },
      data: { expiresAt: addDays(workedDate, 90) },
    });
  }
  console.log(`Updated expiry for ${credits.length} comp-off credit(s).`);
  console.log("Leave policy seed completed.");
}

main()
  .catch((error) => {
    console.error("Leave policy seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
