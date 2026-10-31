"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { formatDate, toISODateOnly } from "@/lib/date";
import { getISTDateKey } from "@/lib/time";
import { formatRoleLabel } from "@/lib/roles";
import DateInput from "@/components/ui/DateInput";
import useBodyScrollLock from "@/lib/useBodyScrollLock";
import {
  DEFAULT_CHECK_IN_TYPE,
  PROMISE_STATUSES,
  TEAM_CHECK_IN_TYPES,
} from "@/lib/teamCheckIn";

function FormSection({ title, icon, hint, children }) {
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">{icon}</span>
        <div>
          <h3 className="text-sm font-bold text-on-surface">{title}</h3>
          {hint && <p className="text-[11px] text-on-surface-variant mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, rows, disabled, hint, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary disabled:opacity-60 resize-y"
      />
      {hint && <span className="text-[11px] text-on-surface-variant">{hint}</span>}
    </div>
  );
}

function emptyPromise() {
  return { actionItem: "", owner: "", deadline: "", status: "Pending" };
}

export default function TeamCheckInFormModal({
  checkIn = null,
  memberName = "",
  memberRole = "",
  canEditManagerFields = false,
  isOwner = false,
  onClose,
  onSaved,
}) {
  const { token } = useAuth();
  const toast = useToast();
  const isNew = !checkIn;

  useBodyScrollLock(true);

  const [form, setForm] = useState(() => ({
    areaOfWork: checkIn?.areaOfWork || "",
    checkInType: checkIn?.checkInType || DEFAULT_CHECK_IN_TYPE,
    topPriorities: checkIn?.topPriorities || "",
    keyUpdates: checkIn?.keyUpdates || "",
    toDiscussToday: checkIn?.toDiscussToday || "",
    memberReflection: checkIn?.memberReflection || "",
    managerNotes: checkIn?.managerNotes || "",
    challenges: checkIn?.challenges || "",
    directorInputs: checkIn?.directorInputs || "",
  }));
  const [promises, setPromises] = useState(() =>
    (checkIn?.promises || []).map((promise) => ({
      actionItem: promise.actionItem || "",
      owner: promise.owner || "",
      deadline: toISODateOnly(promise.deadline),
      status: promise.status || "Pending",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updatePromise = (index, key, value) => {
    setPromises((prev) =>
      prev.map((promise, i) => (i === index ? { ...promise, [key]: value } : promise))
    );
  };

  const addPromise = () => setPromises((prev) => [...prev, emptyPromise()]);
  const removePromise = (index) =>
    setPromises((prev) => prev.filter((_, i) => i !== index));

  const dateLabel = formatDate(
    checkIn?.date ? toISODateOnly(checkIn.date) : getISTDateKey()
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.areaOfWork.trim()) {
      setError("Area of work is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        checkInType: form.checkInType,
        areaOfWork: form.areaOfWork,
        topPriorities: form.topPriorities,
        keyUpdates: form.keyUpdates,
        toDiscussToday: form.toDiscussToday,
        memberReflection: form.memberReflection,
        challenges: form.challenges,
        promises: promises.map((promise) => ({
          actionItem: promise.actionItem,
          owner: promise.owner,
          deadline: promise.deadline,
          status: promise.status,
        })),
      };

      if (canEditManagerFields) {
        payload.managerNotes = form.managerNotes;
        payload.directorInputs = form.directorInputs;
      }

      const res = await fetch(
        isNew ? "/api/team-check-ins" : `/api/team-check-ins/${checkIn.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not save the Team Check-In.");

      toast.success(isNew ? "Team Check-In submitted." : "Team Check-In updated.");
      onSaved?.(json.data);
    } catch (err) {
      setError(err.message || "Could not save the Team Check-In.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/60 my-2 sm:my-6">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-outline-variant/60">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-on-surface truncate">
              {isNew ? "New Team Check-In" : "Edit Team Check-In"}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isOwner
                ? "Fill in your update for this check-in."
                : "Review the update and add your notes."}
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

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
          <FormSection title="Team Member Details" icon="badge">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                  Name
                </span>
                <div className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container text-sm font-semibold text-on-surface">
                  {memberName || "—"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                  Role
                </span>
                <div className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container text-sm font-semibold text-on-surface">
                  {formatRoleLabel(memberRole)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                  Date
                </span>
                <div className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container text-sm font-semibold text-on-surface">
                  {dateLabel}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="check-in-type"
                  className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant"
                >
                  Check-In Type
                </label>
                <select
                  id="check-in-type"
                  value={form.checkInType}
                  onChange={(e) => setField("checkInType", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                >
                  {TEAM_CHECK_IN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label
                  htmlFor="area-of-work"
                  className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant"
                >
                  Area of Work <span className="text-error">*</span>
                </label>
                <input
                  id="area-of-work"
                  type="text"
                  value={form.areaOfWork}
                  onChange={(e) => setField("areaOfWork", e.target.value)}
                  placeholder="e.g. Education program — 3 schools"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Update & Agenda"
            icon="event_note"
            hint="Usually filled by the team member; the reporting manager or Executive Director may also edit."
          >
            <TextField
              label="Top Priorities"
              value={form.topPriorities}
              onChange={(value) => setField("topPriorities", value)}
              rows={3}
              placeholder="What are the 1-3 main things you are focused on right now?"
            />
            <TextField
              label="Key Updates"
              value={form.keyUpdates}
              onChange={(value) => setField("keyUpdates", value)}
              rows={3}
              placeholder="Brief progress report since last meeting"
            />
            <TextField
              label="To Discuss Today"
              value={form.toDiscussToday}
              onChange={(value) => setField("toDiscussToday", value)}
              rows={2}
              placeholder="Specific topics brought to this meeting"
            />
          </FormSection>

          <FormSection title="Reflections" icon="psychology">
            <TextField
              label="Team Member's Reflection"
              value={form.memberReflection}
              onChange={(value) => setField("memberReflection", value)}
              rows={3}
              placeholder="Your perspective on the work, challenges, or Aman values"
            />
            <TextField
              label="Director's / Manager's Notes & Feedback"
              value={form.managerNotes}
              onChange={(value) => setField("managerNotes", value)}
              rows={3}
              disabled={!canEditManagerFields}
              hint={
                canEditManagerFields
                  ? undefined
                  : "Only the Executive Director or your reporting manager can fill this."
              }
              placeholder="Observation and guidance"
            />
          </FormSection>

          <FormSection title="Support Needed" icon="support_agent">
            <TextField
              label="Challenges"
              value={form.challenges}
              onChange={(value) => setField("challenges", value)}
              rows={3}
              placeholder="What is slowing down the work"
            />
            <TextField
              label="Director's Inputs"
              value={form.directorInputs}
              onChange={(value) => setField("directorInputs", value)}
              rows={3}
              disabled={!canEditManagerFields}
              hint={
                canEditManagerFields
                  ? undefined
                  : "Only the Executive Director or your reporting manager can fill this."
              }
              placeholder="Specific decisions, resources, or connections needed from the Director"
            />
          </FormSection>

          <FormSection
            title="Promise Tracker"
            icon="checklist"
            hint="Action items agreed in this check-in."
          >
            {promises.length === 0 ? (
              <p className="text-xs text-on-surface-variant">
                No action items yet.
              </p>
            ) : (
              <div className="rounded-xl border border-outline-variant/60 divide-y divide-outline-variant/40">
                {promises.map((promise, index) => (
                  <div
                    key={`promise-${index}`}
                    className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3"
                  >
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Action Item
                      </label>
                      <input
                        type="text"
                        value={promise.actionItem}
                        onChange={(e) => updatePromise(index, "actionItem", e.target.value)}
                        placeholder="e.g. APF Report"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Owner
                      </label>
                      <input
                        type="text"
                        value={promise.owner}
                        onChange={(e) => updatePromise(index, "owner", e.target.value)}
                        placeholder="Owner"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Deadline
                      </label>
                      <div className="w-full">
                        <DateInput
                          value={promise.deadline}
                          onChange={(e) => updatePromise(index, "deadline", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Status
                      </label>
                      <select
                        value={promise.status}
                        onChange={(e) => updatePromise(index, "status", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant bg-transparent text-base sm:text-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                      >
                        {PROMISE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:col-span-1 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removePromise(index)}
                        className="min-w-10 min-h-10 flex items-center justify-center rounded-full text-error hover:bg-error/10 transition-colors cursor-pointer"
                        aria-label="Remove action item"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addPromise}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Action Item
            </button>
          </FormSection>

          {error && (
            <p className="text-xs font-semibold text-error bg-error/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 -mb-5 px-4 sm:px-6 py-3 rounded-b-2xl bg-surface-container-lowest border-t border-outline-variant/60 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isNew
                ? "Submit Check-In"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
