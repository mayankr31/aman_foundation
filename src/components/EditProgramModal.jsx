"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLivelihoodTypes } from "@/lib/useLivelihoodTypes";
import { useToast } from "@/context/ToastContext";

export default function EditProgramModal({ program, onClose, onSaved }) {
  const { token } = useAuth();
  const toast = useToast();
  const { getTypesByCategory } = useLivelihoodTypes(token);
  const [name, setName] = useState(program?.name || "");
  const [description, setDescription] = useState(program?.description || "");
  const [type, setType] = useState(program?.type || "");
  const [totalTarget, setTotalTarget] = useState(
    program?.totalTarget != null ? String(program.totalTarget) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const types = getTypesByCategory(program?.category, { includeInactive: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!program?.id || !name.trim()) return;
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
          type,
          totalTarget: totalTarget === "" ? null : totalTarget,
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
              {program?.category === "FARM" ? "Farm program" : "Non-Farm program"}
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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Program Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Program Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
            >
              {types.length === 0 && <option value={type}>{type || "Select type"}</option>}
              {types.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="Describe program details..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Target
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={totalTarget}
              onChange={(e) => setTotalTarget(e.target.value)}
              placeholder="e.g. 25.5"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
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
