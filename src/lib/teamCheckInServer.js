import { dateKeyToUTCDate, getISTDateKey } from "@/lib/time";
import { normalizeCheckInType, normalizePromiseStatus } from "@/lib/teamCheckIn";

// Team member / manager shared fields.
export const TEAM_CHECK_IN_TEXT_FIELDS = [
  "areaOfWork",
  "topPriorities",
  "keyUpdates",
  "toDiscussToday",
  "memberReflection",
  "challenges",
];

// Only the Executive Director or the owner's reporting manager may write these.
export const TEAM_CHECK_IN_MANAGER_FIELDS = ["managerNotes", "directorInputs"];

function cleanText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

/** Builds a safe Prisma update payload for the text fields in the form. */
export function buildCheckInData(body, { allowManagerFields = false } = {}) {
  const data = {};

  for (const field of TEAM_CHECK_IN_TEXT_FIELDS) {
    const value = cleanText(body?.[field]);
    if (value !== undefined) data[field] = value;
  }

  if (allowManagerFields) {
    for (const field of TEAM_CHECK_IN_MANAGER_FIELDS) {
      const value = cleanText(body?.[field]);
      if (value !== undefined) data[field] = value;
    }
  }

  if (body?.checkInType !== undefined) {
    data.checkInType = normalizeCheckInType(body.checkInType);
  }

  return data;
}

/** Parses a YYYY-MM-DD key (or ISO string) into the UTC date used for storage. */
export function parseCheckInDate(value) {
  const iso = value ? String(value).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] : null;
  return dateKeyToUTCDate(iso) || dateKeyToUTCDate(getISTDateKey());
}

/**
 * Normalises promise tracker rows for storage. Rows without an action item are
 * dropped, and statuses are constrained to the shared promise status list.
 */
export function normalizePromises(list) {
  if (!Array.isArray(list)) return [];

  return list
    .map((item, index) => {
      const actionItem = String(item?.actionItem || "").trim();
      const owner = String(item?.owner || "").trim();
      const deadlineIso = item?.deadline
        ? String(item.deadline).match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
        : null;

      return {
        actionItem,
        owner: owner || null,
        deadline: deadlineIso ? dateKeyToUTCDate(deadlineIso) : null,
        status: normalizePromiseStatus(item?.status),
        order: index,
      };
    })
    .filter((item) => item.actionItem);
}

/** Stable signature used to detect whether the promise tracker changed. */
export function promiseSignature(promises) {
  return JSON.stringify(
    (promises || []).map((promise, index) => [
      index,
      promise.actionItem || "",
      promise.owner || "",
      promise.deadline ? getISTDateKey(promise.deadline) : "",
      promise.status || "Pending",
    ])
  );
}
