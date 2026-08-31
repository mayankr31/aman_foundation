"use client";

import { useEffect } from "react";
import {
  COMPETENCY_CATEGORIES,
  CATEGORY_COUNT,
  LEVELS,
  MATRIX_CELLS,
} from "@/data/pmReflectionConstants";

export default function PMReflectionViewer({ reflection, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const responses = reflection?.responses || {};
  const matrix = reflection?.matrix || {};

  const levelColor = (level) => {
    const idx = LEVELS.indexOf(level);
    if (idx === -1) return "bg-surface-container text-on-surface-variant";
    const colors = [
      "bg-red-100 text-red-700",
      "bg-amber-100 text-amber-700",
      "bg-emerald-100 text-emerald-700",
      "bg-blue-100 text-blue-700",
    ];
    return colors[idx];
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center p-4 pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-8 font-sans max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 pb-4 border-b border-outline-variant/20 z-10">
          <div>
            <h3 className="text-lg font-bold text-on-surface">
              POST LDJC PM Reflection
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {new Date(reflection.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {reflection.author?.name && (
                <span> &bull; Reviewed by {reflection.author.name}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div>
          <h4 className="text-sm font-headline font-bold text-primary uppercase tracking-wider mb-4 border-b border-outline-variant/10 pb-2">
            Competency Matrix
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MATRIX_CELLS.map((cell) => (
              <div
                key={cell.key}
                className="rounded-xl p-4 border border-outline-variant/10"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: matrix[cell.key] || "#d1d5db" }}
                  ></span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {cell.key.replace("_", ", ")}
                    </p>
                    <p className="text-xs text-on-surface-variant">{cell.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-headline font-bold text-primary uppercase tracking-wider mb-4 border-b border-outline-variant/10 pb-2">
            Competency Ratings
          </h4>
          <div className="space-y-5">
            {COMPETENCY_CATEGORIES.map((category) => (
              <div key={category.key}>
                <p className="text-sm font-bold text-on-surface mb-2">
                  {category.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: CATEGORY_COUNT }, (_, i) => {
                    const key = `${category.prefix}${i + 1}`;
                    const level = responses[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/10 bg-surface-container-lowest"
                      >
                        <span className="text-xs font-bold text-on-surface-variant">
                          {key}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            level ? levelColor(level) : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {level || "Not rated"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {reflection.notes && (
          <div>
            <h4 className="text-sm font-headline font-bold text-primary uppercase tracking-wider mb-3 border-b border-outline-variant/10 pb-2">
              Notes
            </h4>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
              {reflection.notes}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
