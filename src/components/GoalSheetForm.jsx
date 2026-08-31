"use client";

import { useState, useEffect, useCallback } from "react";
import {
  QUESTIONS,
  SECTIONS,
  TITLES,
  TITLE_CATEGORIES,
  LEVELS,
  RATING_OPTIONS,
  getDefaultResponses,
} from "@/data/goalSheetConstants";
import { useToast } from "@/context/ToastContext";

export default function GoalSheetForm({
  fellowId,
  sheetData,
  isManager = false,
  token,
  onClose,
  onSave,
}) {
  const toast = useToast();
  const isNew = !sheetData;
  const [responses, setResponses] = useState(() => {
    if (sheetData?.responses && typeof sheetData.responses === "object") {
      const defaults = getDefaultResponses();
      return { ...defaults, ...sheetData.responses };
    }
    return getDefaultResponses();
  });
  const [portfolioLink, setPortfolioLink] = useState(
    sheetData?.portfolioLink || ""
  );
  const [status, setStatus] = useState(sheetData?.status || "SUBMITTED");
  const [saving, setSaving] = useState(false);

  // For title+level sections, we keep track of selected title-level pairs
  const getSectionValue = useCallback(
    (questionId, sectionKey) => {
      if (!responses[questionId]) return "";
      return responses[questionId][sectionKey] || "";
    },
    [responses]
  );

  const getTitlesValue = useCallback(
    (questionId, sectionKey) => {
      if (!responses[questionId]) return [];
      const val = responses[questionId][sectionKey];
      return Array.isArray(val) ? val : [];
    },
    [responses]
  );

  const updateSection = (questionId, sectionKey, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [sectionKey]: value,
      },
    }));
  };

  const toggleTitle = (questionId, sectionKey, title) => {
    const current = getTitlesValue(questionId, sectionKey);
    const exists = current.find((item) => item.title === title);
    if (exists) {
      updateSection(
        questionId,
        sectionKey,
        current.filter((item) => item.title !== title)
      );
    } else {
      updateSection(questionId, sectionKey, [
        ...current,
        { title, level: LEVELS[0] },
      ]);
    }
  };

  const updateTitleLevel = (questionId, sectionKey, title, level) => {
    const current = getTitlesValue(questionId, sectionKey);
    updateSection(
      questionId,
      sectionKey,
      current.map((item) =>
        item.title === title ? { ...item, level } : item
      )
    );
  };

  const handleSave = async (newStatus) => {
    setSaving(true);
    try {
      const url = isNew
        ? `/api/fellows/${fellowId}/goal-sheets`
        : `/api/fellows/${fellowId}/goal-sheets/${sheetData.id}`;

      const method = isNew ? "POST" : "PATCH";

      const body = {
        responses,
        status: newStatus,
        portfolioLink,
      };

      if (isNew) {
        body.date = new Date().toISOString();
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setStatus(newStatus);
        toast.success("Goal sheet saved successfully!");
        if (onSave) onSave(json.data);
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch (err) {
      console.error("Save goal sheet error:", err);
      toast.error("An error occurred while saving");
    }
    setSaving(false);
  };

  const handleManagerReview = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/fellows/${fellowId}/goal-sheets/${sheetData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "review",
            responses,
          }),
        }
      );

      const json = await res.json();
      if (json.success) {
        toast.success("Review submitted successfully!");
        if (onSave) onSave(json.data);
      } else {
        toast.error(json.error || "Failed to submit review");
      }
    } catch (err) {
      console.error("Manager review error:", err);
      toast.error("An error occurred");
    }
    setSaving(false);
  };

  const isManagerField = (question) => question.isManagerOnly === true;
  const isEditable = !isManager || isManagerField;

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-headline font-bold text-xl text-on-surface">
            Goal Sheet
          </h2>
          {sheetData?.date && (
            <p className="text-sm text-on-surface-variant mt-0.5">
              {new Date(sheetData.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              status === "SUBMITTED"
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-primary-fixed text-on-primary-fixed"
            }`}
          >
            {status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      {/* Form body */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10 font-sans">
        {QUESTIONS.map((question) => {
          const isReadOnly =
            isManager
              ? !isManagerField(question)
              : isManagerField(question);

          return (
            <div
              key={question.id}
              className={`bg-surface-container-lowest rounded-xl p-6 shadow-ambient border ${
                isManagerField(question)
                  ? "border-primary/30 bg-primary-fixed/5"
                  : "border-outline-variant/10"
              }`}
            >
              <h3 className="font-headline font-bold text-base text-on-surface mb-6 flex items-center gap-2">
                {question.label}
                {isManagerField(question) && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-white font-sans">
                    Manager Review
                  </span>
                )}
              </h3>
              <div className="space-y-5">
                {question.sections.map((section) => (
                  <div key={section.key}>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                      {SECTIONS[section.key]}
                    </label>
                    {section.type === "titles" ? (
                      <TitlesSelector
                        selected={getTitlesValue(question.id, section.key)}
                        onToggle={(title) =>
                          !isReadOnly &&
                          toggleTitle(question.id, section.key, title)
                        }
                        onLevelChange={(title, level) =>
                          !isReadOnly &&
                          updateTitleLevel(
                            question.id,
                            section.key,
                            title,
                            level
                          )
                        }
                        readOnly={isReadOnly}
                      />
                    ) : section.type === "rating" ? (
                      <select
                        value={getSectionValue(question.id, section.key)}
                        onChange={(e) =>
                          !isReadOnly &&
                          updateSection(
                            question.id,
                            section.key,
                            e.target.value
                          )
                        }
                        disabled={isReadOnly}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm ${
                          isReadOnly
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <option value="">
                          Select rating...
                        </option>
                        {RATING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <textarea
                        value={getSectionValue(question.id, section.key)}
                        onChange={(e) =>
                          !isReadOnly &&
                          updateSection(
                            question.id,
                            section.key,
                            e.target.value
                          )
                        }
                        readOnly={isReadOnly}
                        placeholder="Use - for bullet points"
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface resize-y ${
                          isReadOnly
                            ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                            : ""
                        }`}
                      />
                    )}
                  </div>
                ))}

                {/* Y2 section (always shown) */}
                <div key="y2Fellow">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 whitespace-pre-line">
                    {SECTIONS.y2Fellow}
                  </label>
                  <textarea
                    value={getSectionValue(question.id, "y2Fellow")}
                    onChange={(e) =>
                      !isReadOnly &&
                      updateSection(question.id, "y2Fellow", e.target.value)
                    }
                    readOnly={isReadOnly}
                    placeholder="Use - for bullet points"
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface resize-y ${
                      isReadOnly
                        ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Portfolio link */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
          <label className="block font-headline font-bold text-base text-on-surface mb-3">
            Please link your fellow portfolio in the space provided below
          </label>
          <textarea
            value={portfolioLink}
            onChange={(e) => setPortfolioLink(e.target.value)}
            placeholder="Add your portfolio link and any additional points... (use - for bullet points)"
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface resize-y"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pb-8">
          {isManager ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleManagerReview}
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Submit Review"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleSave("SUBMITTED")}
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TitlesSelector({ selected = [], onToggle, onLevelChange, readOnly }) {
  return (
    <div className="space-y-4">
      {Object.entries(TITLE_CATEGORIES).map(([category, { label, count }]) => (
        <div key={category}>
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            {label}
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: count }, (_, i) => {
              const title = `${category}${i + 1}`;
              const item = selected.find((s) => s.title === title);
              const isSelected = !!item;

              return (
                <div key={title} className="flex items-center gap-1">
                  <button
                    onClick={() => onToggle(title)}
                    disabled={readOnly}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "bg-transparent text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
                    } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {title}
                  </button>
                  {isSelected && (
                    <select
                      value={item.level}
                      onChange={(e) => onLevelChange(title, e.target.value)}
                      disabled={readOnly}
                      className={`text-xs px-2 py-1.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface ${
                        readOnly ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
