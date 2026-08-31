"use client";

import { useState } from "react";
import {
  COMPETENCY_CATEGORIES,
  CATEGORY_COUNT,
  LEVELS,
  MATRIX_CELLS,
  MATRIX_COLORS,
  getDefaultResponses,
  getDefaultMatrix,
} from "@/data/pmReflectionConstants";
import { useToast } from "@/context/ToastContext";

function getISTDate() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PMReflectionForm({
  fellowId,
  reflection,
  token,
  onClose,
  onSave,
}) {
  const toast = useToast();
  const isNew = !reflection;
  const [date, setDate] = useState(() => {
    if (reflection?.date) {
      const d = new Date(reflection.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return getISTDate();
  });
  const [responses, setResponses] = useState(() => ({
    ...getDefaultResponses(),
    ...(reflection?.responses && typeof reflection.responses === "object"
      ? reflection.responses
      : {}),
  }));
  const [matrix, setMatrix] = useState(() => ({
    ...getDefaultMatrix(),
    ...(reflection?.matrix && typeof reflection.matrix === "object"
      ? reflection.matrix
      : {}),
  }));
  const [notes, setNotes] = useState(reflection?.notes || "");
  const [saving, setSaving] = useState(false);

  const updateResponse = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const updateMatrix = (key, value) => {
    setMatrix((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isNew
        ? `/api/fellows/${fellowId}/pm-reflections`
        : `/api/fellows/${fellowId}/pm-reflections/${reflection.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          responses,
          matrix,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "PM reflection saved!" : "PM reflection updated!");
        if (onSave) onSave(json.data);
      } else {
        toast.error(json.error || "Failed to save PM reflection");
      }
    } catch (err) {
      console.error("Save PM reflection error:", err);
      toast.error("An error occurred while saving");
    }
    setSaving(false);
  };

  const dropdownClass =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-headline font-bold text-xl text-on-surface">
            POST LDJC PM Reflection
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Leadership Development Journey Conversation review
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-10 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-semibold text-on-surface-variant">
              Reflection Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={dropdownClass + " sm:max-w-xs"}
            />
          </div>

          {COMPETENCY_CATEGORIES.map((category) => (
            <div
              key={category.key}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10"
            >
              <h3 className="font-headline font-bold text-base text-on-surface mb-5">
                {category.label} ({category.prefix}1 - {category.prefix}
                {CATEGORY_COUNT})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: CATEGORY_COUNT }, (_, i) => {
                  const key = `${category.prefix}${i + 1}`;
                  return (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                        {key}
                      </label>
                      <select
                        value={responses[key] || ""}
                        onChange={(e) => updateResponse(key, e.target.value)}
                        required
                        className={dropdownClass}
                      >
                        <option value="">Select level...</option>
                        {LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-2">
              Competency Matrix
            </h3>
            <p className="text-sm text-on-surface-variant mb-5">
              Select a color for each cell to indicate the fellow&apos;s current standing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MATRIX_CELLS.map((cell) => (
                <div
                  key={cell.key}
                  className="rounded-xl p-4 border border-outline-variant/10 transition-colors"
                  style={{ backgroundColor: `${matrix[cell.key] || "#d1d5db"}22` }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: matrix[cell.key] || "#d1d5db" }}
                      ></span>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{cell.key.replace("_", ", ")}</p>
                        <p className="text-xs text-on-surface-variant">{cell.label}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MATRIX_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        title={color.label}
                        onClick={() => updateMatrix(cell.key, color.hex)}
                        className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                          matrix[cell.key] === color.hex
                            ? "ring-2 ring-on-surface ring-offset-2 scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      ></button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <label className="block font-headline font-bold text-base text-on-surface mb-3">
              Notes for the Fellow
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes, feedback and areas for the fellow to focus on... (use - for bullet points)"
              rows={6}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pb-8">
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
              {saving ? "Saving..." : isNew ? "Save Reflection" : "Update Reflection"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
