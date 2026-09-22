"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  SUBJECT_OPTIONS,
  RATING_OPTIONS,
  RATING_FIELDS,
  computeOverallScore,
} from "@/data/fellowPerformanceConstants";

function getISTDate() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const inputClass =
  "w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

export default function FellowPerformanceForm({
  performance,
  fellows = [],
  token,
  onClose,
  onSave,
}) {
  const toast = useToast();
  const isNew = !performance;

  const initialSubjectIsOther =
    performance?.subject && !SUBJECT_OPTIONS.includes(performance.subject);

  const [date, setDate] = useState(() => {
    if (performance?.date) {
      const d = new Date(performance.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    }
    return getISTDate();
  });
  const [fellowId, setFellowId] = useState(performance?.fellowId || "");
  const [classGroup, setClassGroup] = useState(performance?.classGroup || "");
  const [subjectSelect, setSubjectSelect] = useState(
    initialSubjectIsOther ? "Other" : performance?.subject || ""
  );
  const [subjectOther, setSubjectOther] = useState(initialSubjectIsOther ? performance.subject : "");
  const [ratings, setRatings] = useState(() => {
    const obj = {};
    for (const field of RATING_FIELDS) {
      obj[field.key] = performance?.[field.key] ?? "";
    }
    return obj;
  });
  const [strength, setStrength] = useState(performance?.strength || "");
  const [aod, setAod] = useState(performance?.aod || "");
  const [trend, setTrend] = useState(performance?.trend || "");
  const [saving, setSaving] = useState(false);

  const updateRating = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const overallScore = computeOverallScore(ratings);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fellowId) {
      toast.error("Please select a fellow");
      return;
    }
    if (!subjectSelect) {
      toast.error("Please select a subject");
      return;
    }
    const subject = subjectSelect === "Other" ? subjectOther.trim() : subjectSelect;
    if (!subject) {
      toast.error("Please enter the subject");
      return;
    }
    const missing = RATING_FIELDS.find((field) => !ratings[field.key]);
    if (missing) {
      toast.error(`Please rate ${missing.label}`);
      return;
    }

    setSaving(true);
    try {
      const url = isNew
        ? "/api/fellow-performances"
        : `/api/fellow-performances/${performance.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fellowId,
          date,
          classGroup,
          subject,
          ...ratings,
          strength,
          aod,
          trend,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "Fellow performance saved!" : "Fellow performance updated!");
        if (onSave) onSave(json.data);
      } else {
        toast.error(json.error || "Failed to save fellow performance");
      }
    } catch (err) {
      console.error("Save fellow performance error:", err);
      toast.error("An error occurred while saving");
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-start justify-center p-4 pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full shadow-2xl font-sans max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              {isNew ? "Add Fellow Performance" : "Edit Fellow Performance"}
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Classroom observation and performance tracking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass + " [color-scheme:light] dark:[color-scheme:dark]"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Fellow Name
              </label>
              <select
                required
                value={fellowId}
                onChange={(e) => setFellowId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select fellow...</option>
                {fellows.map((fellow) => (
                  <option key={fellow.id} value={fellow.id}>
                    {fellow.name}
                    {fellow.cohort ? ` (${fellow.cohort})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Class Group
              </label>
              <input
                type="text"
                value={classGroup}
                onChange={(e) => setClassGroup(e.target.value)}
                placeholder="e.g. Class 5 - A"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Subject
              </label>
              <select
                required
                value={subjectSelect}
                onChange={(e) => setSubjectSelect(e.target.value)}
                className={inputClass}
              >
                <option value="">Select subject...</option>
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {subjectSelect === "Other" && (
                <input
                  type="text"
                  required
                  value={subjectOther}
                  onChange={(e) => setSubjectOther(e.target.value)}
                  placeholder="Enter subject"
                  className={inputClass + " mt-3"}
                />
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-base text-on-surface">
                Ratings (1 - 4)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Overall Score
                </span>
                <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {overallScore || "—"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {RATING_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                    {field.label}
                  </label>
                  <select
                    required
                    value={ratings[field.key]}
                    onChange={(e) => updateRating(field.key, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    {RATING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Strength
              </label>
              <textarea
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                rows={3}
                placeholder="Key strengths observed..."
                className={inputClass + " resize-y"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                AOD (Area of Development)
              </label>
              <textarea
                value={aod}
                onChange={(e) => setAod(e.target.value)}
                rows={3}
                placeholder="Areas for improvement..."
                className={inputClass + " resize-y"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Trend
              </label>
              <textarea
                value={trend}
                onChange={(e) => setTrend(e.target.value)}
                rows={3}
                placeholder="Progress trend..."
                className={inputClass + " resize-y"}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : isNew ? "Save Performance" : "Update Performance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
