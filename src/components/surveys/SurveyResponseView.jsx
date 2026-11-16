"use client";

import { useEffect } from "react";
import { formatDate } from "@/lib/date";
import { buildResponseSections } from "@/lib/surveyTemplates";

export default function SurveyResponseView({ survey, template, title, error, onClose }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const sections = template ? buildResponseSections(template, survey?.responses || {}) : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center p-3 pt-8 sm:p-4 sm:pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-6 font-sans max-h-[85dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-3 sticky top-0 bg-white dark:bg-slate-900 pb-4 border-b border-outline-variant/20 z-10">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-on-surface break-words">
              {title || template?.title || "Survey"} Responses
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Submitted on {formatDate(survey?.surveyDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {!template ? (
          error ? (
            <p className="text-sm text-red-500 py-6">{error}</p>
          ) : (
            <div className="flex items-center justify-center py-10">
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></span>
            </div>
          )
        ) : sections.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6">
            No responses were recorded for this survey.
          </p>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id}>
                <h4 className="text-sm font-headline font-bold text-primary uppercase tracking-wider mb-3 border-b border-outline-variant/10 pb-2">
                  {section.title}
                </h4>
                <div className="space-y-4">
                  {section.rows.map((row) => (
                    <div
                      key={row.id}
                      className="pl-3 border-l-2 border-surface-container"
                    >
                      <p className="text-sm font-semibold text-on-surface mb-1">{row.label}</p>
                      {Array.isArray(row.description) && row.description.length > 0 && (
                        <ul className="list-disc list-inside pl-2 space-y-0.5 text-xs text-on-surface-variant leading-relaxed mb-1">
                          {row.description.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      )}
                      <p className="text-sm text-on-surface whitespace-pre-wrap break-words">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
