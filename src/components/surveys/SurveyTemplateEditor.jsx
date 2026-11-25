"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import {
  QUESTION_TYPES,
  formatQuestionLabel,
  getQuestionNumbers,
  getQuestionOptions,
  validateSurveyTemplate,
} from "@/lib/surveyTemplates";
import { clearSurveyTemplateCache } from "@/lib/useSurveyTemplate";

const clone = (value) =>
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

const inputClass =
  "w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary";
const labelClass = "text-[10px] font-bold uppercase tracking-widest text-on-surface-variant";

function Field({ label, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function IconButton({ icon, label, onClick, tone = "default", disabled = false }) {
  const tones = {
    default: "text-on-surface-variant hover:bg-surface-container",
    danger: "text-error hover:bg-error/10",
    primary: "text-primary hover:bg-primary/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`min-w-9 min-h-9 p-2 flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${tones[tone]}`}
    >
      <span className="material-symbols-outlined text-[19px]">{icon}</span>
    </button>
  );
}

function OptionsEditor({ options, onChange }) {
  const update = (index, label) =>
    onChange(options.map((option, i) => (i === index ? { ...option, label } : option)));
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const remove = (index) => onChange(options.filter((_, i) => i !== index));
  const add = () => onChange([...options, { id: newId("opt"), label: "New option" }]);

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={option.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5">
          <input
            value={option.label}
            onChange={(event) => update(index, event.target.value)}
            className={inputClass + " min-w-0 sm:flex-1"}
          />
          <div className="flex items-center justify-end gap-1 shrink-0">
            <IconButton icon="arrow_upward" label="Move up" onClick={() => move(index, -1)} disabled={index === 0} />
            <IconButton
              icon="arrow_downward"
              label="Move down"
              onClick={() => move(index, 1)}
              disabled={index === options.length - 1}
            />
            <IconButton icon="delete" label="Remove option" tone="danger" onClick={() => remove(index)} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add option
      </button>
    </div>
  );
}

function FollowUpEditor({ followUp, option, onChange, template }) {
  const update = (patch) => {
    const next = { ...followUp, ...patch };
    if (next.otherOptionId && !next.otherFieldId) {
      next.otherFieldId = newId("other");
    }
    onChange(next);
  };
  return (
    <div className="mt-2 ml-2 pl-2.5 sm:ml-4 sm:pl-3 border-l-2 border-outline-variant/40 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Follow-up type">
          <select
            value={followUp.type || "textarea"}
            onChange={(event) => update({ type: event.target.value })}
            className={inputClass}
          >
            <option value="textarea">Long text</option>
            <option value="select">Dropdown</option>
          </select>
        </Field>
        <Field label="Follow-up label">
          <input
            value={followUp.label || ""}
            onChange={(event) => update({ label: event.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      {followUp.type === "select" && (
        <>
          <Field label="Dropdown option set">
            <select
              value={followUp.optionSetId || ""}
              onChange={(event) => update({ optionSetId: event.target.value })}
              className={inputClass}
            >
              <option value="">Select option set</option>
              {(template.optionSets || []).map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Shows “please specify” when">
              <select
                value={followUp.otherOptionId || ""}
                onChange={(event) => update({ otherOptionId: event.target.value })}
                className={inputClass}
              >
                <option value="">Never</option>
                {getQuestionOptions(template, { optionSetId: followUp.optionSetId }).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Specify label">
              <input
                value={followUp.otherLabel || ""}
                onChange={(event) => update({ otherLabel: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
        </>
      )}

      {followUp.type === "textarea" && (
        <Field label="Placeholder">
          <input
            value={followUp.placeholder || ""}
            onChange={(event) => update({ placeholder: event.target.value })}
            className={inputClass}
          />
        </Field>
      )}

      <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
        <input
          type="checkbox"
          checked={followUp.required === true}
          onChange={(event) => update({ required: event.target.checked })}
          className="accent-primary w-4 h-4"
        />
        Required when “{option.label}” is selected
      </label>
    </div>
  );
}

function MultiOptionsEditor({ options, onChange, template }) {
  const [expanded, setExpanded] = useState(null);

  const updateOption = (index, patch) =>
    onChange(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const remove = (index) => onChange(options.filter((_, i) => i !== index));
  const add = () => onChange([...options, { id: newId("opt"), label: "New option" }]);

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={option.id} className="rounded-lg border border-outline-variant/30 p-2.5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <input
              value={option.label}
              onChange={(event) => updateOption(index, { label: event.target.value })}
              className={inputClass + " min-w-0 sm:flex-1"}
            />
            <div className="flex items-center justify-end gap-1 shrink-0">
              <IconButton icon="arrow_upward" label="Move up" onClick={() => move(index, -1)} disabled={index === 0} />
              <IconButton
                icon="arrow_downward"
                label="Move down"
                onClick={() => move(index, 1)}
                disabled={index === options.length - 1}
              />
              <IconButton icon="delete" label="Remove option" tone="danger" onClick={() => remove(index)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(expanded === option.id ? null : option.id)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                option.followUp
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-surface-container text-on-surface-variant border-outline-variant/30"
              }`}
            >
              {option.followUp ? "Edit follow-up" : "Add follow-up"}
            </button>
            {option.followUp && (
              <button
                type="button"
                onClick={() => updateOption(index, { followUp: undefined })}
                className="text-[11px] font-semibold px-2 py-1 rounded-full bg-error/10 text-error border border-error/20 cursor-pointer"
              >
                Remove follow-up
              </button>
            )}
          </div>

          {expanded === option.id && (
            <>
              {option.followUp ? (
                <FollowUpEditor
                  followUp={option.followUp}
                  option={option}
                  template={template}
                  onChange={(followUp) => updateOption(index, { followUp })}
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    updateOption(index, {
                      followUp: {
                        id: newId("followup"),
                        type: "textarea",
                        label: "Please specify",
                        required: false,
                        otherFieldId: newId("other"),
                        otherLabel: "Please specify",
                      },
                    })
                  }
                  className="text-primary text-xs font-semibold hover:underline cursor-pointer"
                >
                  Create follow-up field
                </button>
              )}
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add option
      </button>
    </div>
  );
}

function RankGroupsEditor({ groups, onChange }) {
  const updateGroup = (index, patch) =>
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  const removeGroup = (index) => onChange(groups.filter((_, i) => i !== index));
  const addGroup = () =>
    onChange([
      ...groups,
      { id: newId("group"), heading: "New group", options: [{ id: newId("opt"), label: "New option" }] },
    ]);

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="rounded-lg border border-outline-variant/30 p-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <input
              value={group.heading}
              onChange={(event) => updateGroup(groupIndex, { heading: event.target.value })}
              className={inputClass + " min-w-0 sm:flex-1"}
            />
            <div className="flex justify-end shrink-0">
              <IconButton icon="delete" label="Remove group" tone="danger" onClick={() => removeGroup(groupIndex)} />
            </div>
          </div>
          <OptionsEditor
            options={group.options || []}
            onChange={(options) => updateGroup(groupIndex, { options })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addGroup}
        className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add group
      </button>
    </div>
  );
}

function ConditionEditor({ question, draft, onChange }) {
  const otherQuestions = (draft.questions || []).filter((item) => item.id !== question.id);
  const conditions = question.showIf?.all || [];

  const setConditions = (next) => {
    if (next.length === 0) onChange({ showIf: undefined });
    else onChange({ showIf: { all: next } });
  };

  const updateCondition = (index, patch) =>
    setConditions(conditions.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => {
        const source = otherQuestions.find((item) => item.id === condition.questionId);
        const sourceOptions = source ? getQuestionOptions(draft, source) : [];
        const isScale = source?.type === "scale";
        return (
          <div key={index} className="rounded-lg border border-outline-variant/30 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <select
                value={condition.questionId || ""}
                onChange={(event) =>
                  updateCondition(index, {
                    questionId: event.target.value,
                    anyOf: undefined,
                    lt: undefined,
                  })
                }
                className={inputClass}
              >
                <option value="">Select question</option>
                {otherQuestions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatQuestionLabel(getQuestionNumbers(draft)[item.id], item.label || item.id)}
                  </option>
                ))}
              </select>
              <IconButton
                icon="delete"
                label="Remove condition"
                tone="danger"
                onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
              />
            </div>

            {source && !isScale && (
              <div>
                <p className={labelClass}>Show when the answer is any of</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {sourceOptions.map((option) => {
                    const checked = (condition.anyOf || []).map(String).includes(String(option.id));
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border cursor-pointer ${
                          checked
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "border-outline-variant/40 text-on-surface-variant"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const current = (condition.anyOf || []).map(String);
                            const next = event.target.checked
                              ? [...current, String(option.id)]
                              : current.filter((value) => value !== String(option.id));
                            updateCondition(index, { anyOf: next });
                          }}
                          className="accent-primary w-3.5 h-3.5"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {source && isScale && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Show when the answer is less than</span>
                <input
                  type="number"
                  value={condition.lt ?? ""}
                  onChange={(event) =>
                    updateCondition(index, {
                      lt: event.target.value === "" ? undefined : Number(event.target.value),
                    })
                  }
                  className={inputClass + " w-24"}
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setConditions([...conditions, { questionId: "", anyOf: [] }])}
        className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add condition
      </button>
    </div>
  );
}

export default function SurveyTemplateEditor({ initialTemplate, token, onCancel, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [draft, setDraft] = useState(() => clone(initialTemplate));
  const [activeTab, setActiveTab] = useState("questions");
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numbers = useMemo(() => getQuestionNumbers(draft), [draft]);

  const patchDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const updateSection = (id, patch) =>
    patchDraft({
      sections: draft.sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    });

  const moveSection = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= draft.sections.length) return;
    const next = [...draft.sections];
    [next[index], next[target]] = [next[target], next[index]];
    patchDraft({ sections: next });
  };

  const addSection = () => {
    const section = { id: newId("section"), label: "New section", note: "" };
    patchDraft({ sections: [...draft.sections, section] });
    setExpandedSection(section.id);
  };

  const deleteSection = (section) => {
    const questionsInSection = draft.questions.filter((question) => question.sectionId === section.id);
    if (questionsInSection.length > 0) {
      toast.error("Move or delete the questions in this section first.");
      return;
    }
    if (draft.sections.length === 1) {
      toast.error("A survey needs at least one section.");
      return;
    }
    patchDraft({ sections: draft.sections.filter((item) => item.id !== section.id) });
  };

  const updateQuestion = (id, patch) =>
    patchDraft({
      questions: draft.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      ),
    });

  const addQuestion = (sectionId) => {
    const firstSet = draft.optionSets?.[0];
    const question = {
      id: newId("question"),
      sectionId,
      label: "New question",
      type: "select",
      numberMode: "auto",
      required: false,
      optionSetId: firstSet?.id || "",
    };
    patchDraft({ questions: [...draft.questions, question] });
    setExpandedQuestion(question.id);
  };

  const deleteQuestion = async (question) => {
    const confirmed = await confirm({
      title: "Delete Question",
      message: "Delete this question? Existing answers will be kept under “Removed questions”.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    // Questions whose entire visibility depends on the deleted question are
    // archived with it, otherwise they would suddenly become always-visible.
    const deletedIds = new Set([question.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of draft.questions) {
        if (deletedIds.has(item.id)) continue;
        const conditions = item.showIf?.all || [];
        if (conditions.length === 0) continue;
        if (conditions.every((condition) => deletedIds.has(condition.questionId))) {
          deletedIds.add(item.id);
          changed = true;
        }
      }
    }

    const archived = draft.questions
      .filter((item) => deletedIds.has(item.id))
      .map((item) => ({ ...item, archivedNumber: numbers[item.id] || null }));

    const remaining = draft.questions
      .filter((item) => !deletedIds.has(item.id))
      .map((item) => {
        let next = item;
        if (item.showIf?.all?.some((condition) => deletedIds.has(condition.questionId))) {
          const conditions = item.showIf.all.filter(
            (condition) => !deletedIds.has(condition.questionId)
          );
          next = { ...next, showIf: conditions.length ? { all: conditions } : undefined };
        }
        if (item.labelWhen?.some((rule) => deletedIds.has(rule.questionId))) {
          const rules = item.labelWhen.filter((rule) => !deletedIds.has(rule.questionId));
          next = { ...next, labelWhen: rules.length ? rules : undefined };
        }
        return next;
      });

    patchDraft({
      questions: remaining,
      archivedQuestions: [...(draft.archivedQuestions || []), ...archived],
    });
    if (deletedIds.has(expandedQuestion)) setExpandedQuestion(null);
  };

  const moveQuestion = (question, direction) => {
    const sameSection = draft.questions
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.sectionId === question.sectionId);
    const position = sameSection.findIndex((entry) => entry.item.id === question.id);
    const target = position + direction;
    if (target < 0 || target >= sameSection.length) return;

    const next = [...draft.questions];
    const a = sameSection[position].index;
    const b = sameSection[target].index;
    [next[a], next[b]] = [next[b], next[a]];
    patchDraft({ questions: next });
  };

  const updateOptionSet = (id, patch) =>
    patchDraft({
      optionSets: draft.optionSets.map((set) => (set.id === id ? { ...set, ...patch } : set)),
    });

  const addOptionSet = () => {
    const set = {
      id: newId("set"),
      name: "New option set",
      options: [{ id: newId("opt"), label: "Option 1" }],
    };
    patchDraft({ optionSets: [...draft.optionSets, set] });
  };

  const optionSetUsage = (setId) => {
    let count = 0;
    for (const question of draft.questions) {
      if (question.optionSetId === setId) count += 1;
      if (question.rating?.optionSetId === setId) count += 1;
      for (const option of question.options || []) {
        if (option.followUp?.optionSetId === setId) count += 1;
      }
    }
    return count;
  };

  const deleteOptionSet = async (set) => {
    const usage = optionSetUsage(set.id);
    if (usage > 0) {
      toast.error(`“${set.name}” is used by ${usage} question${usage === 1 ? "" : "s"}. Change those first.`);
      return;
    }
    const confirmed = await confirm({
      title: "Delete Option Set",
      message: `Delete option set “${set.name}”?`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    patchDraft({ optionSets: draft.optionSets.filter((item) => item.id !== set.id) });
  };

  const save = async () => {
    setError("");
    const validation = validateSurveyTemplate(draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/survey-templates/${draft.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: draft }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to save survey");
        return;
      }
      clearSurveyTemplateCache(draft.key);
      toast.success("Survey updated successfully.");
      if (onSaved) onSaved(json.data);
    } catch (err) {
      setError(err.message || "Failed to save survey");
    } finally {
      setSaving(false);
    }
  };

  const sectionOptions = draft.optionSets || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to surveys
          </button>
          <h2 className="page-title text-on-surface">Edit {draft.title}</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Change wording, options, ordering and conditional questions. Existing answers stay intact.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>}
            Save Survey
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-1 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        {[
          ["questions", "Sections & Questions"],
          ["options", "Option Sets"],
        ].map(([tab, label]) => (
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

      {activeTab === "options" && (
        <div className="space-y-4">
          {sectionOptions.map((set) => (
            <div key={set.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={set.name}
                  onChange={(event) => updateOptionSet(set.id, { name: event.target.value })}
                  className={inputClass + " font-semibold flex-1 min-w-[180px]"}
                />
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant shrink-0">
                    {optionSetUsage(set.id)} used
                  </span>
                  <IconButton
                    icon="delete"
                    label="Delete option set"
                    tone="danger"
                    onClick={() => deleteOptionSet(set)}
                    disabled={optionSetUsage(set.id) > 0}
                  />
                </div>
              </div>
              <OptionsEditor
                options={set.options || []}
                onChange={(options) => updateOptionSet(set.id, { options })}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addOptionSet}
            className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            + Add Option Set
          </button>
        </div>
      )}

      {activeTab === "questions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
            <Field label="Survey title">
              <input
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Survey date label">
              <input
                value={draft.dateLabel || ""}
                onChange={(event) => patchDraft({ dateLabel: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Intro text" className="md:col-span-2">
              <textarea
                rows={2}
                value={draft.intro || ""}
                onChange={(event) => patchDraft({ intro: event.target.value })}
                className={inputClass + " resize-y"}
              />
            </Field>
            <Field label="Notice (optional)" className="md:col-span-2">
              <textarea
                rows={2}
                value={draft.notice || ""}
                onChange={(event) => patchDraft({ notice: event.target.value })}
                className={inputClass + " resize-y"}
              />
            </Field>
          </div>

          {(draft.sections || []).map((section, sectionIndex) => {
            const sectionQuestions = draft.questions.filter((question) => question.sectionId === section.id);
            return (
              <div key={section.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low border-b border-outline-variant/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary shrink-0">
                    Section {sectionIndex + 1}
                  </span>
                  <div className="ml-auto flex items-center gap-1 shrink-0 sm:order-3">
                    <IconButton icon="arrow_upward" label="Move section up" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0} />
                    <IconButton
                      icon="arrow_downward"
                      label="Move section down"
                      onClick={() => moveSection(sectionIndex, 1)}
                      disabled={sectionIndex === draft.sections.length - 1}
                    />
                    <IconButton
                      icon="notes"
                      label="Edit section note"
                      onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    />
                    <IconButton icon="delete" label="Delete section" tone="danger" onClick={() => deleteSection(section)} />
                  </div>
                  <input
                    value={section.label}
                    onChange={(event) => updateSection(section.id, { label: event.target.value })}
                    className={inputClass + " font-semibold w-full order-3 sm:order-2 sm:w-auto sm:flex-1 sm:min-w-[160px]"}
                  />
                </div>

                {expandedSection === section.id && (
                  <div className="p-3 border-b border-outline-variant/10">
                    <Field label="Section note (shown before the questions)">
                      <textarea
                        rows={2}
                        value={section.note || ""}
                        onChange={(event) => updateSection(section.id, { note: event.target.value })}
                        className={inputClass + " resize-y"}
                      />
                    </Field>
                  </div>
                )}

                <div className="divide-y divide-outline-variant/10">
                  {sectionQuestions.map((question) => {
                    const isOpen = expandedQuestion === question.id;
                    return (
                      <div key={question.id}>
                        <div className="flex flex-wrap items-start gap-2 p-3">
                          <button
                            type="button"
                            onClick={() => setExpandedQuestion(isOpen ? null : question.id)}
                            className="flex items-start gap-2 w-full sm:w-auto sm:flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <span className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center mt-0.5">
                              {numbers[question.id] || "—"}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-on-surface break-words">
                                {question.label || "(untitled question)"}
                              </span>
                              <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mt-0.5">
                                {QUESTION_TYPES.find((type) => type.value === (question.type || "select"))?.label}
                                {question.required ? " · required" : ""}
                                {question.showIf?.all?.length ? ` · ${question.showIf.all.length} condition(s)` : ""}
                              </span>
                            </span>
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                            <IconButton icon="arrow_upward" label="Move up" onClick={() => moveQuestion(question, -1)} />
                            <IconButton icon="arrow_downward" label="Move down" onClick={() => moveQuestion(question, 1)} />
                            <IconButton
                              icon={isOpen ? "expand_less" : "edit"}
                              label={isOpen ? "Collapse" : "Edit question"}
                              tone="primary"
                              onClick={() => setExpandedQuestion(isOpen ? null : question.id)}
                            />
                            <IconButton icon="delete" label="Delete question" tone="danger" onClick={() => deleteQuestion(question)} />
                          </div>
                        </div>

                        {isOpen && (
                          <div className="p-3 pt-0 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="Section">
                                <select
                                  value={question.sectionId}
                                  onChange={(event) => updateQuestion(question.id, { sectionId: event.target.value })}
                                  className={inputClass}
                                >
                                  {draft.sections.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Question type">
                                <select
                                  value={question.type || "select"}
                                  onChange={(event) => {
                                    const type = event.target.value;
                                    const patch = { type };
                                    if (type === "multiSelect" && !Array.isArray(question.options)) {
                                      patch.options = [];
                                      patch.rating = {
                                        enabled: true,
                                        optionSetId: draft.optionSets?.[0]?.id || "",
                                        label: "How helpful was this?",
                                      };
                                    }
                                    if (type === "rank" && !Array.isArray(question.groups)) {
                                      patch.limit = 3;
                                      patch.groups = [];
                                    }
                                    if (type === "scale") {
                                      patch.min = question.min ?? 0;
                                      patch.max = question.max ?? 10;
                                    }
                                    updateQuestion(question.id, patch);
                                  }}
                                  className={inputClass}
                                >
                                  {QUESTION_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Question text" className="md:col-span-2">
                                <textarea
                                  rows={2}
                                  value={question.label || ""}
                                  onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                                  className={inputClass + " resize-y"}
                                />
                              </Field>
                              <Field label="Helper text (optional)" className="md:col-span-2">
                                <input
                                  value={question.helperText || ""}
                                  onChange={(event) => updateQuestion(question.id, { helperText: event.target.value })}
                                  className={inputClass}
                                />
                              </Field>
                              <Field label="Numbering">
                                <select
                                  value={question.numberMode || "auto"}
                                  onChange={(event) => updateQuestion(question.id, { numberMode: event.target.value })}
                                  className={inputClass}
                                >
                                  <option value="auto">Automatic</option>
                                  <option value="fixed">Fixed number</option>
                                  <option value="hidden">Hidden</option>
                                </select>
                              </Field>
                              {question.numberMode === "fixed" && (
                                <Field label="Fixed number">
                                  <input
                                    value={question.fixedNumber || ""}
                                    onChange={(event) => updateQuestion(question.id, { fixedNumber: event.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. 14a"
                                  />
                                </Field>
                              )}
                              <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                                  <input
                                    type="checkbox"
                                    checked={question.required === true}
                                    onChange={(event) => updateQuestion(question.id, { required: event.target.checked })}
                                    className="accent-primary w-4 h-4"
                                  />
                                  Required
                                </label>
                                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                                  <input
                                    type="checkbox"
                                    checked={question.indent === true}
                                    onChange={(event) => updateQuestion(question.id, { indent: event.target.checked })}
                                    className="accent-primary w-4 h-4"
                                  />
                                  Indent (follow-up question)
                                </label>
                              </div>
                            </div>

                            {(question.type === "select" || question.type === "radio") && (
                              <div className="space-y-3 rounded-lg border border-outline-variant/20 p-3">
                                <Field label="Options source">
                                  <select
                                    value={question.optionSetId || "__custom__"}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      if (value === "__custom__") {
                                        updateQuestion(question.id, {
                                          optionSetId: "",
                                          options:
                                            Array.isArray(question.options) && question.options.length
                                              ? question.options
                                              : [{ id: newId("opt"), label: "Option 1" }],
                                        });
                                      } else {
                                        updateQuestion(question.id, {
                                          optionSetId: value,
                                          options: undefined,
                                        });
                                      }
                                    }}
                                    className={inputClass}
                                  >
                                    {(draft.optionSets || []).map((set) => (
                                      <option key={set.id} value={set.id}>
                                        {set.name}
                                      </option>
                                    ))}
                                    <option value="__custom__">Custom options for this question</option>
                                  </select>
                                </Field>
                                {!question.optionSetId && (
                                  <OptionsEditor
                                    options={question.options || []}
                                    onChange={(options) => updateQuestion(question.id, { options })}
                                  />
                                )}
                              </div>
                            )}

                            {question.type === "textarea" && (
                              <Field label="Placeholder (optional)">
                                <input
                                  value={question.placeholder || ""}
                                  onChange={(event) => updateQuestion(question.id, { placeholder: event.target.value })}
                                  className={inputClass}
                                />
                              </Field>
                            )}

                            {question.type === "scale" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Minimum">
                                  <input
                                    type="number"
                                    value={question.min ?? 0}
                                    onChange={(event) => updateQuestion(question.id, { min: Number(event.target.value) })}
                                    className={inputClass}
                                  />
                                </Field>
                                <Field label="Maximum">
                                  <input
                                    type="number"
                                    value={question.max ?? 10}
                                    onChange={(event) => updateQuestion(question.id, { max: Number(event.target.value) })}
                                    className={inputClass}
                                  />
                                </Field>
                              </div>
                            )}

                            {question.type === "multiSelect" && (
                              <div className="space-y-3 rounded-lg border border-outline-variant/20 p-3">
                                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                                  <input
                                    type="checkbox"
                                    checked={question.rating?.enabled === true}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        rating: {
                                          enabled: event.target.checked,
                                          optionSetId: question.rating?.optionSetId || draft.optionSets?.[0]?.id || "",
                                          label: question.rating?.label || "How helpful was this?",
                                        },
                                      })
                                    }
                                    className="accent-primary w-4 h-4"
                                  />
                                  Ask a rating for each selected option
                                </label>
                                {question.rating?.enabled && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Rating option set">
                                      <select
                                        value={question.rating.optionSetId || ""}
                                        onChange={(event) =>
                                          updateQuestion(question.id, {
                                            rating: { ...question.rating, optionSetId: event.target.value },
                                          })
                                        }
                                        className={inputClass}
                                      >
                                        {(draft.optionSets || []).map((set) => (
                                          <option key={set.id} value={set.id}>
                                            {set.name}
                                          </option>
                                        ))}
                                      </select>
                                    </Field>
                                    <Field label="Rating label">
                                      <input
                                        value={question.rating.label || ""}
                                        onChange={(event) =>
                                          updateQuestion(question.id, {
                                            rating: { ...question.rating, label: event.target.value },
                                          })
                                        }
                                        className={inputClass}
                                      />
                                    </Field>
                                  </div>
                                )}
                                <MultiOptionsEditor
                                  options={question.options || []}
                                  template={draft}
                                  onChange={(options) => updateQuestion(question.id, { options })}
                                />
                              </div>
                            )}

                            {question.type === "rank" && (
                              <div className="space-y-3 rounded-lg border border-outline-variant/20 p-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Field label="How many options must be ranked">
                                    <input
                                      type="number"
                                      min="1"
                                      value={question.limit ?? 3}
                                      onChange={(event) => updateQuestion(question.id, { limit: Number(event.target.value) })}
                                      className={inputClass}
                                    />
                                  </Field>
                                  <Field label="Validation message">
                                    <input
                                      value={question.validationMessage || ""}
                                      onChange={(event) => updateQuestion(question.id, { validationMessage: event.target.value })}
                                      className={inputClass}
                                    />
                                  </Field>
                                  <Field label="“Other” option">
                                    <select
                                      value={question.otherOptionId || ""}
                                      onChange={(event) => updateQuestion(question.id, { otherOptionId: event.target.value })}
                                      className={inputClass}
                                    >
                                      <option value="">None</option>
                                      {(question.groups || []).flatMap((group) => group.options || []).map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </Field>
                                  <Field label="“Other” field label">
                                    <input
                                      value={question.otherLabel || ""}
                                      onChange={(event) => updateQuestion(question.id, { otherLabel: event.target.value })}
                                      className={inputClass}
                                    />
                                  </Field>
                                </div>
                                <RankGroupsEditor
                                  groups={question.groups || []}
                                  onChange={(groups) => updateQuestion(question.id, { groups })}
                                />
                              </div>
                            )}

                            <div className="space-y-2 rounded-lg border border-outline-variant/20 p-3">
                              <p className={labelClass}>Show this question only when…</p>
                              <ConditionEditor
                                question={question}
                                draft={draft}
                                onChange={(patch) => updateQuestion(question.id, patch)}
                              />
                            </div>

                            <Field label="Bullet points shown above the answer (one per line, optional)">
                              <textarea
                                rows={3}
                                value={(question.descriptionList || []).join("\n")}
                                onChange={(event) =>
                                  updateQuestion(question.id, {
                                    descriptionList: event.target.value
                                      .split("\n")
                                      .map((line) => line.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className={inputClass + " resize-y"}
                              />
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => addQuestion(section.id)}
                      className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Add question to this section
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addSection}
            className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            + Add Section
          </button>
        </div>
      )}
    </div>
  );
}
