// @ts-check
// Script to clear fellow schoolId before migration - uses Next.js lib path
// Run from project root: node --experimental-vm-modules scripts/clear_fellow_school.mjs

import { createRequire } from "module";
import { pathToFileURL } from "url";
import { readFileSync } from "fs";

// Load .env manually
const envContent = readFileSync(".env", "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const res = await prisma.fellow.updateMany({
    where: { schoolId: { not: null } },
    data: { schoolId: null }
  });
  console.log("✓ Cleared fellow schoolId:", res.count, "records updated");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
