"use client";

import SurveyFormRenderer from "@/components/surveys/SurveyFormRenderer";
import { useSurveyTemplate } from "@/lib/useSurveyTemplate";

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></span>
    </div>
  );
}

export default function PostFellowshipSurveyForm({ onSubmit, onCancel, template: providedTemplate }) {
  const { template, error } = useSurveyTemplate("POST_FELLOWSHIP");
  const resolved = providedTemplate || template;

  if (!resolved) {
    if (error) {
      return <p className="text-sm text-red-500 py-6">{error}</p>;
    }
    return <LoadingState />;
  }

  return (
    <SurveyFormRenderer
      template={resolved}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel="Submit Survey"
    />
  );
}
