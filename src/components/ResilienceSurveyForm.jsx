"use client";

import { useState } from "react";
import DateInput from "@/components/ui/DateInput";
import { KYR_SECTIONS, KYR_SCORECARD } from "@/lib/kyrFormSchema";
import { computeKyrScores, getKyrSectionScore } from "@/lib/kyrSurveyScores";

const SCORECARD_STEP = KYR_SECTIONS.length;
const TOTAL_STEPS = KYR_SECTIONS.length + 1;

function scrollToTop() {
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function ResilienceSurveyForm({
  mode = "page",
  prefill = {},
  hideQuestionIds = [],
  lockQuestionIds = [],
  title = "KYR Form",
  submitLabel = "Submit Survey",
  onSubmit,
  onBack,
}) {
  const hidden = new Set(hideQuestionIds);
  const locked = new Set(lockQuestionIds);

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState(() => ({ ...prefill }));
  const [scorecard, setScorecard] = useState(null);
  const [sectionErrors, setSectionErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isScorecardStep = currentStep === SCORECARD_STEP;
  const section = isScorecardStep ? null : KYR_SECTIONS[currentStep];

  /* ------------------------------------------------------------------ */
  /* Visibility / locking helpers                                        */
  /* ------------------------------------------------------------------ */

  const isQuestionHidden = (question) => {
    if (hidden.has(question.id)) return true;
    if (question.fields?.length) {
      return question.fields.every((field) => hidden.has(field.key));
    }
    return false;
  };

  const isFieldLocked = (question, key) =>
    locked.has(question.id) || locked.has(key);

  const isQuestionLocked = (question) => {
    if (locked.has(question.id)) return true;
    if (question.fields?.length) {
      return question.fields.every((field) => locked.has(field.key));
    }
    return false;
  };

  /* ------------------------------------------------------------------ */
  /* Answer helpers                                                     */
  /* ------------------------------------------------------------------ */

  const isAnswered = (question) => {
    const value = responses[question.id];

    if (question.type === "checkbox") {
      return Array.isArray(value) && value.length > 0;
    }
    if (question.type === "grid") {
      return question.rows.every((row) => value?.[row]);
    }
    if (question.type === "gridMulti") {
      const grid = value || {};
      return Object.values(grid).some((entry) => Array.isArray(entry) && entry.length > 0);
    }
    if (question.type === "composite" || question.type === "amountRange") {
      return (question.fields || []).every((field) => {
        const fieldValue = responses[field.key];
        return fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== "";
      });
    }
    return value !== undefined && value !== null && String(value).trim() !== "";
  };

  const validateSection = (currentSection) =>
    currentSection.questions
      .filter(
        (question) =>
          question.required &&
          !isQuestionHidden(question) &&
          !isQuestionLocked(question) &&
          !isAnswered(question)
      )
      .map((question) => question.displayId || question.id);

  const validateScorecard = () =>
    KYR_SCORECARD.filter((item) => {
      const value = scorecard?.[item.key];
      if (value === undefined || value === null || String(value).trim() === "") return true;
      const parsed = Number(value);
      return !Number.isFinite(parsed) || parsed < 0 || parsed > 100;
    }).map((item) => item.label);

  /* ------------------------------------------------------------------ */
  /* Change handlers                                                    */
  /* ------------------------------------------------------------------ */

  const handleChange = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleRadioChange = (question, value) => {
    setResponses((prev) => {
      const next = { ...prev, [question.id]: value };
      if (question.otherField && value !== question.otherOption) {
        next[question.otherField] = "";
      }
      return next;
    });
  };

  const handleMultiChange = (question, option, checked) => {
    setResponses((prev) => {
      const current = prev[question.id] || [];
      const nextValues = checked
        ? [...current, option]
        : current.filter((item) => item !== option);
      const next = { ...prev, [question.id]: nextValues };
      if (question.otherField && option === question.otherOption && !checked) {
        next[question.otherField] = "";
      }
      return next;
    });
  };

  const handleGridChange = (questionId, row, col) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [row]: col,
      },
    }));
  };

  const handleMultiGridChange = (questionId, row, col, checked) => {
    setResponses((prev) => {
      const current = prev[questionId] || {};
      const currentRow = current[row] || [];
      return {
        ...prev,
        [questionId]: {
          ...current,
          [row]: checked ? [...currentRow, col] : currentRow.filter((entry) => entry !== col),
        },
      };
    });
  };

  const handleScorecardChange = (key, value) => {
    setScorecard((prev) => ({ ...(prev || {}), [key]: value }));
  };

  /* ------------------------------------------------------------------ */
  /* Navigation / submit                                                */
  /* ------------------------------------------------------------------ */

  const handleNext = () => {
    if (isScorecardStep) {
      const invalid = validateScorecard();
      if (invalid.length > 0) {
        setSectionErrors(invalid);
        scrollToTop();
        return;
      }
      setSectionErrors([]);
      handleSubmit();
      return;
    }

    const errors = validateSection(section);
    if (errors.length > 0) {
      setSectionErrors(errors);
      scrollToTop();
      return;
    }

    setSectionErrors([]);
    if (currentStep === KYR_SECTIONS.length - 1) {
      setScorecard(computeKyrScores(responses));
    }
    setCurrentStep((prev) => Math.min(prev + 1, SCORECARD_STEP));
    scrollToTop();
  };

  const handlePrev = () => {
    setSectionErrors([]);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      scrollToTop();
    } else if (mode === "embedded" && typeof onBack === "function") {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalScores = { ...(scorecard || computeKyrScores(responses)) };
      const values = KYR_SCORECARD.map((item) => Number(finalScores[item.key])).filter((value) =>
        Number.isFinite(value)
      );
      finalScores.overallScore = values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : 0;
      await onSubmit?.({ responses, scores: finalScores });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render helpers                                                     */
  /* ------------------------------------------------------------------ */

  const labelText = (question) => (
    <>
      {question.displayId || question.id}. {question.text}
      {question.required && <span className="text-error ml-1">*</span>}
      {isQuestionLocked(question) && (
        <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[11px]">lock</span>
          From profile
        </span>
      )}
    </>
  );

  const cardClass = (question) =>
    `space-y-3 font-sans p-4 rounded border ${
      sectionErrors.includes(question.displayId || question.id)
        ? "border-error bg-error-container/10"
        : "border-surface-container-highest bg-surface-container-lowest"
    }`;

  const typeChip = (question) => {
    if (question.type === "checkbox" || question.type === "gridMulti") {
      return "Multiple Choice";
    }
    if (question.type === "radio" || question.type === "grid") {
      return "Single Choice";
    }
    return "";
  };

  const renderOtherInput = (question) => {
    if (!question.otherField) return null;
    const value = responses[question.id];
    const show = Array.isArray(value)
      ? value.includes(question.otherOption)
      : value === question.otherOption;
    if (!show) return null;

    const disabled = isFieldLocked(question, question.otherField);
    return (
      <input
        type="text"
        value={responses[question.otherField] || ""}
        disabled={disabled}
        onChange={(event) => handleChange(question.otherField, event.target.value)}
        placeholder={question.otherLabel || "Please specify"}
        className={`w-full max-w-md bg-surface-container-high border-none rounded p-3 text-sm focus:ring-2 focus:ring-primary outline-none ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
    );
  };

  const inputClass = (disabled) =>
    `w-full bg-surface-container-high border-none rounded p-3 text-sm focus:ring-2 focus:ring-primary outline-none ${
      disabled ? "opacity-60 cursor-not-allowed" : ""
    }`;

  const renderField = (question, field) => {
    const disabled = isFieldLocked(question, field.key);
    const value = responses[field.key] ?? "";
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-on-surface-variant">
          {field.label}
          {isFieldLocked(question, field.key) && !isQuestionLocked(question) && (
            <span className="ml-1.5 text-[9px] uppercase tracking-wider text-on-surface-variant">
              (profile)
            </span>
          )}
        </span>
        {field.type === "date" ? (
          <DateInput
            value={value}
            disabled={disabled}
            onChange={(event) => handleChange(field.key, event.target.value)}
            className={inputClass(disabled)}
          />
        ) : (
          <input
            type={field.type === "number" ? "number" : field.type === "time" ? "time" : "text"}
            value={value}
            disabled={disabled}
            onChange={(event) => handleChange(field.key, event.target.value)}
            className={inputClass(disabled)}
          />
        )}
      </div>
    );
  };

  const renderQuestion = (question) => {
    if (isQuestionHidden(question)) return null;

    const chip = typeChip(question);

    return (
      <div key={question.id} className={cardClass(question)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
          <label className="block text-sm font-semibold">{labelText(question)}</label>
          {chip && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit whitespace-nowrap ${
                chip === "Multiple Choice"
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {chip}
            </span>
          )}
        </div>

        {question.type === "radio" && (
          <>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
              {question.options.map((option) => {
                const disabled = isQuestionLocked(question);
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={responses[question.id] === option}
                      disabled={disabled}
                      onChange={() => handleRadioChange(question, option)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
            {renderOtherInput(question)}
          </>
        )}

        {question.type === "checkbox" && (
          <>
            <div className="flex flex-col gap-2">
              {question.options.map((option) => {
                const disabled = isQuestionLocked(question);
                return (
                  <label
                    key={option}
                    className={`flex items-start gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      name={question.id}
                      value={option}
                      checked={responses[question.id]?.includes(option) || false}
                      disabled={disabled}
                      onChange={(event) =>
                        handleMultiChange(question, option, event.target.checked)
                      }
                      className="w-4 h-4 mt-0.5"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
            {renderOtherInput(question)}
          </>
        )}

        {question.type === "text" && (
          <input
            type="text"
            value={responses[question.id] || ""}
            disabled={isQuestionLocked(question)}
            onChange={(event) => handleChange(question.id, event.target.value)}
            className={`${inputClass(isQuestionLocked(question))} max-w-md`}
          />
        )}

        {question.type === "number" && (
          <input
            type="number"
            value={responses[question.id] || ""}
            disabled={isQuestionLocked(question)}
            onChange={(event) => handleChange(question.id, event.target.value)}
            className={`${inputClass(isQuestionLocked(question))} max-w-md`}
          />
        )}

        {(question.type === "composite" || question.type === "amountRange") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.fields.map((field) => renderField(question, field))}
          </div>
        )}

        {question.type === "grid" && (
          <div className="overflow-x-auto">
            <table className="mobile-card-table w-full text-left text-sm whitespace-nowrap min-w-max">
              <thead>
                <tr>
                  <th className="p-2 border-b border-surface-container-highest">Items</th>
                  {question.cols.map((col) => (
                    <th key={col} className="p-2 border-b border-surface-container-highest">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.rows.map((row) => (
                  <tr key={row}>
                    <td data-label="" className="p-2 border-b border-surface-container-highest">
                      {row}
                    </td>
                    {question.cols.map((col) => (
                      <td
                        key={col}
                        data-label={col}
                        className="p-2 border-b border-surface-container-highest text-center"
                      >
                        <input
                          type="radio"
                          name={`${question.id}_${row}`}
                          value={col}
                          disabled={isQuestionLocked(question)}
                          checked={responses[question.id]?.[row] === col}
                          onChange={() => handleGridChange(question.id, row, col)}
                          className="w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {question.type === "gridMulti" && (
          <div className="overflow-x-auto">
            <table className="mobile-card-table w-full text-left text-sm whitespace-nowrap min-w-max">
              <thead>
                <tr>
                  <th className="p-2 border-b border-surface-container-highest">Items</th>
                  {question.cols.map((col) => (
                    <th key={col} className="p-2 border-b border-surface-container-highest">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.rows.map((row) => (
                  <tr key={row}>
                    <td data-label="" className="p-2 border-b border-surface-container-highest">
                      {row}
                    </td>
                    {question.cols.map((col) => (
                      <td
                        key={col}
                        data-label={col}
                        className="p-2 border-b border-surface-container-highest text-center"
                      >
                        <input
                          type="checkbox"
                          name={`${question.id}_${row}_${col}`}
                          value={col}
                          disabled={isQuestionLocked(question)}
                          checked={responses[question.id]?.[row]?.includes(col) || false}
                          onChange={(event) =>
                            handleMultiGridChange(question.id, row, col, event.target.checked)
                          }
                          className="w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSection = () => {
    const sectionScore = getKyrSectionScore(section.id, responses);
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-headline mb-4">
          Section {section.id} - {section.title}
        </h2>
        {section.intro && (
          <p className="text-sm text-on-surface-variant font-sans mb-6">{section.intro}</p>
        )}
        {section.questions.map(renderQuestion)}
        {sectionScore && (
          <div className="rounded-lg border border-primary/20 bg-primary-container/10 p-3 text-sm font-sans flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-on-surface-variant">{sectionScore.label}:</span>
            <span className="text-lg font-bold text-primary">{sectionScore.value}%</span>
          </div>
        )}
      </div>
    );
  };

  const overallPreview = (() => {
    const values = KYR_SCORECARD.map((item) => Number(scorecard?.[item.key])).filter((value) =>
      Number.isFinite(value)
    );
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  })();

  const renderScorecard = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">
        Your Family&apos;s Resilience Scorecard
      </h2>
      <p className="text-sm text-on-surface-variant font-sans">
        Now, we will display some of our key observations based on your responses. The scores
        below are calculated automatically — review them and adjust any value before submitting.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {KYR_SCORECARD.map((item) => (
          <div
            key={item.key}
            className="p-4 rounded border border-surface-container-highest bg-surface-container-lowest flex flex-col gap-2"
          >
            <label className="text-sm font-semibold">{item.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={scorecard?.[item.key] ?? ""}
                onChange={(event) => handleScorecardChange(item.key, event.target.value)}
                className="w-24 bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-sm font-bold text-on-surface-variant">%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary-container/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm font-semibold text-on-surface">
          Overall Resilience Score
        </span>
        <span className="text-2xl font-bold text-primary">{overallPreview}%</span>
      </div>
    </div>
  );

  return (
    <div
      className={
        mode === "page"
          ? "bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden"
          : "border border-outline-variant/20 rounded-xl overflow-hidden"
      }
    >
      {/* Progress Header */}
      <div className="bg-surface-container-low p-4 sm:p-6 border-b border-outline-variant/10">
        <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">{title}</h1>
        <div className="flex items-center justify-between text-sm font-sans text-on-surface-variant font-medium">
          <span>{isScorecardStep ? "Scorecard" : section.title}</span>
          <span>
            Step {currentStep + 1} of {TOTAL_STEPS}
          </span>
        </div>
        <div className="w-full bg-surface-container-highest h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-6 md:p-8 min-h-[400px]">
        {sectionErrors.length > 0 && (
          <div className="mb-5 p-3 rounded-lg border border-error/30 bg-error-container/10 font-sans">
            <p className="text-xs font-bold text-error mb-1">
              {isScorecardStep
                ? "Please enter a valid score (0-100) for:"
                : "Please answer the required questions marked with * :"}
            </p>
            <p className="text-xs text-on-surface-variant">{sectionErrors.join(", ")}</p>
          </div>
        )}
        {isScorecardStep ? renderScorecard() : renderSection()}
      </div>

      {/* Footer Actions */}
      <div className="bg-surface-container-low p-4 sm:p-6 border-t border-outline-variant/10 flex flex-wrap items-center justify-between gap-3 font-sans">
        <button
          type="button"
          onClick={handlePrev}
          disabled={
            currentStep === 0 && !(mode === "embedded" && typeof onBack === "function")
          }
          className={`px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 ${
            currentStep === 0 && !(mode === "embedded" && typeof onBack === "function")
              ? "opacity-50 cursor-not-allowed text-on-surface-variant"
              : "text-primary hover:bg-primary/10 transition-colors"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          {currentStep === 0 && mode === "embedded" ? "Back to Details" : "Previous"}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="gradient-primary bg-primary text-on-primary px-6 py-2.5 rounded font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-glow disabled:opacity-50"
        >
          {!isScorecardStep ? (
            <>
              Next
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </>
          ) : isSubmitting ? (
            "Submitting..."
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  );
}
