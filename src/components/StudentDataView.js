"use client";

import { useState, useEffect } from "react";

const LEVEL_FIXUPS = {
  words: "Word",
  letter: "Letter",
  beginner: "Beginner",
  "paragraph (std 1 level text)": "Std 1 Level Text",
  "paragraph (STD 1 level text)": "Std 1 Level Text",
  subtraction: "Subtraction",
  absent: "Absent",
};

function displayLevel(raw) {
  const key = String(raw || "").trim();
  if (!key) return key;
  const fixed = LEVEL_FIXUPS[key.toLowerCase()];
  if (fixed) return fixed;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const PHASE_META = {
  BASELINE: { label: "Baseline", color: "bg-blue-100 text-blue-700", border: "border-blue-100" },
  MIDLINE: { label: "Midline", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-100" },
  ENDLINE: { label: "Endline", color: "bg-green-100 text-green-700", border: "border-green-100" },
};

const PHASE_ORDER = ["BASELINE", "MIDLINE", "ENDLINE"];

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function StudentDataView({ fellowId, token, canEditNotes, source = "school" }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [session, setSession] = useState("");
  const [view, setView] = useState("levels"); // "levels" | "growth"
  const [savingKey, setSavingKey] = useState(null);
  const [editingNote, setEditingNote] = useState(null); // { phase, key, value }

  useEffect(() => {
    if (!fellowId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ source });
        if (session) params.set("session", session);
        const res = await fetch(`/api/fellows/${fellowId}/student-data?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!json.success) throw new Error(json.error || "Failed to load student data");
        setError("");
        setReport(json.data);
        if (!session && json.data?.session) setSession(json.data.session);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load student data:", err);
        setError(err.message || "Failed to load student data");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fellowId, token, session, source]);

  async function saveNote(phase, key) {
    if (!report || editingNote?.value === undefined) return;
    const saveId = `${phase}|${key}`;
    setSavingKey(saveId);
    try {
      const value = (editingNote.value || "").trim();
      const res = await fetch(`/api/fellows/${fellowId}/student-data-notes`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ session: report.session, phase, sectionKey: key, source, note: value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save note");
      setReport((prev) => {
        const notes = { ...(prev.notes || {}) };
        if (value) notes[saveId] = value;
        else delete notes[saveId];
        return { ...prev, notes };
      });
      setEditingNote(null);
    } catch (err) {
      console.error("Failed to save note:", err);
      alert(err.message || "Failed to save note");
    } finally {
      setSavingKey(null);
    }
  }

  function buildRows(section) {
    if (section.kind === "READING_FLUENCY") {
      const cats = [...(report?.flnCategories || [])].sort((a, b) => a.order - b.order);
      const rows = cats.map((c) => ({ key: c.id, label: c.name, below: false }));
      const belowCount = PHASE_ORDER.some((p) => (section.phases?.[p]?.counts?.__UNQUALIFIED || 0) > 0);
      if (belowCount) rows.push({ key: "__UNQUALIFIED", label: "Below Emergent", below: true });
      return rows;
    }
    const template = (report?.subjectTemplates || []).find((t) => t.id === section.key);
    const rows = (template?.options || []).map((opt) => ({ key: opt, label: displayLevel(opt) }));
    const configured = new Set(rows.map((r) => r.key));
    const extras = new Set();
    PHASE_ORDER.forEach((p) => {
      Object.keys(section.phases?.[p]?.counts || {}).forEach((k) => {
        if (!configured.has(k)) extras.add(k);
      });
    });
    extras.forEach((k) => rows.push({ key: k, label: displayLevel(k) }));
    return rows;
  }

  if (!report && !error) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return <div className="p-8 text-center text-error font-medium text-sm">{error}</div>;
  }

  const sessions = report.sessions?.length ? report.sessions : report.session ? [report.session] : [];
  const isAfterSchool = source === "afterSchool";
  const heading = isAfterSchool ? "After-School Student Data" : "Student Data";
  const populationLabel = isAfterSchool ? "after-school students" : "students";

  function levelLabel(section, key) {
    if (key === "__UNQUALIFIED") return "Below Emergent";
    if (section.kind === "READING_FLUENCY") {
      const cat = (report.flnCategories || []).find((c) => c.id === key);
      return cat ? cat.name : key;
    }
    return displayLevel(key);
  }

  const growthSummary = PHASE_ORDER.map((phase) => {
    const totals = { phase, improved: 0, declined: 0, same: 0, compared: 0, referenceLabel: null };
    for (const section of report.sections) {
      const c = section.comparison?.[phase];
      if (!c) continue;
      totals.improved += c.improved;
      totals.declined += c.declined;
      totals.same += c.same;
      totals.compared += c.compared;
      if (c.referenceLabel) totals.referenceLabel = c.referenceLabel;
    }
    return totals;
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 text-error text-xs font-semibold rounded-lg px-4 py-2">{error}</div>
      )}
      {/* Header / controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline font-bold text-xl text-on-surface">{heading}</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Aggregate academic assessment levels of the {populationLabel} under this fellow. Reading fluency level is assigned
            to the highest category the student qualifies in (≥70% marks).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {report.totalStudents > 0 && (
            <span className="text-xs font-semibold text-on-surface-variant">
              {report.totalStudents} students
            </span>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">View</label>
            <div className="flex rounded-lg border border-outline-variant overflow-hidden">
              {[
                { key: "levels", label: "Levels" },
                { key: "growth", label: "Growth" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setView(opt.key)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    view === opt.key
                      ? "bg-primary text-white"
                      : "bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Academic Session</label>
            <select
              value={session || report.session || ""}
              onChange={(e) => setSession(e.target.value)}
              className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
            >
              {sessions.length === 0 && <option value="">No sessions found</option>}
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {report.totalStudents === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant text-sm">
          No {isAfterSchool ? "after-school " : ""}students are currently assigned to this fellow.
        </div>
      ) : report.sections.every((s) => PHASE_ORDER.every((p) => !(s.phases?.[p]?.assessed))) ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant text-sm">
          No academic assessments recorded yet for {isAfterSchool ? "after-school students in " : ""}session <strong>{report.session}</strong>.
        </div>
      ) : view === "growth" ? (
        <div className="space-y-6">
          {/* Aggregated summary */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10">
            <h4 className="font-headline font-bold text-base text-on-surface mb-1">Phase-over-Phase Growth</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Each phase is compared with its predecessor: Baseline vs the previous session&apos;s Endline, Midline vs Baseline, Endline vs Midline.
              Summary counts are summed across all subjects.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {growthSummary.map((g) => {
                const meta = PHASE_META[g.phase];
                return (
                  <div key={g.phase} className={`rounded-lg border p-3 ${meta.border} bg-surface-container-low/40`}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                    <p className="text-[10px] text-on-surface-variant mt-2">
                      {g.referenceLabel ? `vs ${g.referenceLabel}` : "No previous session data"}
                    </p>
                    <p className="text-sm font-bold text-on-surface mt-2">
                      <span className="text-green-600">{g.improved}</span> improved
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      <span className="text-red-500 font-semibold">{g.declined}</span> declined · {g.same} same · {g.compared} compared
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-section growth */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {report.sections.map((section) => {
              const icon = section.kind === "READING_FLUENCY" ? "menu_book" : "book";
              return (
                <div
                  key={section.key}
                  className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10"
                >
                  <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PHASE_ORDER.map((phase) => {
                      const meta = PHASE_META[phase];
                      const c = section.comparison?.[phase] || { compared: 0, improved: 0, declined: 0, same: 0, transitions: [], referenceLabel: null };
                      return (
                        <div key={phase} className={`rounded-lg border p-3 ${meta.border} bg-surface-container-low/40 flex flex-col`}>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full self-start ${meta.color} mb-2`}>
                            {meta.label}
                          </span>
                          <p className="text-[10px] text-on-surface-variant mb-2">
                            {c.referenceLabel ? `vs ${c.referenceLabel}` : "No previous session data"}
                          </p>
                          {c.compared === 0 ? (
                            <p className="text-xs text-on-surface-variant flex-1">Not enough comparable data.</p>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="font-bold text-green-600">{c.improved}</span>
                                <span className="text-[11px] text-on-surface-variant">improved</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant">
                                <span className="text-red-500 font-semibold">{c.declined}</span> declined · {c.same} same · {c.compared} compared
                              </p>
                              {c.transitions?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-outline-variant/10 space-y-1">
                                  {c.transitions.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                                      <span
                                        className={`truncate ${t.direction === "up" ? "text-green-700" : "text-red-500"}`}
                                        title={`${levelLabel(section, t.from)} → ${levelLabel(section, t.to)}`}
                                      >
                                        {levelLabel(section, t.from)} → {levelLabel(section, t.to)}
                                      </span>
                                      <span className={`font-bold ${t.direction === "up" ? "text-green-700" : "text-red-500"}`}>
                                        {t.count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {report.sections.map((section) => {
            const rows = buildRows(section);
            const icon = section.kind === "READING_FLUENCY" ? "menu_book" : "book";
            return (
              <div
                key={section.key}
                className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10"
              >
                <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PHASE_ORDER.map((phase) => {
                    const meta = PHASE_META[phase];
                    const phaseData = section.phases?.[phase] || { counts: {}, assessed: 0 };
                    const noteKey = `${phase}|${section.key}`;
                    const note = report.notes?.[noteKey] || "";
                    const isEditing = editingNote?.phase === phase && editingNote?.key === section.key;
                    return (
                      <div key={phase} className={`rounded-lg border p-3 ${meta.border} bg-surface-container-low/40 flex flex-col`}>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full self-start ${meta.color} mb-3`}>
                          {meta.label}
                        </span>
                        <div className="space-y-1 flex-1">
                          {rows.length === 0 ? (
                            <p className="text-xs text-on-surface-variant">No levels configured.</p>
                          ) : (
                            rows.map((row) => (
                              <div key={row.key} className="flex items-center justify-between gap-2 text-sm py-0.5">
                                <span
                                  className={`text-on-surface-variant text-xs truncate ${row.below ? "italic" : ""}`}
                                  title={row.label}
                                >
                                  {row.label}
                                </span>
                                <span className={`font-bold ${row.below ? "text-on-surface-variant" : "text-primary"}`}>
                                  {phaseData.counts[row.key] ?? 0}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-outline-variant/10 text-[10px] text-on-surface-variant">
                          {phaseData.assessed} student{phaseData.assessed === 1 ? "" : "s"} assessed
                        </div>

                        {/* Notes */}
                        <div className="mt-2">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <textarea
                                rows={2}
                                autoFocus
                                value={editingNote.value}
                                onChange={(e) => setEditingNote((n) => ({ ...n, value: e.target.value }))}
                                placeholder="Note any anomalies for this round..."
                                className="w-full px-2 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:border-primary resize-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingNote(null)}
                                  disabled={savingKey === noteKey}
                                  className="px-2 py-1 text-[10px] font-semibold text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveNote(phase, section.key)}
                                  disabled={savingKey === noteKey}
                                  className="px-3 py-1 text-[10px] font-semibold bg-primary text-white rounded-full cursor-pointer disabled:opacity-50"
                                >
                                  {savingKey === noteKey ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`rounded-lg px-2 py-1.5 text-[11px] leading-relaxed ${
                                note ? "bg-surface text-on-surface-variant" : "border border-dashed border-outline-variant text-on-surface-variant/60"
                              }`}
                            >
                              {note ? (
                                <div className="flex items-start justify-between gap-2">
                                  <p className="flex-1 break-words">{note}</p>
                                  {canEditNotes && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingNote({ phase, key: section.key, value: note })}
                                      className="text-primary hover:underline shrink-0 cursor-pointer text-[10px] font-semibold"
                                      title="Edit note"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              ) : canEditNotes ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingNote({ phase, key: section.key, value: "" })}
                                  className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-primary cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[13px]">edit_note</span>
                                  Add note
                                </button>
                              ) : (
                                <span>No note</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
