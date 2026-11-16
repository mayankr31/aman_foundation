/**
 * Scoring for the Household Resilience (KYR) tool.
 *
 * The paper form prints a percentage after each section and a final
 * scorecard with ten indicators. The form does not publish an official
 * weighting, so each indicator is the average of its questions expressed as
 * a 0-100 "resilience positive" percentage:
 *   - positively worded questions score higher for pro-resilience answers,
 *   - negatively worded questions (disaster beliefs, dependency) are inverted,
 *   - "Does not apply" style answers are ignored rather than penalised.
 *
 * Facilitators can still override every score on the final scorecard step.
 */

import { KYR_SECTIONS, KYR_SCORECARD } from "./kyrFormSchema";

function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values) {
  const clean = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function fromOption(value, map) {
  if (value === null || value === undefined) return null;
  const score = map[value];
  return score === undefined ? null : score;
}

const yesNo = (value) => fromOption(value, { Yes: 100, No: 0 });
const invertedYesNo = (value) => fromOption(value, { Yes: 0, No: 100 });
const noUnsureYes = (value) => fromOption(value, { No: 0, Unsure: 50, Yes: 100 });
const invertedNoUnsureYes = (value) => fromOption(value, { No: 100, Unsure: 50, Yes: 0 });

function gridAverage(grid, map) {
  return average(Object.values(grid || {}).map((value) => fromOption(value, map)));
}

const H3_SCORE = {
  "Yes, from formal sources": 50,
  "Yes, from informal sources": 25,
  "No, because I don't need loans": 100,
  "No, because I can't get loans (lack of documents/assets)": 25,
  "I don't know": 0,
};

const H7_SCORE = { Yes: 100, No: 0, "Not Applicable": 100 };

const I2_SCORE = { Yes: 100, No: 0, "Not Applicable": null };
const I3_SCORE = { Yes: 100, No: 0, "Not Applicable": null };

const K1_SCORE = {
  "Not Eligible": null,
  "Not aware about eligibility": 25,
  "Eligible but don't have": 50,
  "I am eligible and I have": 100,
};

function interestRateScore(value) {
  const rate = numeric(value);
  if (rate === null) return null;
  if (rate <= 0) return 100;
  if (rate >= 24) return 0;
  return Math.round(100 - (rate / 24) * 100);
}

const SECTION_SCORERS = {
  C: (r) =>
    average([
      fromOption(r.C1, {
        "Extremely dissatisfied": 0,
        "Somewhat dissatisfied": 33,
        Satisfied: 67,
        "Extremely satisfied": 100,
      }),
      fromOption(r.C3, { No: 0, "Not Sure": 50, Yes: 100 }),
      fromOption(r.C4, { Yes: 0, No: 100 }),
    ]),
  D: (r) => gridAverage(r.D1, { Yes: 100, No: 0 }),
  E: (r) => average(["E1", "E2", "E3", "E4", "E5"].map((id) => yesNo(r[id]))),
  F: (r) => average(["F1", "F2", "F3", "F4"].map((id) => invertedYesNo(r[id]))),
  G: (r) => average(["G1", "G2", "G3"].map((id) => invertedYesNo(r[id]))),
  H: (r) =>
    average([
      yesNo(r.H1),
      yesNo(r.H2),
      fromOption(r.H3, H3_SCORE),
      invertedYesNo(r.H4),
      interestRateScore(r.H6),
      fromOption(r.H7, H7_SCORE),
      yesNo(r.H8),
      yesNo(r.H9),
      yesNo(r.H10),
    ]),
  I: (r) =>
    average([
      fromOption(r.I1, {
        "Public health clinics/hospitals": 100,
        "Private health clinics/hospitals": 100,
        None: 0,
      }),
      fromOption(r.I2, I2_SCORE),
      fromOption(r.I3, I3_SCORE),
      yesNo(r.I4),
      yesNo(r.I5),
    ]),
  J: (r) => average(["J1", "J2", "J3"].map((id) => yesNo(r[id]))),
  K: (r) =>
    average([
      ...Object.values(r.K1 || {}).map((value) => fromOption(value, K1_SCORE)),
      fromOption(r.K2, { No: 0, "Not Sure": 50, Yes: 100 }),
    ]),
  L: (r) => average(["L1", "L2"].map((id) => yesNo(r[id]))),
  M: (r) =>
    average([
      noUnsureYes(r.M9),
      noUnsureYes(r.M13),
      invertedNoUnsureYes(r.M14),
      noUnsureYes(r.M15),
      noUnsureYes(r.M16),
    ]),
};

/** Section id -> label used by the inline "your score is ..." line. */
export const KYR_SECTION_SCORE_LABELS = {
  C: "Your Life Satisfaction and Agency score is",
  D: "Your score for future planning breadth is",
  E: "Your score for disaster readiness is",
  F: "Your score for disaster beliefs is",
  G: "Your score for disaster mindset (dependency) is",
  H: "Your disaster financial preparedness score is",
  I: "Your Health Resilience score is",
  J: "Your social connectedness score is",
  K: "Your Social Protection Enrollment Status and Beliefs score is",
  L: "Your disaster warning awareness score is",
  M: "Your resilience enhancement items score is",
};

function questionHasValue(question, responses) {
  const value = responses[question.id];
  switch (question.type) {
    case "checkbox":
      return Array.isArray(value) && value.length > 0;
    case "grid":
    case "gridMulti":
      return Object.values(value || {}).some((entry) =>
        Array.isArray(entry) ? entry.length > 0 : entry !== undefined && entry !== null && entry !== ""
      );
    case "composite":
    case "amountRange":
      return (question.fields || []).some((field) => {
        const fieldValue = responses[field.key];
        return fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== "";
      });
    default:
      return value !== undefined && value !== null && String(value).trim() !== "";
  }
}

/** Returns { label, value } for a section, or null if nothing was answered. */
export function getKyrSectionScore(sectionId, responses = {}) {
  const scorer = SECTION_SCORERS[sectionId];
  const label = KYR_SECTION_SCORE_LABELS[sectionId];
  if (!scorer || !label) return null;
  const section = KYR_SECTIONS.find((item) => item.id === sectionId);
  const answered = section?.questions.some((question) => questionHasValue(question, responses));
  if (!answered) return null;
  return { label, value: scorer(responses) };
}

/** Computes every score stored on a ResilienceSurvey row. */
export function computeKyrScores(responses = {}) {
  const scores = {
    lifeSatisfactionScore: SECTION_SCORERS.C(responses),
    planningScore: SECTION_SCORERS.D(responses),
    disasterReadinessScore: SECTION_SCORERS.E(responses),
    disasterBeliefsScore: SECTION_SCORERS.F(responses),
    disasterMindsetScore: SECTION_SCORERS.G(responses),
    financialResilienceScore: SECTION_SCORERS.H(responses),
    healthResilienceScore: SECTION_SCORERS.I(responses),
    socialConnectednessScore: SECTION_SCORERS.J(responses),
    socialProtectionScore: SECTION_SCORERS.K(responses),
    disasterWarningScore: SECTION_SCORERS.L(responses),
    vulnerabilityScore: SECTION_SCORERS.M(responses),
  };

  scores.overallScore = average(KYR_SCORECARD.map((item) => scores[item.key]));

  return scores;
}
