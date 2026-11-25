"use client";

import { formatDate } from "@/lib/date";
import { QUOTA_PERIODS } from "@/lib/leavePolicy";

/**
 * Read-only leave balance cards shared by the apply-for-leave page and the
 * individual employee/fellow profile pages.
 */
export default function LeaveBalanceOverview({ summary, className = "" }) {
  if (!summary) return null;

  const leavesTaken = summary?.totals?.paidUsed ?? 0;
  const leavesRemaining = summary?.totals?.paidAvailable ?? 0;
  const pendingLeaves = summary?.totals?.paidPending ?? 0;
  const byQuarter = summary?.totals?.byQuarter || [];
  const availableCompOff = (summary?.compOff?.credits || []).filter(
    (credit) => credit.status === "Available"
  );
  const nextCompOffExpiry = availableCompOff
    .slice()
    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))[0];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-5 md:p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Annual Leave Taken</p>
            <h4 className="stat-value mt-2 text-on-surface">{leavesTaken}</h4>
            {pendingLeaves > 0 && (
              <p className="text-[10px] text-amber-700 mt-1">{pendingLeaves} day(s) pending approval</p>
            )}
          </div>
          <div className="p-3 md:p-4 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl">event_available</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-5 md:p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Annual Leave Available</p>
            <h4 className="stat-value mt-2 text-on-surface">{leavesRemaining}</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">Balances reset on 1 January</p>
          </div>
          <div className="p-3 md:p-4 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl">event_busy</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-5 md:p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Comp Off Available</p>
            <h4 className="stat-value mt-2 text-on-surface">{summary?.compOff?.available ?? 0}</h4>
            {nextCompOffExpiry && (
              <p className="text-[10px] text-on-surface-variant mt-1">
                Expires {formatDate(nextCompOffExpiry.expiresAt)}
              </p>
            )}
          </div>
          <div className="p-3 md:p-4 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl">sync_alt</span>
          </div>
        </div>
      </div>

      {byQuarter.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">Quarterly Overview</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {summary.yearLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {byQuarter.map((quarter) => (
              <div
                key={quarter.quarter}
                className="rounded-xl border border-outline-variant/20 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-on-surface">{quarter.label}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {quarter.months}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  <strong className="text-on-surface">{quarter.used}</strong> day(s) taken
                </p>
                {quarter.pending > 0 && (
                  <p className="text-[10px] text-amber-700">{quarter.pending} day(s) pending</p>
                )}
                {quarter.cappedTypes > 0 && (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Quarterly caps apply to {quarter.cappedTypes} leave type{quarter.cappedTypes === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3">
            Quarterly figures count approved and pending leave that falls within each quarter.
          </p>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Leave Balance</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">Annual balances reset each calendar year.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{summary.yearLabel}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Object.values(summary.types || {}).map((type) => (
            <div key={type.key} className="border border-outline-variant/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-sm text-on-surface">
                    {type.name}
                    {type.code ? <span className="text-on-surface-variant font-medium"> ({type.code})</span> : null}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{type.entitlementLabel}</p>
                </div>
                {[QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(type.quotaPeriod) ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                    {type.available} left
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-1 rounded-full whitespace-nowrap">
                    {type.quotaPeriod === QUOTA_PERIODS.UNLIMITED ? "Approval" : "Per event"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-on-surface-variant">
                <span>Used: <strong className="text-on-surface">{type.used}</strong></span>
                {type.pending > 0 && <span>Pending: <strong className="text-amber-700">{type.pending}</strong></span>}
                {type.quarterlyQuota != null && (
                  <span>Quarter cap: <strong className="text-on-surface">{type.quarterlyQuota}</strong></span>
                )}
                {type.minServiceDays != null && (
                  <span className={type.eligible ? "text-emerald-700" : "text-rose-600"}>
                    {type.eligible ? "Service requirement met" : `${type.minServiceDays}-day service required`}
                  </span>
                )}
              </div>
              {Array.isArray(type.quarters) && type.quarters.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {type.quarters.map((quarter) => (
                    <div
                      key={quarter.quarter}
                      className="rounded-md bg-surface-container/60 px-1.5 py-1 text-center"
                      title={`${quarter.months}${quarter.quota != null ? ` · ${quarter.available} of ${quarter.quota} left` : ""}`}
                    >
                      <p className="text-[8px] font-bold uppercase tracking-wide text-on-surface-variant">{quarter.label}</p>
                      <p className="text-[10px] font-semibold text-on-surface">
                        {quarter.used}
                        {quarter.quota != null ? `/${quarter.quota}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-on-surface-variant mt-3">
          Maternity extensions are applied separately as Unpaid Leave (LWP). Compensatory leave expires 90 days after the worked date.
        </p>
      </div>
    </div>
  );
}
