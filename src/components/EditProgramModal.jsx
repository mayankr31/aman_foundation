"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLivelihoodTypes } from "@/lib/useLivelihoodTypes";
import { useToast } from "@/context/ToastContext";

const inputCls =
  "px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans";
const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wide";

export default function EditProgramModal({ program, onClose, onSaved }) {
  const { token } = useAuth();
  const toast = useToast();
  const { types } = useLivelihoodTypes(token);

  const initialComponents = useMemo(() => {
    if (program?.components?.length) {
      return program.components.map((c) => ({
        typeKey: c.typeKey,
        target: c.target != null ? String(c.target) : "",
      }));
    }
    if (program?.type) {
      return [
        {
          typeKey: program.type,
          target: program.totalTarget != null ? String(program.totalTarget) : "",
        },
      ];
    }
    return [];
  }, [program]);

  const [name, setName] = useState(program?.name || "");
  const [description, setDescription] = useState(program?.description || "");
  const [totalTarget, setTotalTarget] = useState(
    program?.totalTarget != null ? String(program.totalTarget) : ""
  );
  const [components, setComponents] = useState(initialComponents);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Per-component enrolment counts (only available when the caller passes the
  // full program detail with assignments). Used to warn before removal.
  const assignmentCounts = useMemo(() => {
    const counts = {};
    (program?.assignments || []).forEach((a) => {
      const key = a.typeKey || program?.type;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [program]);

  const farmTypes = (types || []).filter((t) => t.category === "FARM");
  const nonFarmTypes = (types || []).filter((t) => t.category === "NON_FARM");

  const isSelected = (key) => components.some((c) => c.typeKey === key);

  const toggleComponent = (key) => {
    setError("");
    setComponents((prev) => {
      if (prev.some((c) => c.typeKey === key)) {
        if (prev.length === 1) {
          setError("A program must keep at least one type");
          return prev;
        }
        return prev.filter((c) => c.typeKey !== key);
      }
      return [...prev, { typeKey: key, target: "" }];
    });
  };

  const setTarget = (key, value) => {
    setComponents((prev) =>
      prev.map((c) => (c.typeKey === key ? { ...c, target: value } : c))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!program?.id || !name.trim()) return;
    if (components.length === 0) {
      setError("Select at least one program type");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/livelihood/programs/${program.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          description: description || null,
          totalTarget: totalTarget === "" ? null : totalTarget,
          components: components.map((c) => ({
            typeKey: c.typeKey,
            target: c.target === "" ? null : c.target,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const message = json.error || "Failed to update program";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("Program updated");
      onSaved?.(json.data);
      onClose?.();
    } catch (err) {
      console.error("Update program error:", err);
      setError("Failed to update program. Please try again.");
      toast.error("Failed to update program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  function TypeOption({ type }) {
    const selected = isSelected(type.key);
    const count = assignmentCounts[type.key] || 0;
    return (
      <div
        className={`rounded-lg border px-3 py-2 transition-colors ${
          selected ? "border-primary/40 bg-primary/5" : "border-outline-variant/30 bg-transparent"
        }`}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleComponent(type.key)}
            className="mt-1"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-base text-primary">
                {type.icon || "category"}
              </span>
              {type.label}
              {!type.active && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase">
                  Inactive
                </span>
              )}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">
                  {count} enrolled
                </span>
              )}
            </span>
          </span>
        </label>
        {selected && (
          <div className="mt-2 pl-7 flex items-center gap-2">
            <label className="text-[11px] text-on-surface-variant">Target</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={components.find((c) => c.typeKey === type.key)?.target ?? ""}
              onChange={(e) => setTarget(type.key, e.target.value)}
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
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
          <div>
            <h3 className="text-lg font-bold font-headline text-on-surface">Edit Program</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {program?.category === "MIXED"
                ? "Integrated program"
                : program?.category === "FARM"
                  ? "Farm program"
                  : "Non-Farm program"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>
              Program Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              placeholder="Describe program details..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Program Types</label>
            <p className="text-[11px] text-on-surface-variant">
              A type with enrolled participants cannot be removed. Remove those assignments first.
            </p>
            <div className="space-y-3">
              {farmTypes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Farm</p>
                  {farmTypes.map((type) => (
                    <TypeOption key={type.key} type={type} />
                  ))}
                </div>
              )}
              {nonFarmTypes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Non-Farm</p>
                  {nonFarmTypes.map((type) => (
                    <TypeOption key={type.key} type={type} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Overall Target (optional)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={totalTarget}
              onChange={(e) => setTotalTarget(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs font-medium text-error">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer bg-transparent text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
