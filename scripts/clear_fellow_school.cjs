const { PrismaClient } = require("../../generated/prisma/client.js");
require("dotenv").config();

const p = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  // Null out schoolId for all fellows (resolves migration conflict)
  const res = await p.fellow.updateMany({
    where: { schoolId: { not: null } },
    data: { schoolId: null }
  });
  console.log("Cleared fellow schoolId:", res);
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); process.exit(1); });
