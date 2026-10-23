"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import { validateInteger } from "@/lib/validation";

function InputField({ label, name, value, onChange, type = "text", required = false }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
          <h3 className="text-lg font-bold font-headline text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function normalizeTemplateOptions(options) {
  return (options || []).map((option) => option.trim()).filter(Boolean);
}

export default function AssessmentTemplatesModal({
  token,
  onClose,
  onChanged,
  includeSel = true,
}) {
  const [templates, setTemplates] = useState({
    flnCategories: [],
    selQuestions: [],
    subjectTemplates: [],
  });
  const [activeTab, setActiveTab] = useState("fln");
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const authHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const loadTemplates = useCallback(async () => {
    try {
      const [flnRes, selRes, subjRes] = await Promise.all([
        fetch("/api/assessment-templates/fln-categories", { headers: authHeaders() }),
        fetch("/api/assessment-templates/sel-questions", { headers: authHeaders() }),
        fetch("/api/assessment-templates/subjects", { headers: authHeaders() }),
      ]);
      const [flnData, selData, subjData] = await Promise.all([
        flnRes.json(),
        selRes.json(),
        subjRes.json(),
      ]);
      setTemplates({
        flnCategories: flnData.success ? flnData.data : [],
        selQuestions: selData.success ? selData.data : [],
        subjectTemplates: subjData.success ? subjData.data : [],
      });
    } catch (err) {
      console.error("Failed to load assessment templates:", err);
    }
  }, [authHeaders]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates();
  }, [loadTemplates]);

  function openEditor(type, item = null, extra = {}) {
    const defaultOptions =
      type === "sel-question"
        ? ["Too Easy", "Easy", "Hard", "Too Hard", "Can with Teachers Help"]
        : type === "subject"
          ? ["words", "letter", "beginner", "paragraph (STD 1 level text)", "absent"]
          : [];

    setEditor({
      type,
      id: item?.id || null,
      name: item?.name || "",
      questionText: item?.questionText || "",
      marks: item?.marks ?? 1,
      order: item?.order ?? extra.order ?? 0,
      categoryId: item?.categoryId || extra.categoryId || "",
      options: Array.isArray(item?.options) ? item.options : defaultOptions,
    });
  }

  function updateOption(index, value) {
    setEditor((current) => ({
      ...current,
      options: current.options.map((option, i) => (i === index ? value : option)),
    }));
  }

  function addOption() {
    setEditor((current) => ({ ...current, options: [...(current.options || []), ""] }));
  }

  function removeOption(index) {
    setEditor((current) => ({
      ...current,
      options: current.options.filter((_, i) => i !== index),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editor) return;

    if (editor.type === "fln-question") {
      if (!editor.questionText.trim()) {
        alert("Question text is required.");
        return;
      }
      const marksError = validateInteger(editor.marks, { required: true, min: 1, max: 1000 });
      if (marksError) {
        alert(marksError);
        return;
      }
    }

    setSaving(true);
    try {
      const { type, id: templateId } = editor;
      let endpoint = "";
      let payload = {};

      if (type === "fln-category") {
        endpoint = templateId
          ? `/api/assessment-templates/fln-categories/${templateId}`
          : "/api/assessment-templates/fln-categories";
        payload = {
          name: editor.name.trim(),
          order: parseInt(editor.order, 10) || 0,
        };
      }

      if (type === "fln-question") {
        endpoint = templateId
          ? `/api/assessment-templates/fln-questions/${templateId}`
          : "/api/assessment-templates/fln-questions";
        payload = {
          categoryId: editor.categoryId,
          questionText: editor.questionText.trim(),
          marks: editor.marks === "" ? 0 : Number(editor.marks),
          order: parseInt(editor.order, 10) || 0,
        };
      }

      if (type === "sel-question") {
        endpoint = templateId
          ? `/api/assessment-templates/sel-questions/${templateId}`
          : "/api/assessment-templates/sel-questions";
        payload = {
          questionText: editor.questionText.trim(),
          options: normalizeTemplateOptions(editor.options),
          order: parseInt(editor.order, 10) || 0,
        };
      }

      if (type === "subject") {
        endpoint = templateId
          ? `/api/assessment-templates/subjects/${templateId}`
          : "/api/assessment-templates/subjects";
        payload = {
          name: editor.name.trim(),
          options: normalizeTemplateOptions(editor.options),
          order: parseInt(editor.order, 10) || 0,
        };
      }

      const res = await fetch(endpoint, {
        method: templateId ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to save template");
        return;
      }
      await loadTemplates();
      if (onChanged) await onChanged();
      setEditor(null);
    } catch (err) {
      console.error("Failed to save template:", err);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const endpointMap = {
      "fln-category": `/api/assessment-templates/fln-categories/${deleteTarget.id}`,
      "fln-question": `/api/assessment-templates/fln-questions/${deleteTarget.id}`,
      "sel-question": `/api/assessment-templates/sel-questions/${deleteTarget.id}`,
      subject: `/api/assessment-templates/subjects/${deleteTarget.id}`,
    };

    await fetch(endpointMap[deleteTarget.type], {
      method: "DELETE",
      headers: authHeaders(),
    });
    await loadTemplates();
    if (onChanged) await onChanged();
    setDeleteTarget(null);
  }

  const tabs = [
    ["fln", "RF"],
    ...(includeSel ? [["sel", "SEL"]] : []),
    ["subjects", "Subjects"],
  ];

  return (
    <>
      <Modal title="Assessment Templates" onClose={onClose}>
        <div className="space-y-5">
          <div className="flex gap-1 border-b border-outline-variant/20 pb-2 overflow-x-auto">
            {tabs.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "fln" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headline font-bold text-sm text-on-surface">RF Categories</h4>
                <button
                  type="button"
                  onClick={() => openEditor("fln-category", null, { order: templates.flnCategories.length + 1 })}
                  className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Category
                </button>
              </div>
              {templates.flnCategories.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-3 border border-outline-variant/20 rounded-lg">No RF categories configured.</p>
              ) : (
                <div className="space-y-3">
                  {templates.flnCategories.map((cat) => (
                    <div key={cat.id} className="border border-outline-variant/20 rounded-lg">
                      <div className="flex items-center justify-between gap-3 p-3 bg-surface-container-low border-b border-outline-variant/10">
                        <div>
                          <p className="font-semibold text-sm text-on-surface">{cat.name}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Order {cat.order}</p>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openEditor("fln-category", cat)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteTarget({ type: "fln-category", id: cat.id, label: cat.name })} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        {(cat.questions || []).map((q) => (
                          <div key={q.id} className="flex items-start justify-between gap-3 text-xs">
                            <span className="text-on-surface-variant flex-1">Q{q.order}. {q.questionText} ({q.marks} mark{q.marks === 1 ? "" : "s"})</span>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => openEditor("fln-question", q, { categoryId: cat.id })} className="p-0.5 hover:text-primary cursor-pointer text-on-surface-variant">
                                <span className="material-symbols-outlined text-[13px]">edit</span>
                              </button>
                              <button type="button" onClick={() => setDeleteTarget({ type: "fln-question", id: q.id, label: q.questionText })} className="p-0.5 hover:text-error cursor-pointer text-on-surface-variant">
                                <span className="material-symbols-outlined text-[13px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => openEditor("fln-question", null, { categoryId: cat.id, order: (cat.questions || []).length + 1 })}
                          className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">add</span>
                          Add Question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sel" && includeSel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headline font-bold text-sm text-on-surface">SEL Questions</h4>
                <button type="button" onClick={() => openEditor("sel-question", null, { order: templates.selQuestions.length + 1 })} className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Question
                </button>
              </div>
              {templates.selQuestions.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-3 border border-outline-variant/20 rounded-lg">No SEL questions configured.</p>
              ) : (
                <div className="divide-y divide-outline-variant/10 border border-outline-variant/20 rounded-lg max-h-[55vh] overflow-y-auto">
                  {templates.selQuestions.map((q) => (
                    <div key={q.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-on-surface">Q{q.order}. {q.questionText}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">{(q.options || []).join(", ")}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => openEditor("sel-question", q)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "sel-question", id: q.id, label: q.questionText })} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "subjects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headline font-bold text-sm text-on-surface">Subject Templates</h4>
                <button type="button" onClick={() => openEditor("subject", null, { order: templates.subjectTemplates.length + 1 })} className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Subject
                </button>
              </div>
              {templates.subjectTemplates.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-3 border border-outline-variant/20 rounded-lg">No subject templates configured.</p>
              ) : (
                <div className="divide-y divide-outline-variant/10 border border-outline-variant/20 rounded-lg">
                  {templates.subjectTemplates.map((st) => (
                    <div key={st.id} className="flex items-start justify-between gap-3 p-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-on-surface">{st.name}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">{(st.options || []).join(", ")}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => openEditor("subject", st)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ type: "subject", id: st.id, label: st.name })} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {editor && (
        <Modal
          title={`${editor.id ? "Edit" : "Add"} ${
            editor.type === "fln-category"
              ? "RF Category"
              : editor.type === "fln-question"
                ? "RF Question"
                : editor.type === "sel-question"
                  ? "SEL Question"
                  : "Subject Template"
          }`}
          onClose={() => setEditor(null)}
        >
          <form onSubmit={handleSave} className="space-y-4">
            {editor.type === "fln-category" && (
              <InputField label="Category Name" name="name" value={editor.name} onChange={(e) => setEditor((current) => ({ ...current, name: e.target.value }))} required />
            )}

            {editor.type === "fln-question" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Category</label>
                  <select
                    value={editor.categoryId}
                    onChange={(e) => setEditor((current) => ({ ...current, categoryId: e.target.value }))}
                    required
                    className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">Select category</option>
                    {templates.flnCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Question Text</label>
                  <textarea rows="3" value={editor.questionText} onChange={(e) => setEditor((current) => ({ ...current, questionText: e.target.value }))} required className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Marks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editor.marks}
                    onChange={(e) => setEditor((current) => ({ ...current, marks: e.target.value }))}
                    required
                    className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            {editor.type === "sel-question" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Question Text</label>
                <textarea rows="3" value={editor.questionText} onChange={(e) => setEditor((current) => ({ ...current, questionText: e.target.value }))} required className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
            )}

            {editor.type === "subject" && (
              <InputField label="Subject Name" name="name" value={editor.name} onChange={(e) => setEditor((current) => ({ ...current, name: e.target.value }))} required />
            )}

            <InputField label="Order" name="order" type="number" value={editor.order} onChange={(e) => setEditor((current) => ({ ...current, order: e.target.value }))} />

            {(editor.type === "sel-question" || editor.type === "subject") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Dropdown Options</label>
                  <button type="button" onClick={addOption} className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    Add Option
                  </button>
                </div>
                {(editor.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input value={option} onChange={(e) => updateOption(index, e.target.value)} className="flex-1 px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
                    <button type="button" onClick={() => removeOption(index)} className="p-2 hover:bg-error-container rounded-full cursor-pointer text-error">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
              <button type="button" onClick={() => setEditor(null)} className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmActionModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template Item"
        message={`Delete "${deleteTarget?.label || "this item"}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
