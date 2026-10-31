"use client";

import { formatDate, formatDateTime, toISODateOnly } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";
import { checkInTypeLabel } from "@/lib/teamCheckIn";
import useBodyScrollLock from "@/lib/useBodyScrollLock";

function ViewSection({ title, icon, children }) {
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ViewField({ label, value, hint }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-sm text-on-surface whitespace-pre-wrap break-words">
        {value ? value : <span className="text-on-surface-variant/70 italic">—</span>}
      </p>
      {hint && <p className="text-[11px] text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}

const STATUS_CLASSES = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Blocked: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  Cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function TeamCheckInViewModal({
  checkIn,
  memberName = "",
  memberRole = "",
  canEdit = false,
  onClose,
  onEdit,
}) {
  useBodyScrollLock(Boolean(checkIn));

  if (!checkIn) return null;

  const dateLabel = formatDate(toISODateOnly(checkIn.date));
  const promises = checkIn.promises || [];
  const lastEditor = checkIn.lastEditedBy?.name;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/60 my-2 sm:my-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-outline-variant/60">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-on-surface truncate">
                Team Check-In
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                {checkInTypeLabel(checkIn.checkInType)}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {memberName || "Team member"}
              {memberRole ? ` · ${formatRoleLabel(memberRole)}` : ""} · {dateLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-4">
          <ViewSection title="Team Member Details" icon="badge">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ViewField label="Name" value={memberName} />
              <ViewField label="Role" value={memberRole ? formatRoleLabel(memberRole) : ""} />
              <ViewField label="Area of Work" value={checkIn.areaOfWork} />
              <ViewField label="Date" value={dateLabel} />
              <ViewField label="Check-In Type" value={checkInTypeLabel(checkIn.checkInType)} />
            </div>
          </ViewSection>

          <ViewSection title="Update & Agenda" icon="event_note">
            <ViewField label="Top Priorities" value={checkIn.topPriorities} />
            <ViewField label="Key Updates" value={checkIn.keyUpdates} />
            <ViewField label="To Discuss Today" value={checkIn.toDiscussToday} />
          </ViewSection>

          <ViewSection title="Reflections" icon="psychology">
            <ViewField label="Team Member's Reflection" value={checkIn.memberReflection} />
            <ViewField
              label="Director's / Manager's Notes & Feedback"
              value={checkIn.managerNotes}
            />
          </ViewSection>

          <ViewSection title="Support Needed" icon="support_agent">
            <ViewField label="Challenges" value={checkIn.challenges} />
            <ViewField label="Director's Inputs" value={checkIn.directorInputs} />
          </ViewSection>

          <ViewSection title="Promise Tracker" icon="checklist">
            {promises.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No action items recorded.</p>
            ) : (
              <>
                {/* Stacked cards on phones, table from small screens up. */}
                <div className="sm:hidden space-y-2">
                  {promises.map((promise, index) => (
                    <div
                      key={promise.id || `${promise.actionItem}-${index}`}
                      className="rounded-xl border border-outline-variant/60 p-3 space-y-1.5"
                    >
                      <p className="text-sm font-semibold text-on-surface break-words">
                        {promise.actionItem}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                        <span>Owner: {promise.owner || "—"}</span>
                        <span>
                          Deadline:{" "}
                          {promise.deadline
                            ? formatDate(toISODateOnly(promise.deadline))
                            : "—"}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          STATUS_CLASSES[promise.status] || STATUS_CLASSES.Pending
                        }`}
                      >
                        {promise.status || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60">
                        <th className="py-2 pr-3 font-bold">Action Item</th>
                        <th className="py-2 pr-3 font-bold">Owner</th>
                        <th className="py-2 pr-3 font-bold">Deadline</th>
                        <th className="py-2 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {promises.map((promise, index) => (
                        <tr key={promise.id || `${promise.actionItem}-${index}`}>
                          <td className="py-2.5 pr-3 text-on-surface font-medium align-top">
                            {promise.actionItem}
                          </td>
                          <td className="py-2.5 pr-3 text-on-surface-variant align-top">
                            {promise.owner || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-on-surface-variant align-top whitespace-nowrap">
                            {promise.deadline
                              ? formatDate(toISODateOnly(promise.deadline))
                              : "—"}
                          </td>
                          <td className="py-2.5 align-top">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                STATUS_CLASSES[promise.status] || STATUS_CLASSES.Pending
                              }`}
                            >
                              {promise.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </ViewSection>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
            <span>Submitted {formatDateTime(checkIn.submittedAt)}</span>
            {lastEditor && <span>Last updated by {lastEditor}</span>}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 rounded-b-2xl bg-surface-container-lowest flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t border-outline-variant/60">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Check-In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
