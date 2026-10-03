// Canonical progression order for subject assessment levels. This is the
// intended low-to-high order and is independent of the order stored in the
// SubjectAssessmentTemplate.options array.
export const LEVEL_ORDER = [
  "beginner",
  "letter",
  "words",
  "paragraph (std 1 level text)",
  "number recognition (1-9)",
  "number recognition (11-99)",
  "subtraction",
];

const LAST_KEYS = new Set(["absent", "unknown", "n/a", "na"]);

function orderIndex(raw) {
  const key = String(raw || "").trim().toLowerCase();
  if (!key) return -1;
  if (LAST_KEYS.has(key)) return LEVEL_ORDER.length + 1;
  const idx = LEVEL_ORDER.indexOf(key);
  return idx === -1 ? LEVEL_ORDER.length : idx;
}

// Returns a new array of the options sorted by the canonical progression.
export function sortSubjectOptions(options = []) {
  return [...options].sort((a, b) => {
    const diff = orderIndex(a) - orderIndex(b);
    if (diff !== 0) return diff;
    return String(a).localeCompare(String(b));
  });
}
