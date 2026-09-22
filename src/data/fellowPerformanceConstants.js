export const SUBJECT_OPTIONS = [
  "English",
  "Assamese",
  "Mathematics",
  "Reading Fluency",
  "Other",
];

export const RATING_OPTIONS = [1, 2, 3, 4];

export const RATING_FIELDS = [
  { key: "lessonPlan", label: "Lesson Plan" },
  { key: "culture", label: "Culture" },
  { key: "lessonFlow", label: "Lesson Flow" },
  { key: "content", label: "Content" },
  { key: "communityEngagement", label: "Community Engagement" },
];

export function computeOverallScore(values) {
  const nums = RATING_FIELDS.map((field) => values?.[field.key])
    .filter((value) => value !== "" && value !== null && value !== undefined)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  if (!nums.length) return 0;
  const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length;
  return Math.round(avg * 100) / 100;
}
