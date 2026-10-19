import { getAllStates, getDistricts } from "india-state-district";

export const INDIA_STATES = getAllStates().map((state) => ({
  name: state.name,
  code: state.code,
}));

const STATE_BY_NAME = new Map(
  INDIA_STATES.map((state) => [state.name.toLowerCase(), state])
);
const STATE_BY_CODE = new Map(
  INDIA_STATES.map((state) => [state.code.toUpperCase(), state])
);

/**
 * Accepts either a full state name or a state code and returns the full name.
 */
export function normalizeStateName(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  const byName = STATE_BY_NAME.get(trimmed.toLowerCase());
  if (byName) return byName.name;
  const byCode = STATE_BY_CODE.get(trimmed.toUpperCase());
  if (byCode) return byCode.name;
  return trimmed;
}

/**
 * Returns the district list for a state name or code.
 */
export function getDistrictsForState(stateValue) {
  if (!stateValue) return [];
  const trimmed = String(stateValue).trim();
  const state =
    STATE_BY_NAME.get(trimmed.toLowerCase()) ||
    STATE_BY_CODE.get(trimmed.toUpperCase());
  if (!state) return [];
  return getDistricts(state.code);
}

/**
 * Ensure a stored value is still selectable even if it is not in the
 * canonical list (keeps legacy/free-text data intact).
 */
export function withCurrentOption(options, currentValue) {
  const value = (currentValue || "").trim();
  if (!value) return options;
  const exists = options.some(
    (option) => option.toLowerCase() === value.toLowerCase()
  );
  return exists ? options : [value, ...options];
}
