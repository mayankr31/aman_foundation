"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, RotateCcw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import SurveyTemplateEditor from "@/components/surveys/SurveyTemplateEditor";
import { clearSurveyTemplateCache } from "@/lib/useSurveyTemplate";

function formatUpdated(value) {
  if (!value) return "Using built-in defaults";
  try {
    return `Last saved ${new Date(value).toLocaleString()}`;
  } catch {
    return "Last saved recently";
  }
}

export default function SurveyTemplatesPanel({ token }) {
  const toast = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const loadSurveys = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/survey-templates", { headers: headers() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load surveys");
      setSurveys(json.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const openEditor = async (survey) => {
    setLoadingTemplate(true);
    setError("");
    try {
      const res = await fetch(`/api/survey-templates/${survey.key}`, { headers: headers() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load survey");
      setTemplate(json.data);
    } catch (err) {
      setError(err.message || "Failed to load survey");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const resetSurvey = async () => {
    if (!resetTarget) return;
    try {
      const res = await fetch(`/api/survey-templates/${resetTarget.key}`, {
        method: "DELETE",
        headers: headers(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to reset survey");
      clearSurveyTemplateCache(resetTarget.key);
      toast.success(`${resetTarget.label} restored to defaults.`);
      await loadSurveys();
    } catch (err) {
      toast.error(err.message || "Failed to reset survey");
    }
  };

  if (template) {
    return (
      <SurveyTemplateEditor
        initialTemplate={template}
        token={token}
        onCancel={() => setTemplate(null)}
        onSaved={async () => {
          setTemplate(null);
          await loadSurveys();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white">
          Survey Templates
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Edit the questions, options and conditional follow-ups shown to Fellows. Changes apply to
          new responses immediately; previously submitted answers remain viewable.
        </p>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {surveys.map((survey) => (
          <div
            key={survey.key}
            className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1320] p-5 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">{survey.icon}</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white break-words">
                  {survey.label}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {survey.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-500">
                {survey.questionCount} questions
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  survey.customized
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {survey.customized ? "Customised" : "Default"}
              </span>
            </div>

            <p className="text-[10px] text-slate-400">
              {formatUpdated(survey.updatedAt)}
              {survey.updatedBy ? ` · ${survey.updatedBy}` : ""}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              <button
                type="button"
                onClick={() => openEditor(survey)}
                disabled={loadingTemplate}
                className="px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/10 transition-colors disabled:opacity-60"
              >
                {loadingTemplate ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
                Edit Survey
              </button>
              {survey.customized && (
                <button
                  type="button"
                  onClick={() => setResetTarget(survey)}
                  className="px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/10 transition-colors"
                >
                  <RotateCcw size={12} />
                  Reset to Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmActionModal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        onConfirm={resetSurvey}
        title="Reset survey to default"
        message={`Reset "${resetTarget?.label || "this survey"}" to its built-in questions? Any custom wording, options and ordering will be lost.`}
        confirmText="Reset"
        variant="danger"
      />
    </div>
  );
}
