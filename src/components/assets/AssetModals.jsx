"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";
import {
  ASSET_CATEGORIES,
  ASSET_STATUS_CLASSES,
  formatAssetStatus,
  getActiveAssetAssignment,
} from "@/lib/assetConstants";

const inputClass =
  "mt-1 w-full min-w-0 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm text-on-surface focus:outline-none focus:border-primary";
const labelClass =
  "text-[10px] font-bold uppercase tracking-widest text-on-surface-variant";

function ModalShell({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[210] bg-black/60 flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-7 relative`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-2"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>
        <div className="pr-10 mb-5">
          <h2 className="text-xl font-bold text-on-surface break-words">{title}</h2>
          {subtitle && <p className="text-xs text-on-surface-variant mt-1 break-words">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className="text-[10px] font-semibold text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

export function AssetFormModal({ open, asset, assignableUsers = [], onClose, onSaved, token }) {
  const [form, setForm] = useState({
    assetCode: "",
    name: "",
    category: "",
    customCategory: "",
    serialNumber: "",
    description: "",
    condition: "",
    notes: "",
    assignToUserId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(asset);

  useEffect(() => {
    if (!open) return;
    const storedCategory = asset?.category || "";
    const categoryIsKnown = ASSET_CATEGORIES.includes(storedCategory);
    setError("");
    setForm({
      assetCode: asset?.assetCode || "",
      name: asset?.name || "",
      category: storedCategory ? (categoryIsKnown ? storedCategory : "Other") : "",
      customCategory: storedCategory && !categoryIsKnown ? storedCategory : "",
      serialNumber: asset?.serialNumber || "",
      description: asset?.description || "",
      condition: asset?.condition || "",
      notes: asset?.notes || "",
      assignToUserId: "",
    });
  }, [open, asset]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.assetCode.trim()) return setError("Asset ID is required.");
    if (!form.name.trim()) return setError("Asset name is required.");
    if (!isEdit && !form.assignToUserId) return setError("Select the employee this asset is assigned to.");

    setSaving(true);
    try {
      const category =
        form.category === "Other"
          ? form.customCategory.trim() || "Other"
          : form.category.trim();
      const payload = {
        assetCode: form.assetCode,
        name: form.name,
        category: category || null,
        serialNumber: form.serialNumber,
        description: form.description,
        condition: form.condition,
        notes: form.notes,
      };
      if (!isEdit) {
        payload.assignToUserId = form.assignToUserId;
      }

      const res = await fetch(isEdit ? `/api/assets/${asset.id}` : "/api/assets", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save asset");
      onSaved?.(data.data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Asset" : "Assign Asset"}
      subtitle={
        isEdit
          ? asset.assetCode
          : "Log a company asset and assign it to an employee."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <Field label="Asset ID *">
            <input value={form.assetCode} onChange={(e) => update("assetCode", e.target.value)} placeholder="e.g. AF-LAP-001" className={inputClass} />
          </Field>
          <Field label="Asset Name *">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Dell Latitude laptop" className={inputClass} />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={`${inputClass} bg-white dark:bg-slate-900`}
            >
              <option value="">Select category</option>
              {ASSET_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {form.category === "Other" && (
              <input
                value={form.customCategory}
                onChange={(e) => update("customCategory", e.target.value)}
                placeholder="Enter custom category"
                className={`${inputClass} mt-2`}
              />
            )}
          </Field>
          <Field label="Serial Number">
            <input value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Condition">
            <input value={form.condition} onChange={(e) => update("condition", e.target.value)} placeholder="e.g. Good, working" className={inputClass} />
          </Field>
        </div>

        {!isEdit && (
          <Field label="Assign To *">
            <select
              value={form.assignToUserId}
              onChange={(e) => update("assignToUserId", e.target.value)}
              className={`${inputClass} bg-white dark:bg-slate-900`}
            >
              <option value="">Select employee</option>
              {assignableUsers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} ({formatRoleLabel(person.role)}{person.employeeId ? ` · ${person.employeeId}` : ""})
                </option>
              ))}
            </select>
            {assignableUsers.length === 0 && (
              <p className="text-[10px] font-semibold text-rose-600 mt-1">
                No employees report to you yet, so an asset cannot be assigned.
              </p>
            )}
            <p className="text-[10px] text-on-surface-variant mt-1">
              You cannot assign an asset to yourself.
            </p>
          </Field>
        )}

        <Field label="Description">
          <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Notes">
          <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} className={inputClass} />
        </Field>

        {error && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border text-xs font-bold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (!isEdit && assignableUsers.length === 0)}
            className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Assign Asset"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AssetAssignModal({ open, asset, assignableUsers = [], onClose, onSaved, token }) {
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = getActiveAssetAssignment(asset);

  useEffect(() => {
    if (!open) return;
    setUserId("");
    setNotes("");
    setError("");
  }, [open, asset]);

  if (!open || !asset) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!userId) return setError("Select an employee.");
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "assign", userId, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign asset");
      onSaved?.(data.data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={current ? "Reassign Asset" : "Assign Asset"}
      subtitle={`${asset.name} (${asset.assetCode})`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {current && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Currently held by <span className="font-bold">{current.user?.name || "an employee"}</span>. Reassigning will mark their assignment as returned.
          </p>
        )}
        <Field label="Assign To">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={`${inputClass} bg-white dark:bg-slate-900`}>
            <option value="">Select employee</option>
            {assignableUsers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} ({formatRoleLabel(person.role)}{person.employeeId ? ` · ${person.employeeId}` : ""})
              </option>
            ))}
          </select>
          {assignableUsers.length === 0 && (
            <p className="text-[10px] text-rose-600 mt-1">No employees report to you yet.</p>
          )}
        </Field>
        <Field label="Assignment Notes">
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </Field>
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border text-xs font-bold text-slate-600 dark:text-slate-300">Cancel</button>
          <button type="submit" disabled={saving || assignableUsers.length === 0} className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-60">
            {saving ? "Assigning..." : current ? "Reassign Asset" : "Assign Asset"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AssetReturnModal({ open, asset, onClose, onSaved, token }) {
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = getActiveAssetAssignment(asset);

  useEffect(() => {
    if (!open) return;
    setCondition("");
    setNotes("");
    setError("");
  }, [open, asset]);

  if (!open || !asset) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "return", returnCondition: condition, returnNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to return asset");
      onSaved?.(data.data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Return Asset" subtitle={`${asset.name} (${asset.assetCode})`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {current && (
          <p className="text-xs text-on-surface-variant bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
            Returning from <span className="font-bold text-on-surface">{current.user?.name || "employee"}</span>.
          </p>
        )}
        <Field label="Return Condition">
          <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Good, minor scratches" className={inputClass} />
        </Field>
        <Field label="Return Notes">
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </Field>
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border text-xs font-bold text-slate-600 dark:text-slate-300">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold disabled:opacity-60">
            {saving ? "Returning..." : "Mark as Returned"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AssetHistoryModal({ open, asset, onClose }) {
  if (!open || !asset) return null;
  const current = getActiveAssetAssignment(asset);
  const status = current ? "ASSIGNED" : "RETURNED";

  return (
    <ModalShell
      title={asset.name}
      subtitle={`${asset.assetCode}${asset.category ? ` · ${asset.category}` : ""}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${ASSET_STATUS_CLASSES[status] || ""}`}>
            {formatAssetStatus(status)}
          </span>
          {current && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              With {current.user?.name || "employee"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ["Category", asset.category || "—"],
            ["Serial Number", asset.serialNumber || "—"],
            ["Condition", asset.condition || "—"],
            ["Created By", asset.createdBy?.name || "—"],
            ["Notes", asset.notes || "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
              <p className="text-xs font-semibold text-on-surface mt-1 break-words">{value}</p>
            </div>
          ))}
        </div>

        {asset.description && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Description</p>
            <p className="text-sm text-on-surface-variant whitespace-pre-wrap break-words">{asset.description}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-on-surface mb-2">Assignment History</h3>
          {(asset.assignments || []).length === 0 ? (
            <p className="text-xs text-on-surface-variant">This asset has never been assigned.</p>
          ) : (
            <div className="space-y-2">
              {asset.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs font-bold text-on-surface">
                      {assignment.user?.name || "Employee"}
                      <span className="font-normal text-on-surface-variant"> · {formatRoleLabel(assignment.user?.role)}</span>
                    </p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full w-fit ${assignment.returnedAt ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                      {assignment.returnedAt ? "Returned" : "Current"}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Assigned {formatDate(assignment.assignedAt)} by {assignment.assignedBy?.name || "—"}
                    {assignment.returnedAt ? ` · Returned ${formatDate(assignment.returnedAt)}` : ""}
                  </p>
                  {(assignment.notes || assignment.returnCondition || assignment.returnNotes) && (
                    <p className="text-[10px] text-on-surface-variant mt-1 break-words">
                      {[assignment.notes, assignment.returnCondition ? `Condition: ${assignment.returnCondition}` : "", assignment.returnNotes].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold">Close</button>
        </div>
      </div>
    </ModalShell>
  );
}
