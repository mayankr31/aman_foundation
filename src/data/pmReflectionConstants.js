export const COMPETENCY_CATEGORIES = [
  { key: "C", label: "Connect", prefix: "C" },
  { key: "E", label: "Envision", prefix: "E" },
  { key: "P", label: "Plan", prefix: "P" },
  { key: "X", label: "Execute", prefix: "X" },
  { key: "R", label: "Reflect", prefix: "R" },
];

export const CATEGORY_COUNT = 5;

export const COMPETENCY_KEYS = (() => {
  const result = [];
  for (const cat of COMPETENCY_CATEGORIES) {
    for (let i = 1; i <= CATEGORY_COUNT; i++) {
      result.push(`${cat.prefix}${i}`);
    }
  }
  return result;
})();

export const LEVELS = ["Novice", "Beginner", "Proficient", "Advanced"];

export const MATRIX_CELLS = [
  { key: "HS_HW", label: "High Support, High Willingness" },
  { key: "HS_LW", label: "High Support, Low Willingness" },
  { key: "LS_HW", label: "Low Support, High Willingness" },
  { key: "LS_LW", label: "Low Support, Low Willingness" },
];

export const MATRIX_COLORS = [
  { hex: "#4ade80", label: "Green" },
  { hex: "#facc15", label: "Yellow" },
  { hex: "#fb923c", label: "Orange" },
  { hex: "#f87171", label: "Red" },
  { hex: "#60a5fa", label: "Blue" },
];

export function getDefaultResponses() {
  const obj = {};
  for (const key of COMPETENCY_KEYS) {
    obj[key] = "";
  }
  return obj;
}

export function getDefaultMatrix() {
  const obj = {};
  for (const cell of MATRIX_CELLS) {
    obj[cell.key] = "#d1d5db";
  }
  return obj;
}
