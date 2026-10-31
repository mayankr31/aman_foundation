/**
 * Maps the KYR form payload ({ responses, scores }) to the fields expected by
 * the ResilienceSurvey model. Returns null when no responses were provided.
 */
export function buildResilienceSurveyCreateData(payload) {
  if (!payload?.responses) return null;
  const scores = payload.scores || {};

  return {
    responses: payload.responses,
    lifeSatisfactionScore: scores.lifeSatisfactionScore || 0,
    planningScore: scores.planningScore || 0,
    disasterReadinessScore: scores.disasterReadinessScore || 0,
    disasterBeliefsScore: scores.disasterBeliefsScore || 0,
    disasterMindsetScore: scores.disasterMindsetScore || 0,
    financialResilienceScore: scores.financialResilienceScore || 0,
    healthResilienceScore: scores.healthResilienceScore || 0,
    socialConnectednessScore: scores.socialConnectednessScore || 0,
    socialProtectionScore: scores.socialProtectionScore || 0,
    disasterWarningScore: scores.disasterWarningScore || 0,
    vulnerabilityScore: scores.vulnerabilityScore || 0,
    overallScore: scores.overallScore || 0,
  };
}
