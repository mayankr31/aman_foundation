"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import LivelihoodTypeEditor from "@/components/LivelihoodTypeEditor";

export default function LivelihoodTypesModal({ category, token, onClose, onChanged }) {
  const toast = useToast();
  const accent = category === "FARM" ? "emerald" : "amber";
  const accentBg = category === "FARM" ? "#047857" : "#d97706";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "editor"
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/livelihood/types?category=${category}&includeInactive=1`, { headers });
        const json = await res.json();
        if (json.success) setItems(json.data || []);
      } catch (err) {
        console.error("Load livelihood types error:", err);
      }
      setLoading(false);
    }
    load();
  }, [token, category]);

  const upsertItem = (saved) => {
    setItems((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved];
    });
  };

  const handleSaved = (saved) => {
    upsertItem(saved);
    setView("list");
    setEditing(null);
    if (onChanged) onChanged();
  };

  const setActive = async (type, active) => {
    try {
      const res = await fetch(`/api/livelihood/types/${type.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active }),
      });
      const json = await res.json();
      if (json.success) {
        upsertItem(json.data);
        toast.success(active ? "Type activated!" : "Type deactivated!");
        if (onChanged) onChanged();
      } else {
        toast.error(json.error || "Failed to update type");
      }
    } catch (err) {
      console.error("Update type active error:", err);
      toast.error("An error occurred while updating the type");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-start justify-center p-4 pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl font-sans max-h-[88vh] overflow-y-auto text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              Manage {category === "FARM" ? "Farm" : "Non-Farm"} Types
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Add, edit, or deactivate the program types available for this category.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {view === "editor" ? (
          <div className="px-6 py-6">
            <button
              type="button"
              onClick={() => { setView("list"); setEditing(null); }}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-on-surface transition-colors mb-4 cursor-pointer border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to types
            </button>
            <LivelihoodTypeEditor
              category={category}
              token={token}
              initial={editing}
              onCancel={() => { setView("list"); setEditing(null); }}
              onSaved={handleSaved}
            />
          </div>
        ) : (
          <div className="px-6 py-6 space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setEditing(null); setView("editor"); }}
                className="px-4 py-2 rounded-full text-white font-semibold transition-colors cursor-pointer border-none text-sm flex items-center gap-1.5"
                style={{ backgroundColor: accentBg }}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Type
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-on-surface-variant text-center py-8">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8 italic">
                No types yet. Click &ldquo;Add Type&rdquo; to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((type) => (
                  <div
                    key={type.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest ${type.active ? "" : "opacity-60"}`}
                  >
                    <span className={`material-symbols-outlined text-${accent}-600 mt-0.5`}>{type.icon || "category"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-on-surface">{type.label}</span>
                        {!type.active && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">{type.key}</p>
                      {type.description && (
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">{type.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setEditing(type); setView("editor"); }}
                        className="p-1.5 rounded-full hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer border-none bg-transparent"
                        title="Edit type"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      {type.active ? (
                        <button
                          type="button"
                          onClick={() => setActive(type, false)}
                          className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                          title="Deactivate type"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActive(type, true)}
                          className="p-1.5 rounded-full hover:bg-green-100 text-slate-400 hover:text-green-600 transition-colors cursor-pointer border-none bg-transparent"
                          title="Reactivate type"
                        >
                          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-on-surface-variant pt-2 border-t border-outline-variant/10">
              Deactivating a type hides it from new programs but existing programs keep working.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
