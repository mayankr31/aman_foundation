"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";

const inputClass =
  "w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

export default function RatingCategoriesModal({ categories = [], token, onClose, onChanged }) {
  const toast = useToast();
  const [items, setItems] = useState(categories);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/fellow-performance-rating-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ label: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => (prev.some((c) => c.id === json.data.id) ? prev : [...prev, json.data]));
        setLabel("");
        toast.success("Rating category added!");
        if (onChanged) onChanged();
      } else {
        toast.error(json.error || "Failed to add rating category");
      }
    } catch (err) {
      console.error("Add rating category error:", err);
      toast.error("An error occurred while adding the category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Delete the "${category.label}" rating category? Existing scores are kept.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/fellow-performance-rating-categories/${category.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((c) => c.id !== category.id));
        toast.success("Rating category deleted!");
        if (onChanged) onChanged();
      } else {
        toast.error(json.error || "Failed to delete rating category");
      }
    } catch (err) {
      console.error("Delete rating category error:", err);
      toast.error("An error occurred while deleting the category");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-start justify-center p-4 pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl font-sans max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">Manage Ratings</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Add or remove the rating categories shown for every fellow performance.
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

        <div className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No rating categories yet. Add one below.
              </p>
            ) : (
              items.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest"
                >
                  <span className="text-sm font-semibold text-on-surface">{category.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    className="text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Add Rating Category
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="e.g. Classroom Management"
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !label.trim()}
              className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {saving ? "Adding..." : "Add"}
            </button>
          </div>

          <p className="text-xs text-on-surface-variant">
            Removing a category hides it from new and existing records, but previously submitted
            scores are retained.
          </p>
        </div>
      </div>
    </div>
  );
}
