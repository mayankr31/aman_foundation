"use client";

import { formatStatusLabel } from "@/lib/reimbursementCategories";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  REIMBURSED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function ReimbursementStatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      } ${className}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
