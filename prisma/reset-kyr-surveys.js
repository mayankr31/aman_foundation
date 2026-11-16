/**
 * Deletes every saved KYR (ResilienceSurvey) submission.
 *
 * The KYR form was replaced by the official Resilience Measurement Tool, and
 * its question ids were renumbered to match the paper form. Old responses are
 * therefore no longer interpretable and are safe to remove.
 *
 * Usage:
 *   node prisma/reset-kyr-surveys.js             # dry run, prints the count
 *   node prisma/reset-kyr-surveys.js --confirm   # deletes all submissions
 */
import { prisma } from "../src/lib/prisma.js";

const confirmed = process.argv.includes("--confirm");

async function main() {
  const total = await prisma.resilienceSurvey.count();
  console.log(`KYR submissions currently stored: ${total}`);

  if (!confirmed) {
    console.log("");
    console.log("Dry run only — nothing was deleted.");
    console.log("Re-run with --confirm to delete all KYR submissions:");
    console.log("  node prisma/reset-kyr-surveys.js --confirm");
    return;
  }

  const { count } = await prisma.resilienceSurvey.deleteMany({});
  console.log(`Deleted ${count} KYR submission(s).`);
}

main()
  .catch((error) => {
    console.error("Failed to reset KYR submissions:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
