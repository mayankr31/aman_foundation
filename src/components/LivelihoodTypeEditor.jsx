"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";

const inputCls =
  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-500 border-outline-variant bg-transparent text-on-surface text-sm";
const labelCls =
  "block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1";
const addBtnCls =
  "text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1";
const removeBtnCls =
  "p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent shrink-0";

const FIELD_TYPES = ["text", "number", "select", "textarea"];
const COLUMN_TYPES = ["text", "number", "currency", "badge"];
const AGGREGATES = ["sum", "avg"];
const FORMATS = ["", "currency", "percent"];

function Section({ title, hint, children, onAdd, addLabel }) {
  return (
    <div className="border border-outline-variant/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-on-surface">{title}</h4>
          {hint && <p className="text-[11px] text-on-surface-variant">{hint}</p>}
        </div>
        {onAdd && (
          <button type="button" onClick={onAdd} className={addBtnCls}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Labeled({ label, className = "", children }) {
  return (
    <div className={className}>
      <span className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function LivelihoodTypeEditor({ category, token, initial, onCancel, onSaved }) {
  const toast = useToast();
  const isEdit = !!initial;

  const [label, setLabel] = useState(initial?.label || "");
  const [icon, setIcon] = useState(initial?.icon || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [targetUnit, setTargetUnit] = useState(initial?.programTargetUnit || "");

  const [fields, setFields] = useState(() =>
    (initial?.fields || []).map((f) => ({ ...f, optionsText: (f.options || []).join(", ") }))
  );
  const [eventTypes, setEventTypes] = useState(() => [...(initial?.eventTypes || [])]);
  const [eventInput, setEventInput] = useState("");
  const [columns, setColumns] = useState(() => (initial?.tableColumns || []).map((c) => ({ ...c })));
  const [kpis, setKpis] = useState(() => (initial?.kpiCards || []).map((k) => ({ ...k })));

  const [saving, setSaving] = useState(false);

  const updateRow = (setter, idx, patch) =>
    setter((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const removeRow = (setter, idx) =>
    setter((prev) => prev.filter((_, i) => i !== idx));

  const addEventType = () => {
    const value = eventInput.trim();
    if (!value || eventTypes.includes(value)) return;
    setEventTypes((prev) => [...prev, value]);
    setEventInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Type label is required");
      return;
    }

    const payload = {
      category,
      label: label.trim(),
      icon: icon.trim() || "category",
      description: description.trim(),
      programTargetUnit: targetUnit.trim(),
      fields: fields.map((f) => {
        const out = { name: (f.name || "").trim(), label: (f.label || "").trim(), type: f.type || "text" };
        if (f.step) out.step = f.step;
        if (f.unit) out.unit = f.unit;
        if (out.type === "select") {
          out.options = (f.optionsText || "").split(",").map((o) => o.trim()).filter(Boolean);
        }
        return out;
      }),
      eventTypes: eventTypes.map((t) => t.trim()).filter(Boolean),
      tableColumns: columns
        .filter((c) => (c.key || "").trim() && (c.label || "").trim())
        .map((c) => {
          const out = { key: c.key.trim(), label: c.label.trim(), type: c.type || "text" };
          if (c.unit) out.unit = c.unit;
          return out;
        }),
      kpiCards: kpis
        .filter((k) => (k.key || "").trim() && (k.label || "").trim())
        .map((k) => {
          const out = { key: k.key.trim(), label: k.label.trim(), aggregate: k.aggregate || "sum" };
          if (k.format) out.format = k.format;
          if (k.unit) out.unit = k.unit;
          if (k.icon) out.icon = k.icon;
          return out;
        }),
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/livelihood/types/${initial.id}` : "/api/livelihood/types";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isEdit ? "Type updated!" : "Type added!");
        onSaved(json.data);
      } else {
        toast.error(json.error || "Failed to save type");
      }
    } catch (err) {
      console.error("Save livelihood type error:", err);
      toast.error("An error occurred while saving the type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Type Label *</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Millets Cultivation" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Icon (Material Symbol)</label>
          <div className="flex items-center gap-2">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. agriculture" className={inputCls} />
            <span className="material-symbols-outlined text-on-surface-variant">{icon || "category"}</span>
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" placeholder="Short summary of this program type" className={`${inputCls} resize-none`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Target Unit</label>
          <input value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} placeholder="e.g. Ha, goats, birds" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input value={category === "FARM" ? "Farm" : "Non-Farm"} disabled className={`${inputCls} opacity-60`} />
        </div>
      </div>

      {/* Enrollment Fields */}
      <Section
        title="Enrollment Fields"
        hint="Fields captured when a beneficiary is enrolled."
        onAdd={() => setFields((p) => [...p, { name: "", label: "", type: "text", step: "", unit: "", optionsText: "" }])}
        addLabel="Add Field"
      >
        {fields.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No fields yet.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div key={idx} className="border border-outline-variant/20 rounded-lg p-3 space-y-2 bg-surface-container-lowest">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Labeled label="Field Label">
                    <input value={f.label} onChange={(e) => updateRow(setFields, idx, { label: e.target.value })} placeholder="e.g. Land Allotted" className={inputCls} />
                  </Labeled>
                  <Labeled label="Field Key">
                    <input value={f.name} onChange={(e) => updateRow(setFields, idx, { name: e.target.value })} placeholder="e.g. hectaresAllotted" className={inputCls} />
                  </Labeled>
                  <Labeled label="Type">
                    <div className="flex gap-2">
                      <select value={f.type} onChange={(e) => updateRow(setFields, idx, { type: e.target.value })} className={inputCls}>
                        {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button type="button" onClick={() => removeRow(setFields, idx)} className={removeBtnCls}>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </Labeled>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Labeled label="Unit">
                    <input value={f.unit || ""} onChange={(e) => updateRow(setFields, idx, { unit: e.target.value })} placeholder="optional" className={inputCls} />
                  </Labeled>
                  <Labeled label="Step">
                    <input value={f.step || ""} onChange={(e) => updateRow(setFields, idx, { step: e.target.value })} placeholder="e.g. 0.1" className={inputCls} />
                  </Labeled>
                </div>
                {f.type === "select" && (
                  <Labeled label="Options (comma separated)">
                    <input value={f.optionsText || ""} onChange={(e) => updateRow(setFields, idx, { optionsText: e.target.value })} placeholder="Option A, Option B" className={inputCls} />
                  </Labeled>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Event Types */}
      <Section title="Event Types" hint="Options available when logging a program event.">
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((t, idx) => (
            <span key={`${t}-${idx}`} className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
              {t}
              <button type="button" onClick={() => removeRow(setEventTypes, idx)} className="hover:text-red-600 cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
          {eventTypes.length === 0 && <p className="text-xs text-slate-400 italic">No event types yet.</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={eventInput}
            onChange={(e) => setEventInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEventType();
              }
            }}
            placeholder="Add event type and press Enter"
            className={inputCls}
          />
          <button type="button" onClick={addEventType} className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent text-sm shrink-0">
            Add
          </button>
        </div>
      </Section>

      {/* Table Columns */}
      <Section
        title="Table Columns"
        hint="Columns shown in the enrolled beneficiaries table."
        onAdd={() => setColumns((p) => [...p, { key: "", label: "", type: "text", unit: "" }])}
        addLabel="Add Column"
      >
        {columns.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No columns yet.</p>
        ) : (
          <div className="space-y-2">
            {columns.map((c, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                <Labeled label="Column Label" className="sm:col-span-2">
                  <input value={c.label} onChange={(e) => updateRow(setColumns, idx, { label: e.target.value })} placeholder="e.g. Est. Yield" className={inputCls} />
                </Labeled>
                <Labeled label="Field Key">
                  <input value={c.key} onChange={(e) => updateRow(setColumns, idx, { key: e.target.value })} placeholder="e.g. estimatedYieldTons" className={inputCls} />
                </Labeled>
                <Labeled label="Type">
                  <select value={c.type} onChange={(e) => updateRow(setColumns, idx, { type: e.target.value })} className={inputCls}>
                    {COLUMN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Labeled>
                <Labeled label="Unit">
                  <div className="flex gap-2">
                    <input value={c.unit || ""} onChange={(e) => updateRow(setColumns, idx, { unit: e.target.value })} placeholder="optional" className={inputCls} />
                    <button type="button" onClick={() => removeRow(setColumns, idx)} className={removeBtnCls}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </Labeled>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* KPI Cards */}
      <Section
        title="KPI Cards"
        hint="Summary cards shown on the program page."
        onAdd={() => setKpis((p) => [...p, { label: "", key: "", aggregate: "sum", format: "", unit: "", icon: "" }])}
        addLabel="Add KPI"
      >
        {kpis.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No KPI cards yet.</p>
        ) : (
          <div className="space-y-2">
            {kpis.map((k, idx) => (
              <div key={idx} className="border border-outline-variant/20 rounded-lg p-3 space-y-2 bg-surface-container-lowest">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Labeled label="Card Label">
                    <input value={k.label} onChange={(e) => updateRow(setKpis, idx, { label: e.target.value })} placeholder="e.g. Total Investment" className={inputCls} />
                  </Labeled>
                  <Labeled label="Field Key">
                    <input value={k.key} onChange={(e) => updateRow(setKpis, idx, { key: e.target.value })} placeholder="e.g. investment" className={inputCls} />
                  </Labeled>
                  <Labeled label="Aggregate">
                    <div className="flex gap-2">
                      <select value={k.aggregate} onChange={(e) => updateRow(setKpis, idx, { aggregate: e.target.value })} className={inputCls}>
                        {AGGREGATES.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <button type="button" onClick={() => removeRow(setKpis, idx)} className={removeBtnCls}>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </Labeled>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Labeled label="Format">
                    <select value={k.format || ""} onChange={(e) => updateRow(setKpis, idx, { format: e.target.value })} className={inputCls}>
                      {FORMATS.map((f) => <option key={f || "none"} value={f}>{f || "No format"}</option>)}
                    </select>
                  </Labeled>
                  <Labeled label="Unit">
                    <input value={k.unit || ""} onChange={(e) => updateRow(setKpis, idx, { unit: e.target.value })} placeholder="optional" className={inputCls} />
                  </Labeled>
                  <Labeled label="Icon">
                    <input value={k.icon || ""} onChange={(e) => updateRow(setKpis, idx, { icon: e.target.value })} placeholder="e.g. savings" className={inputCls} />
                  </Labeled>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-white dark:bg-slate-900 border-t border-outline-variant/20 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent text-sm">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors cursor-pointer border-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Type"}
        </button>
      </div>
    </form>
  );
}
