"use client";

import SurveyResponseView from "@/components/surveys/SurveyResponseView";
import { useSurveyTemplate } from "@/lib/useSurveyTemplate";

export default function EngagementSurveyViewer({ survey, onClose, template: providedTemplate }) {
  const { template, error } = useSurveyTemplate("ENGAGEMENT");
  const resolved = providedTemplate || template;

  return (
    <SurveyResponseView
      survey={survey}
      template={resolved}
      error={error}
      title="Engagement Survey"
      onClose={onClose}
    />
  );
}
