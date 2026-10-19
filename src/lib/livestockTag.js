const ANIMAL_TYPE_CODES = {
  goat: "GOAT",
  cow: "COW",
  cattle: "COW",
  buffalo: "BUFF",
  hen: "POUL",
  chicken: "POUL",
  poultry: "POUL",
  duck: "DUCK",
  pig: "PIG",
  sheep: "SHEEP",
  horse: "HORSE",
  donkey: "DONKEY",
  rabbit: "RABT",
  fish: "FISH",
};

export function getAnimalTypeCode(animalType) {
  const key = String(animalType || "").trim().toLowerCase();
  if (ANIMAL_TYPE_CODES[key]) return ANIMAL_TYPE_CODES[key];
  const cleaned = key.replace(/[^a-z0-9]/g, "").toUpperCase();
  return cleaned ? cleaned.slice(0, 5) : "ANML";
}

/**
 * Build a unique, human-readable livestock ID such as LIV-GOAT-2026-0001.
 * The database column is unique, so we always verify before returning.
 */
export async function generateUniqueLivestockTag(db, animalType) {
  const code = getAnimalTypeCode(animalType);
  const year = new Date().getFullYear();
  const prefix = `LIV-${code}-${year}-`;

  const latest = await db.livestock.findFirst({
    where: { tagNumber: { startsWith: prefix } },
    orderBy: { tagNumber: "desc" },
    select: { tagNumber: true },
  });

  let nextSequence = 1;
  if (latest?.tagNumber) {
    const match = latest.tagNumber.match(/-(\d+)$/);
    if (match) nextSequence = parseInt(match[1], 10) + 1;
  }

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = `${prefix}${String(nextSequence).padStart(4, "0")}`;
    const existing = await db.livestock.findUnique({
      where: { tagNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    nextSequence += 1;
  }

  // Extremely unlikely fallback: use a timestamp suffix.
  return `${prefix}${String(Date.now()).slice(-6)}`;
}

/**
 * Create a livestock record, generating a unique tag when one is not supplied.
 * Retries on a unique-constraint race so concurrent saves cannot duplicate IDs.
 */
export async function createLivestockWithGeneratedTag(db, data, maxAttempts = 10) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const tagNumber =
      data.tagNumber || (await generateUniqueLivestockTag(db, data.animalType));

    try {
      return await db.livestock.create({
        data: { ...data, tagNumber },
      });
    } catch (error) {
      lastError = error;
      if (error?.code !== "P2002") throw error;
    }
  }

  throw lastError;
}
