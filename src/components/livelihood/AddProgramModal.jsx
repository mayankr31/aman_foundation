"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLivelihoodTypes } from "@/lib/useLivelihoodTypes";
import { useToast } from "@/context/ToastContext";

const inputCls =
  "px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans";
const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wide";

function TypeGroup({ title, types, selected, targets, onToggle, onTarget }) {
  if (types.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{title}</p>
      <div className="grid gap-2">
        {types.map((type) => {
          const checked = selected.includes(type.key);
          return (
            <div
              key={type.key}
              className={`rounded-lg border px-3 py-2 transition-colors ${
                checked
                  ? "border-primary/40 bg-primary/5"
                  : "border-outline-variant/30 bg-transparent"
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(type.key)}
                  className="mt-1 accent-[var(--color-primary,#0f766e)]"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-base text-primary">
                      {type.icon || "category"}
                    </span>
                    {type.label}
                  </span>
                  {type.description && (
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">
                      {type.description}
                    </span>
                  )}
                </span>
              </label>
              {checked && (
                <div className="mt-2 pl-7 flex items-center gap-2">
                  <label className="text-[11px] text-on-surface-variant">Target</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={targets[type.key] ?? ""}
                    onChange={(e) => onTarget(type.key, e.target.value)}
                    placeholder={`e.g. 25 ${type.programTargetUnit || "units"}`}
                    className="w-40 px-3 py-1.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    {type.programTargetUnit || "units"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AddProgramModal({ category, onClose, onCreated }) {
  const { token } = useAuth();
  const toast = useToast();
  const { getTypesByCategory } = useLivelihoodTypes(token);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState([]);
  const [targets, setTargets] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const farmTypes = getTypesByCategory("FARM");
  const nonFarmTypes = getTypesByCategory("NON_FARM");

  const visibleTypes = useMemo(() => {
    if (category === "MIXED") return [...farmTypes, ...nonFarmTypes];
    return getTypesByCategory(category);
  }, [category, farmTypes, nonFarmTypes, getTypesByCategory]);

  const toggleType = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setError("");
  };

  const setTarget = (key, value) => {
    setTargets((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Program name is required");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one program type");
      return;
    }

    if (category === "MIXED") {
      const hasFarm = selected.some((key) => farmTypes.some((t) => t.key === key));
      const hasNonFarm = selected.some((key) => nonFarmTypes.some((t) => t.key === key));
      if (!hasFarm || !hasNonFarm) {
        setError("An integrated program must include at least one Farm and one Non-Farm type");
        return;
      }
    }

    setSaving(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch("/api/livelihood/programs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          description: description || null,
          components: selected.map((typeKey) => ({
            typeKey,
            target: targets[typeKey] === "" ? null : targets[typeKey] ?? null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to create program");
        return;
      }
      toast.success("Program created");
      onCreated?.(json.data);
      onClose?.();
    } catch (err) {
      console.error("Create program error:", err);
      setError("Failed to create program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-5 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-on-surface">
              {category === "MIXED"
                ? "Add Integrated Program"
                : `Add ${category === "FARM" ? "Farm" : "Non-Farm"} Program`}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Select one or more activity types for this program.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined font-bold">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Program Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kalgachia Integrated Livelihood 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Description</label>
            <textarea
              placeholder="Describe program details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              rows="2"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className={labelCls}>Program Types</label>
            {category === "MIXED" ? (
              <>
                <TypeGroup
                  title="Farm"
                  types={farmTypes}
                  selected={selected}
                  targets={targets}
                  onToggle={toggleType}
                  onTarget={setTarget}
                />
                <TypeGroup
                  title="Non-Farm"
                  types={nonFarmTypes}
                  selected={selected}
                  targets={targets}
                  onToggle={toggleType}
                  onTarget={setTarget}
                />
              </>
            ) : (
              <TypeGroup
                title={`${category === "FARM" ? "Farm" : "Non-Farm"} activities`}
                types={visibleTypes}
                selected={selected}
                targets={targets}
                onToggle={toggleType}
                onTarget={setTarget}
              />
            )}
          </div>

          {error && <p className="text-xs font-medium text-error">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer border-none disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
