export const SUBJECT_OPTIONS = [
  "English",
  "Assamese",
  "Mathematics",
  "Reading Fluency",
  "Other",
];

export const RATING_OPTIONS = [1, 2, 3, 4];

// Default rating categories. These are used to seed the database and as a
// fallback when no configured categories exist yet.
export const DEFAULT_RATING_FIELDS = [
  { key: "lessonPlan", label: "Lesson Plan" },
  { key: "culture", label: "Culture" },
  { key: "lessonFlow", label: "Lesson Flow" },
  { key: "content", label: "Content" },
  { key: "communityEngagement", label: "Community Engagement" },
];

// Backwards-compatible alias.
export const RATING_FIELDS = DEFAULT_RATING_FIELDS;

// Average all provided numeric ratings for the given categories.
export function computeOverallScore(values, categories = DEFAULT_RATING_FIELDS) {
  const nums = (categories || [])
    .map((field) => values?.[field.key])
    .filter((value) => value !== "" && value !== null && value !== undefined)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  if (!nums.length) return 0;
  const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length;
  return Math.round(avg * 100) / 100;
}
