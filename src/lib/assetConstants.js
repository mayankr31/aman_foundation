// Client-safe asset display constants.
export const ASSET_STATUSES = ["ASSIGNED", "RETURNED"];

export const ASSET_STATUS_LABELS = {
  ASSIGNED: "Assigned",
  RETURNED: "Returned",
};

export const ASSET_STATUS_CLASSES = {
  ASSIGNED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  RETURNED: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export const ASSET_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Mobile Phone",
  "Tablet",
  "SIM Card",
  "Monitor",
  "Printer",
  "Camera",
  "Vehicle",
  "Furniture",
  "Field Equipment",
  "Other",
];

export function formatAssetStatus(status) {
  return ASSET_STATUS_LABELS[status] || String(status || "—").replaceAll("_", " ");
}

export function getActiveAssetAssignment(asset) {
  return (asset?.assignments || []).find((assignment) => !assignment.returnedAt) || null;
}

export function getLatestAssetAssignment(asset) {
  return (asset?.assignments || [])[0] || null;
}

export function getAssetStatus(asset) {
  return getActiveAssetAssignment(asset) ? "ASSIGNED" : "RETURNED";
}
