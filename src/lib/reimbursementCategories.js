import { formatRoleLabel as formatSharedRoleLabel } from "@/lib/roles";

export const REIMBURSEMENT_CATEGORIES = [
  "Travel",
  "Food & Meals",
  "Accommodation",
  "Office Supplies",
  "Program / Field Activity",
  "Communication",
  "Medical",
  "Other",
];

export const PAYMENT_MODES = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Cheque",
  "Other",
];

export const REIMBURSEMENT_STATUSES = [
  "PENDING",
  "VERIFIED",
  "APPROVED",
  "REJECTED",
  "REIMBURSED",
];

export function formatINR(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "₹0";
  return `₹${numeric.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatStatusLabel(status) {
  if (!status) return "—";
  const labels = {
    PENDING: "Pending",
    VERIFIED: "Verified",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    REIMBURSED: "Reimbursed",
  };
  return labels[status] || status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatRoleLabel(role) {
  return formatSharedRoleLabel(role);
}
