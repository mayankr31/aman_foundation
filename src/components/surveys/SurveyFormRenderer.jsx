"use client";

import { useMemo, useState } from "react";
import DateInput from "@/components/ui/DateInput";
import { getISTDateKey } from "@/lib/time";
import {
  buildInitialResponses,
  formatQuestionLabel,
  getQuestionLabel,
  getQuestionNumbers,
  getQuestionOptions,
  isQuestionVisible,
  multiSelectSelectedKey,
  optionRatingKey,
  rankSelectedKey,
  validateSurveyResponses,
} from "@/lib/surveyTemplates";

const dropdownClass =
  "px-4 py-2.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

function Dropdown({ value, onChange, options, placeholder = "Select an option" }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={dropdownClass + " w-full"}
    >
      <option value="">{placeholder}</option>
      {(options || []).map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="text-red-500 text-xs mt-1">{children}</p>;
}

function QuestionLabel({ number, label }) {
  return (
    <p className="text-sm font-medium text-on-surface leading-relaxed">
      {formatQuestionLabel(number, label)}
    </p>
  );
}

export default function SurveyFormRenderer({ template, onSubmit, onCancel, submitLabel = "Submit Survey" }) {
  const [responses, setResponses] = useState(() => buildInitialResponses(template));
  const [surveyDate, setSurveyDate] = useState(() => getISTDateKey());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numbers = useMemo(() => getQuestionNumbers(template), [template]);

  const update = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearErrors = (keys) => {
    setErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of keys) {
        if (next[key] !== undefined) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const toggleMultiSelect = (question, option) => {
    const selectedKey = multiSelectSelectedKey(question);
    setResponses((prev) => {
      const selected = Array.isArray(prev[selectedKey]) ? prev[selectedKey] : [];
      const isSelected = selected.includes(option.id);
      const next = isSelected
        ? selected.filter((id) => id !== option.id)
        : [...selected, option.id];
      const nextResponses = { ...prev, [selectedKey]: next };

      if (isSelected) {
        if (question.rating?.enabled) {
          nextResponses[optionRatingKey(question, option)] = "";
        }
        if (option.followUp?.id) {
          nextResponses[option.followUp.id] = "";
          if (option.followUp.otherFieldId) nextResponses[option.followUp.otherFieldId] = "";
        }
      }
      return nextResponses;
    });
    if (question.rating?.enabled) clearErrors([optionRatingKey(question, option)]);
    if (option.followUp?.id) {
      clearErrors([option.followUp.id, option.followUp.otherFieldId].filter(Boolean));
    }
  };

  const toggleRank = (question, groupIndex, optionIndex, optionId) => {
    const rankedKey = rankSelectedKey(question);
    const limit = Number(question.limit) || 3;
    setResponses((prev) => {
      const ranked = Array.isArray(prev[rankedKey]) ? [...prev[rankedKey]] : [];
      const existingIndex = ranked.findIndex((item) => item.key === optionId);
      if (existingIndex >= 0) {
        ranked.splice(existingIndex, 1);
      } else if (ranked.length < limit) {
        ranked.push({ key: optionId, group: groupIndex, option: optionIndex });
      } else {
        return prev;
      }
      const nextResponses = { ...prev, [rankedKey]: ranked };
      if (
        question.otherFieldId &&
        question.otherOptionId &&
        !ranked.some((item) => item.key === question.otherOptionId)
      ) {
        nextResponses[question.otherFieldId] = "";
      }
      return nextResponses;
    });
    clearErrors([question.id, question.otherFieldId].filter(Boolean));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateSurveyResponses(template, responses);
    setErrors(nextErrors);

    const errorKeys = Object.keys(nextErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const element =
        document.getElementById(`survey-field-${firstKey}`) ||
        document.getElementById(`survey-field-${errorKeys[0]}`);
      if (element?.scrollIntoView) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(surveyDate, responses);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingOptions = (question) =>
    template.optionSets?.find((set) => set.id === question.rating?.optionSetId)?.options || [];

  const followUpOptions = (followUp) =>
    template.optionSets?.find((set) => set.id === followUp?.optionSetId)?.options ||
    followUp?.options ||
    [];

  const renderControl = (question) => {
    const type = question.type || "select";

    if (type === "multiSelect") {
      const selectedKey = multiSelectSelectedKey(question);
      const selected = responses[selectedKey] || [];
      return (
        <div className="space-y-3">
          {(question.options || []).map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <div key={option.id} className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMultiSelect(question, option)}
                    className="mt-0.5 w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-on-surface leading-relaxed">
                    {option.bold ? (
                      <>
                        <strong>{option.bold}</strong>
                        {String(option.label || "").startsWith(option.bold)
                          ? String(option.label).slice(option.bold.length)
                          : option.label}
                      </>
                    ) : (
                      option.label
                    )}
                  </span>
                </label>

                {isSelected && (
                  <div className="ml-4 sm:ml-7 space-y-3">
                    {question.rating?.enabled && (
                      <div>
                        <Dropdown
                          value={responses[optionRatingKey(question, option)] || ""}
                          onChange={(value) => update(optionRatingKey(question, option), value)}
                          options={ratingOptions(question)}
                          placeholder={question.rating.label || "Select an option"}
                        />
                        <FieldError>{errors[optionRatingKey(question, option)]}</FieldError>
                      </div>
                    )}

                    {option.followUp?.id && (
                      <div className="space-y-3">
                        {option.followUp.type === "select" ? (
                          <div>
                            <p className="text-sm font-medium text-on-surface mb-1.5">
                              {option.followUp.label}
                            </p>
                            <Dropdown
                              value={responses[option.followUp.id] || ""}
                              onChange={(value) => update(option.followUp.id, value)}
                              options={followUpOptions(option.followUp)}
                              placeholder="Select an option"
                            />
                            <FieldError>{errors[option.followUp.id]}</FieldError>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-on-surface mb-1.5">
                              {option.followUp.label}
                            </p>
                            <textarea
                              rows={3}
                              value={responses[option.followUp.id] || ""}
                              onChange={(event) => update(option.followUp.id, event.target.value)}
                              placeholder={option.followUp.placeholder || ""}
                              className={dropdownClass + " w-full resize-y"}
                            />
                            <FieldError>{errors[option.followUp.id]}</FieldError>
                          </div>
                        )}

                        {option.followUp.otherFieldId &&
                          option.followUp.otherOptionId &&
                          String(responses[option.followUp.id]) ===
                            String(option.followUp.otherOptionId) && (
                            <div>
                              <p className="text-sm font-medium text-on-surface mb-1.5">
                                {option.followUp.otherLabel || "Please specify"}
                              </p>
                              <textarea
                                rows={2}
                                value={responses[option.followUp.otherFieldId] || ""}
                                onChange={(event) =>
                                  update(option.followUp.otherFieldId, event.target.value)
                                }
                                placeholder="Please specify..."
                                className={dropdownClass + " w-full resize-y"}
                              />
                              <FieldError>{errors[option.followUp.otherFieldId]}</FieldError>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <FieldError>{errors[question.id]}</FieldError>
        </div>
      );
    }

    if (type === "rank") {
      const rankedKey = rankSelectedKey(question);
      const ranked = responses[rankedKey] || [];
      return (
        <div className="space-y-4">
          <div className="space-y-5">
            {(question.groups || []).map((group, groupIndex) => (
              <div key={group.id || groupIndex}>
                <p className="text-sm font-semibold text-on-surface mb-2">{group.heading}</p>
                <div className="space-y-2 ml-2">
                  {(group.options || []).map((option, optionIndex) => {
                    const rankIndex = ranked.findIndex((item) => item.key === option.id);
                    const isSelected = rankIndex >= 0;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleRank(question, groupIndex, optionIndex, option.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-left w-full ${
                          isSelected
                            ? "border-primary bg-primary-fixed/10 shadow-sm"
                            : "border-outline-variant hover:border-primary/50"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? "bg-primary text-white"
                              : "border-2 border-outline-variant text-on-surface-variant"
                          }`}
                        >
                          {isSelected ? rankIndex + 1 : ""}
                        </span>
                        <span className="text-sm text-on-surface">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {question.otherFieldId &&
            question.otherOptionId &&
            ranked.some((item) => item.key === question.otherOptionId) && (
              <div>
                <p className="text-sm font-medium text-on-surface mb-1.5">
                  {question.otherLabel || "Please specify"}
                </p>
                <textarea
                  rows={2}
                  value={responses[question.otherFieldId] || ""}
                  onChange={(event) => update(question.otherFieldId, event.target.value)}
                  placeholder="Please specify..."
                  className={dropdownClass + " w-full resize-y"}
                />
                <FieldError>{errors[question.otherFieldId]}</FieldError>
              </div>
            )}

          {ranked.length > 0 && (
            <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
              <p className="text-xs font-semibold text-on-surface mb-2">Your Rankings:</p>
              {ranked.map((item, index) => {
                let label = item.key;
                for (const group of question.groups || []) {
                  const match = (group.options || []).find((option) => option.id === item.key);
                  if (match) label = match.label;
                }
                return (
                  <p key={index} className="text-sm text-on-surface-variant">
                    <span className="font-bold text-primary">Rank {index + 1}:</span> {label}
                  </p>
                );
              })}
            </div>
          )}
          <FieldError>{errors[question.id]}</FieldError>
        </div>
      );
    }

    if (type === "scale") {
      const min = Number(question.min ?? 0);
      const max = Number(question.max ?? 10);
      const values = [];
      for (let value = min; value <= max; value += 1) values.push(value);
      return (
        <div>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => update(question.id, String(value))}
                className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  String(responses[question.id]) === String(value)
                    ? "bg-primary text-white border-primary shadow-md"
                    : "border-outline-variant text-on-surface hover:border-primary hover:bg-primary-fixed/10"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <FieldError>{errors[question.id]}</FieldError>
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div>
          <textarea
            rows={3}
            value={responses[question.id] || ""}
            onChange={(event) => update(question.id, event.target.value)}
            placeholder={question.placeholder || ""}
            className={dropdownClass + " w-full resize-y"}
          />
          <FieldError>{errors[question.id]}</FieldError>
        </div>
      );
    }

    if (type === "radio") {
      const options = getQuestionOptions(template, question);
      return (
        <div>
          <div className="grid grid-cols-1 gap-2 mt-1">
            {options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  String(responses[question.id]) === String(option.id)
                    ? "border-primary bg-primary-fixed/10"
                    : "border-outline-variant hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={String(responses[question.id]) === String(option.id)}
                  onChange={() => update(question.id, option.id)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-on-surface">{option.label}</span>
              </label>
            ))}
          </div>
          <FieldError>{errors[question.id]}</FieldError>
        </div>
      );
    }

    const options = getQuestionOptions(template, question);
    return (
      <div>
        <Dropdown
          value={responses[question.id] || ""}
          onChange={(value) => update(question.id, value)}
          options={options}
          placeholder={question.placeholder || "Select an option"}
        />
        <FieldError>{errors[question.id]}</FieldError>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface">{template.title}</h2>
          {template.intro && (
            <p className="text-sm text-on-surface-variant mt-1">{template.intro}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-on-surface">
            {template.dateLabel || "Survey Date"}:
          </label>
          <DateInput
            value={surveyDate}
            onChange={(event) => setSurveyDate(event.target.value)}
            required
            className={dropdownClass}
          />
        </div>
      </div>

      {template.notice && (
        <div className="bg-primary-fixed/20 border-l-4 border-primary rounded-r-lg p-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">{template.notice}</p>
        </div>
      )}

      {(template.sections || []).map((section) => {
        const sectionQuestions = (template.questions || []).filter(
          (question) => question.sectionId === section.id
        );
        const visibleQuestions = sectionQuestions.filter((question) =>
          isQuestionVisible(question, responses)
        );
        if (visibleQuestions.length === 0) return null;

        return (
          <div key={section.id}>
            <h3 className="text-xl font-headline font-black text-on-surface border-b border-outline-variant/20 pb-2 mb-4">
              {section.label}
            </h3>
            {section.note && (
              <div className="bg-primary-fixed/20 border-l-4 border-primary rounded-r-lg p-4 mb-6">
                <p className="text-sm text-on-surface-variant leading-relaxed">{section.note}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              {sectionQuestions.map((question) => {
                if (!isQuestionVisible(question, responses)) return null;
                const number = numbers[question.id];
                const label = getQuestionLabel(template, question, responses);

                return (
                  <div
                    key={question.id}
                    id={`survey-field-${question.id}`}
                    className={question.indent ? "ml-2 pl-3 sm:ml-4 sm:pl-4 border-l-2 border-primary" : ""}
                  >
                    <div className="space-y-2">
                      <QuestionLabel number={number} label={label} />
                      {Array.isArray(question.descriptionList) &&
                        question.descriptionList.length > 0 && (
                          <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-on-surface-variant leading-relaxed">
                            {question.descriptionList.map((point, index) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        )}
                      {question.helperText && (
                        <p className="text-xs text-on-surface-variant">{question.helperText}</p>
                      )}
                      {renderControl(question)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 border-t border-outline-variant/20">
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-500 sm:mr-auto">
            Please complete the highlighted questions before submitting.
          </p>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
