"use client";

import { useEffect } from "react";
import { formatDate } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";
import { POLICY_FLAGS, getPolicyFlagLabel } from "@/lib/leavePolicy";

function formatStoredDates(value) {
  return String(value || "").replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match) => formatDate(match));
}

function DetailRow({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <div className="text-sm text-on-surface mt-1 break-words">{children}</div>
    </div>
  );
}

export default function LeaveDetailsModal({ leave, onClose }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!leave) return null;

  const flags = (leave.policyFlags || []).filter(
    (flag) => flag !== POLICY_FLAGS.MEDICAL_CERTIFICATE_REQUIRED
  );
  const statusClass =
    leave.status === "APPROVED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : leave.status === "REJECTED"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-surface-container-lowest flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-outline-variant/20">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-on-surface break-words">Leave Details</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {leave.user?.name || "Unknown applicant"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            aria-label="Close leave details"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
              {leave.status}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
              {leave.days ? `${leave.days} day${Number(leave.days) === 1 ? "" : "s"}` : "Duration not recorded"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Applicant">{leave.user?.name || "—"}</DetailRow>
            <DetailRow label="Role">{formatRoleLabel(leave.user?.role)}</DetailRow>
            <DetailRow label="Leave Type">{leave.type || "—"}</DetailRow>
            <DetailRow label="Dates">{formatStoredDates(leave.dates) || "—"}</DetailRow>
            <DetailRow label="Submitted">{formatDate(leave.createdAt)}</DetailRow>
          </div>

          {(leave.compOffWorkedDate ||
            leave.holidayName ||
            leave.medicalCertificateRequired ||
            flags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {leave.compOffWorkedDate && (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-100 px-2 py-1 rounded">
                  Comp-off worked: {formatDate(leave.compOffWorkedDate)}
                </span>
              )}
              {leave.holidayName && (
                <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 border border-sky-100 px-2 py-1 rounded">
                  Holiday: {leave.holidayName}
                </span>
              )}
              {leave.medicalCertificateRequired && (
                <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-100 px-2 py-1 rounded">
                  Medical certificate required at office
                </span>
              )}
              {flags.map((flag) => (
                <span
                  key={flag}
                  className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-100 px-2 py-1 rounded"
                >
                  {getPolicyFlagLabel(flag)}
                </span>
              ))}
            </div>
          )}

          <DetailRow label="Reason">
            <p className="whitespace-pre-wrap break-words text-sm text-on-surface leading-relaxed">
              {leave.reason || "No reason provided."}
            </p>
          </DetailRow>

          {leave.status === "REJECTED" && leave.rejectionReason && (
            <DetailRow label="Rejection Reason">
              <p className="whitespace-pre-wrap break-words text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-lg px-3 py-2 leading-relaxed">
                {leave.rejectionReason}
              </p>
            </DetailRow>
          )}
        </div>

        <div className="flex justify-end p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
