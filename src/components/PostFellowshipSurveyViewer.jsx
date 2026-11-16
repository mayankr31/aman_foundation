"use client";

import SurveyResponseView from "@/components/surveys/SurveyResponseView";
import { useSurveyTemplate } from "@/lib/useSurveyTemplate";

export default function PostFellowshipSurveyViewer({ survey, onClose, template: providedTemplate }) {
  const { template, error } = useSurveyTemplate("POST_FELLOWSHIP");
  const resolved = providedTemplate || template;

  return (
    <SurveyResponseView
      survey={survey}
      template={resolved}
      error={error}
      title="Post Fellowship Survey"
      onClose={onClose}
    />
  );
}
