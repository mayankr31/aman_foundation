"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import DateInput from "@/components/ui/DateInput";
import { useToast } from "@/context/ToastContext";
import { getISTDateKey } from "@/lib/time";

const TYPE_LABELS = {
  PUBLIC: "Public Holiday",
  RESTRICTED: "Restricted Holiday",
  OPTIONAL: "Optional Holiday",
};

const EMPTY_FORM = {
  id: null,
  dateKey: "",
  name: "",
  description: "",
  type: "PUBLIC",
};

function todayKey() {
  return getISTDateKey();
}

function formatHolidayDate(dateKey) {
  if (!dateKey) return "—";
  const date = new Date(`${dateKey}T12:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function HolidayManagerModal({ open, onClose, canManage, token }) {
  const toast = useToast();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const loadHolidays = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/holidays?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load holidays");
      setHolidays(json.data || []);
    } catch (err) {
      setError(err.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [token, year]);

  useEffect(() => {
    if (open) loadHolidays();
  }, [open, loadHolidays]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  const today = todayKey();
  const upcoming = useMemo(
    () => holidays.filter((holiday) => holiday.dateKey >= today),
    [holidays, today]
  );
  const past = useMemo(
    () => holidays.filter((holiday) => holiday.dateKey < today).reverse(),
    [holidays, today]
  );

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => setForm(EMPTY_FORM);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    if (!form.dateKey) {
      toast.error("Select a holiday date.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Enter the holiday name.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/holidays/${form.id}` : "/api/holidays", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dateKey: form.dateKey,
          name: form.name.trim(),
          description: form.description.trim(),
          type: form.type,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save holiday");
      }
      toast.success(form.id ? "Holiday updated." : "Holiday added.");
      resetForm();
      setYear(Number(form.dateKey.slice(0, 4)) || year);
      await loadHolidays();
    } catch (err) {
      toast.error(err.message || "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (holiday) => {
    setForm({
      id: holiday.id,
      dateKey: holiday.dateKey,
      name: holiday.name || "",
      description: holiday.description || "",
      type: holiday.type || "PUBLIC",
    });
  };

  const handleDelete = async (holiday) => {
    if (!canManage) return;
    if (!window.confirm(`Delete "${holiday.name}" on ${formatHolidayDate(holiday.dateKey)}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/holidays/${holiday.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete holiday");
      toast.success("Holiday deleted.");
      if (form.id === holiday.id) resetForm();
      await loadHolidays();
    } catch (err) {
      toast.error(err.message || "Failed to delete holiday");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 sm:px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Holiday Calendar</h2>
            <p className="text-xs text-slate-500 mt-1">
              {canManage
                ? "Add and manage the organisation's holiday dates."
                : "Holiday dates published by the admin."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-800"
            aria-label="Close holiday calendar"
          >
            <span className="material-symbols-outlined text-lg leading-none">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setYear((value) => value - 1)}
                className="rounded-full border border-slate-200 p-1.5 hover:bg-slate-50"
                aria-label="Previous year"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm font-bold text-slate-800 tabular-nums">{year}</span>
              <button
                type="button"
                onClick={() => setYear((value) => value + 1)}
                className="rounded-full border border-slate-200 p-1.5 hover:bg-slate-50"
                aria-label="Next year"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            {canManage && (
              <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                Admin mode
              </span>
            )}
          </div>

          {canManage && (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                {form.id ? "Edit holiday" : "Add holiday"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </label>
                  <DateInput
                    name="holidayDate"
                    value={form.dateKey}
                    onChange={(event) => setField("dateKey", event.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-200 bg-white text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(event) => setField("type", event.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-200 bg-white text-sm"
                  >
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setField("name", event.target.value)}
                    placeholder="e.g. Republic Day"
                    className="w-full px-3 py-2 border rounded-lg border-slate-200 bg-white text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-200 bg-white text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white"
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-full bg-primary text-xs font-bold text-white hover:bg-primary-container disabled:opacity-60"
                >
                  {saving ? "Saving..." : form.id ? "Save changes" : "Add holiday"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Loading holidays...</p>
          ) : (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Upcoming holidays
                </h3>
                {upcoming.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                    No upcoming holidays for {year}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((holiday) => (
                      <HolidayRow
                        key={holiday.id}
                        holiday={holiday}
                        isToday={holiday.dateKey === today}
                        canManage={canManage}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </section>

              {past.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Past holidays
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {past.map((holiday) => (
                      <HolidayRow
                        key={holiday.id}
                        holiday={holiday}
                        isToday={false}
                        canManage={canManage}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        muted
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HolidayRow({ holiday, isToday, canManage, onEdit, onDelete, muted = false }) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
        isToday
          ? "border-emerald-300 bg-emerald-50"
          : muted
            ? "border-slate-100 bg-slate-50/60"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-800 break-words">{holiday.name}</p>
          <span className="text-[9px] font-bold uppercase tracking-wide rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">
            {TYPE_LABELS[holiday.type] || holiday.type}
          </span>
          {isToday && (
            <span className="text-[9px] font-bold uppercase tracking-wide rounded-full bg-emerald-600 px-1.5 py-0.5 text-white">
              Today
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{formatHolidayDate(holiday.dateKey)}</p>
        {holiday.description && (
          <p className="text-xs text-slate-500 mt-1 break-words">{holiday.description}</p>
        )}
      </div>
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(holiday)}
            className="rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(holiday)}
            className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
