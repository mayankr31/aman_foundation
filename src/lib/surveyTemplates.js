// Shared helpers for the admin-editable fellow survey templates. These helpers
// are intentionally framework-free so they can be reused by the form renderer,
// the response viewer, the PDF exporter and the admin editor.

import ENGAGEMENT_SURVEY_TEMPLATE from "@/data/engagementSurveyTemplate";
import POST_FELLOWSHIP_SURVEY_TEMPLATE from "@/data/postFellowshipSurveyTemplate";

export const SURVEY_KEYS = ["ENGAGEMENT", "POST_FELLOWSHIP"];

export const SURVEY_META = {
  ENGAGEMENT: {
    key: "ENGAGEMENT",
    label: "Fellow Engagement Survey",
    description: "Annual survey filled by Fellows from their profile.",
    icon: "insights",
  },
  POST_FELLOWSHIP: {
    key: "POST_FELLOWSHIP",
    label: "Post Fellowship Survey (LBS)",
    description: "Look Beyond Survey filled after the Fellowship.",
    icon: "explore",
  },
};

export const QUESTION_TYPES = [
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Single choice (radio)" },
  { value: "textarea", label: "Long text" },
  { value: "scale", label: "Number scale (0-10 style)" },
  { value: "multiSelect", label: "Multi-select with optional follow-ups" },
  { value: "rank", label: "Ranked choices" },
];

const DEFAULT_TEMPLATES = {
  ENGAGEMENT: ENGAGEMENT_SURVEY_TEMPLATE,
  POST_FELLOWSHIP: POST_FELLOWSHIP_SURVEY_TEMPLATE,
};

const clone = (value) => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

export function getDefaultTemplate(key) {
  const template = DEFAULT_TEMPLATES[key];
  return template ? clone(template) : null;
}

export function isSurveyKey(key) {
  return SURVEY_KEYS.includes(String(key || "").toUpperCase());
}

export function isVerifiedAdmin(user) {
  return user?.role?.name === "ADMIN";
}

export function normalizeSurveyKey(key) {
  return String(key || "").toUpperCase();
}

export function normalizeTemplate(config, key) {
  const defaults = getDefaultTemplate(key) || {};
  const template = { ...defaults, ...(config || {}) };
  template.key = normalizeSurveyKey(key || template.key);
  template.version = template.version || 1;
  template.optionSets = Array.isArray(template.optionSets) ? template.optionSets : [];
  template.sections = Array.isArray(template.sections) ? template.sections : [];
  template.questions = Array.isArray(template.questions) ? template.questions : [];
  template.archivedQuestions = Array.isArray(template.archivedQuestions)
    ? template.archivedQuestions
    : [];
  template.title = template.title || defaults.title || "Survey";
  template.intro = template.intro || "";
  template.notice = template.notice || "";
  template.dateLabel = template.dateLabel || "Survey Date";
  return template;
}

/** Returns the ordered option list for a question (shared set or inline). */
export function getQuestionOptions(template, question) {
  if (!question) return [];
  if (Array.isArray(question.options) && question.options.length > 0) {
    return question.options;
  }
  if (question.optionSetId) {
    return template?.optionSets?.find((set) => set.id === question.optionSetId)?.options || [];
  }
  return [];
}

export function getOptionLabel(options, value) {
  if (value === null || value === undefined || value === "") return "";
  const match = (options || []).find((option) => String(option.id) === String(value));
  return match ? match.label : String(value);
}

export function getOptionSetLabel(template, question) {
  if (!question?.optionSetId) return "";
  return template?.optionSets?.find((set) => set.id === question.optionSetId)?.name || "";
}

/** Maps question id -> display number ("14", "14a", or null for hidden). */
export function getQuestionNumbers(template) {
  const numbers = {};
  let counter = 0;
  for (const question of template?.questions || []) {
    const mode = question.numberMode || "auto";
    if (mode === "fixed") {
      numbers[question.id] = String(question.fixedNumber || "");
    } else if (mode === "hidden") {
      numbers[question.id] = null;
    } else {
      counter += 1;
      numbers[question.id] = String(counter);
    }
  }
  return numbers;
}

export function formatQuestionLabel(number, label) {
  return number ? `${number}. ${label}` : label;
}

export function getQuestionLabel(template, question, responses = {}) {
  const rules = Array.isArray(question?.labelWhen) ? question.labelWhen : [];
  for (const rule of rules) {
    if (conditionMatches(rule, responses)) return rule.label;
  }
  return question?.label || "";
}

function conditionMatches(condition, responses) {
  if (!condition?.questionId) return false;
  const value = responses?.[condition.questionId];
  const thresholds = ["lt", "lte", "gt", "gte"];
  if (thresholds.some((key) => condition[key] !== undefined && condition[key] !== null)) {
    const number = Number(value);
    if (!Number.isFinite(number) || value === "" || value === null || value === undefined) {
      return false;
    }
    if (condition.lt !== undefined && !(number < Number(condition.lt))) return false;
    if (condition.lte !== undefined && !(number <= Number(condition.lte))) return false;
    if (condition.gt !== undefined && !(number > Number(condition.gt))) return false;
    if (condition.gte !== undefined && !(number >= Number(condition.gte))) return false;
    return true;
  }
  const anyOf = (condition.anyOf || []).map((item) => String(item));
  if (anyOf.length === 0) return true;
  if (Array.isArray(value)) {
    return value.some((item) => anyOf.includes(String(item)));
  }
  return anyOf.includes(String(value ?? ""));
}

/** Evaluates a question's declarative visibility rule. */
export function isQuestionVisible(question, responses = {}) {
  const conditions = question?.showIf?.all;
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every((condition) => conditionMatches(condition, responses));
}

export function multiSelectSelectedKey(question) {
  return `${question.id}_selected`;
}

export function rankSelectedKey(question) {
  return `${question.id}_ranked`;
}

export function optionRatingKey(question, option) {
  return option?.ratingKey || `${question.id}_${option?.id}`;
}

export function isAnswered(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Builds the initial response object for a template (loads default keys). */
export function buildInitialResponses(template, previous = {}) {
  const responses = { ...previous };
  for (const question of template?.questions || []) {
    if (question.type === "multiSelect") {
      const selectedKey = multiSelectSelectedKey(question);
      if (!Array.isArray(responses[selectedKey])) responses[selectedKey] = [];
      if (question.rating?.enabled) {
        for (const option of getQuestionOptions(template, question)) {
          const key = optionRatingKey(question, option);
          if (responses[key] === undefined) responses[key] = "";
        }
      }
      for (const option of getQuestionOptions(template, question)) {
        const followUp = option.followUp;
        if (!followUp?.id) continue;
        if (responses[followUp.id] === undefined) responses[followUp.id] = "";
        if (followUp.otherFieldId && responses[followUp.otherFieldId] === undefined) {
          responses[followUp.otherFieldId] = "";
        }
      }
      continue;
    }
    if (question.type === "rank") {
      const rankedKey = rankSelectedKey(question);
      if (!Array.isArray(responses[rankedKey])) responses[rankedKey] = [];
      if (question.otherFieldId && responses[question.otherFieldId] === undefined) {
        responses[question.otherFieldId] = "";
      }
      continue;
    }
    if (responses[question.id] === undefined) responses[question.id] = "";
  }
  return responses;
}

/** Returns an error map keyed by question/follow-up id. */
export function validateSurveyResponses(template, responses = {}) {
  const errors = {};

  for (const question of template?.questions || []) {
    if (!isQuestionVisible(question, responses)) continue;
    const required = question.required === true;

    if (question.type === "multiSelect") {
      const selected = responses[multiSelectSelectedKey(question)] || [];
      if (required && selected.length === 0) {
        errors[question.id] = "Please select at least one option.";
      }
      for (const option of getQuestionOptions(template, question)) {
        if (!selected.includes(option.id)) continue;
        if (question.rating?.enabled) {
          const ratingKey = optionRatingKey(question, option);
          if (!isAnswered(responses[ratingKey])) errors[ratingKey] = "Required";
        }
        const followUp = option.followUp;
        if (!followUp?.id) continue;
        if (followUp.required && !isAnswered(responses[followUp.id])) {
          errors[followUp.id] = "Required";
        }
        if (
          followUp.otherFieldId &&
          followUp.otherOptionId &&
          String(responses[followUp.id]) === String(followUp.otherOptionId) &&
          !isAnswered(responses[followUp.otherFieldId])
        ) {
          errors[followUp.otherFieldId] = "Required";
        }
      }
      continue;
    }

    if (question.type === "rank") {
      const ranked = responses[rankSelectedKey(question)] || [];
      const limit = Number(question.limit) || 3;
      if (required && ranked.length !== limit) {
        errors[question.id] =
          question.validationMessage || `Please select and rank exactly ${limit} options`;
      }
      if (
        question.otherFieldId &&
        question.otherOptionId &&
        ranked.some((item) => item.key === question.otherOptionId) &&
        !isAnswered(responses[question.otherFieldId])
      ) {
        errors[question.otherFieldId] = "Required";
      }
      continue;
    }

    if (required && !isAnswered(responses[question.id])) {
      errors[question.id] = "This field is required.";
    }
  }

  return errors;
}

/** Plain-text answer for a question, or null when unanswered. */
export function getQuestionAnswerText(template, question, responses = {}) {
  if (!question) return null;

  if (question.type === "multiSelect") {
    const selected = responses[multiSelectSelectedKey(question)] || [];
    if (selected.length === 0) return null;
    const options = getQuestionOptions(template, question);
    const parts = [];
    for (const optionId of selected) {
      const option = options.find((item) => item.id === optionId) || {
        id: optionId,
        label: String(optionId),
      };
      let text = option.label;
      if (question.rating?.enabled) {
        const ratingValue = responses[optionRatingKey(question, option)];
        if (isAnswered(ratingValue)) {
          const ratingOptions =
            template?.optionSets?.find((set) => set.id === question.rating.optionSetId)?.options ||
            [];
          text += ` — ${question.rating.label || "Rating"}: ${getOptionLabel(
            ratingOptions,
            ratingValue
          )}`;
        }
      }
      const followUp = option.followUp;
      if (followUp?.id) {
        const followUpValue = responses[followUp.id];
        if (isAnswered(followUpValue)) {
          const followUpOptions = followUp.optionSetId
            ? template?.optionSets?.find((set) => set.id === followUp.optionSetId)?.options || []
            : followUp.options || [];
          let rendered = getOptionLabel(followUpOptions, followUpValue);
          if (
            followUp.otherFieldId &&
            followUp.otherOptionId &&
            String(followUpValue) === String(followUp.otherOptionId) &&
            isAnswered(responses[followUp.otherFieldId])
          ) {
            rendered += ` - ${responses[followUp.otherFieldId]}`;
          }
          text += ` — ${followUp.label || "Details"}: ${rendered}`;
        }
      }
      parts.push(text);
    }
    return parts.length ? parts.join("; ") : null;
  }

  if (question.type === "rank") {
    const ranked = responses[rankSelectedKey(question)] || [];
    if (ranked.length === 0) return null;
    const labelMap = {};
    for (const group of question.groups || []) {
      for (const option of group.options || []) labelMap[option.id] = option.label;
    }
    const parts = ranked
      .map((item, index) => `Rank ${index + 1}: ${labelMap[item.key] || item.key}`)
      .join("; ");
    if (
      question.otherFieldId &&
      ranked.some((item) => item.key === question.otherOptionId) &&
      isAnswered(responses[question.otherFieldId])
    ) {
      return `${parts} (Other: ${responses[question.otherFieldId]})`;
    }
    return parts;
  }

  const value = responses[question.id];
  if (!isAnswered(value)) return null;

  if (question.type === "select" || question.type === "radio") {
    return getOptionLabel(getQuestionOptions(template, question), value);
  }
  return String(value);
}

/** Groups answered questions into sections for the viewer / PDF exporter. */
export function buildResponseSections(template, responses = {}) {
  if (!template) return [];
  const numbers = getQuestionNumbers(template);
  const sections = [];

  for (const section of template.sections || []) {
    const rows = [];
    for (const question of template.questions || []) {
      if (question.sectionId !== section.id) continue;
      const value = getQuestionAnswerText(template, question, responses);
      if (value === null) continue;
      rows.push({
        id: question.id,
        label: formatQuestionLabel(
          numbers[question.id],
          getQuestionLabel(template, question, responses)
        ),
        description: Array.isArray(question.descriptionList) ? question.descriptionList : null,
        value,
      });
    }
    if (rows.length) {
      sections.push({ id: section.id, title: section.label, rows });
    }
  }

  const archivedRows = [];
  for (const question of template.archivedQuestions || []) {
    const value = getQuestionAnswerText(template, question, responses);
    if (value === null) continue;
    archivedRows.push({
      id: question.id,
      label: formatQuestionLabel(
        question.archivedNumber || null,
        getQuestionLabel(template, question, responses)
      ),
      value,
    });
  }
  if (archivedRows.length) {
    sections.push({ id: "__archived", title: "Removed questions", rows: archivedRows });
  }

  return sections;
}

/** Validates a template before it is persisted from the admin editor. */
export function validateSurveyTemplate(config) {
  if (!config || typeof config !== "object") {
    return { ok: false, error: "Invalid survey template." };
  }
  if (!isAnswered(config.title)) {
    return { ok: false, error: "Survey title is required." };
  }
  if (!Array.isArray(config.sections) || config.sections.length === 0) {
    return { ok: false, error: "Add at least one section." };
  }
  if (!Array.isArray(config.questions)) {
    return { ok: false, error: "Questions must be a list." };
  }

  const optionSetIds = new Set();
  for (const set of config.optionSets || []) {
    if (!set?.id) return { ok: false, error: "Every option set needs an id." };
    if (optionSetIds.has(set.id)) {
      return { ok: false, error: `Duplicate option set id: ${set.id}` };
    }
    optionSetIds.add(set.id);
    if (!Array.isArray(set.options) || set.options.length === 0) {
      return { ok: false, error: `Option set "${set.name || set.id}" needs at least one option.` };
    }
    const optionIds = new Set();
    for (const option of set.options) {
      if (!option?.id || !isAnswered(option.label)) {
        return { ok: false, error: `Option set "${set.name || set.id}" has an empty option.` };
      }
      if (optionIds.has(option.id)) {
        return { ok: false, error: `Option set "${set.name || set.id}" has duplicate options.` };
      }
      optionIds.add(option.id);
    }
  }

  const sectionIds = new Set();
  for (const section of config.sections) {
    if (!section?.id || !isAnswered(section.label)) {
      return { ok: false, error: "Every section needs an id and a title." };
    }
    if (sectionIds.has(section.id)) {
      return { ok: false, error: `Duplicate section id: ${section.id}` };
    }
    sectionIds.add(section.id);
  }

  const questionIds = new Set();
  for (const question of config.questions) {
    if (!question?.id) return { ok: false, error: "Every question needs an id." };
    if (questionIds.has(question.id)) {
      return { ok: false, error: `Duplicate question id: ${question.id}` };
    }
    questionIds.add(question.id);
  }

  for (const question of config.questions) {
    if (!isAnswered(question.label) && !(question.labelWhen || []).length) {
      return { ok: false, error: `Question "${question.id}" needs a label.` };
    }
    if (!sectionIds.has(question.sectionId)) {
      return { ok: false, error: `Question "${question.label || question.id}" is not in a valid section.` };
    }
    const type = question.type || "select";
    if (!QUESTION_TYPES.some((item) => item.value === type)) {
      return { ok: false, error: `Question "${question.id}" has an unsupported type.` };
    }
    if (type === "select" || type === "radio") {
      const options = getQuestionOptions(config, question);
      if (options.length === 0) {
        return { ok: false, error: `Question "${question.label || question.id}" needs options.` };
      }
    }
    if (type === "multiSelect") {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        return { ok: false, error: `Question "${question.label || question.id}" needs options.` };
      }
      if (question.rating?.enabled && !optionSetIds.has(question.rating.optionSetId)) {
        return {
          ok: false,
          error: `Question "${question.label || question.id}" needs a valid rating option set.`,
        };
      }
    }
    if (type === "rank") {
      const hasOptions = (question.groups || []).some((group) => (group.options || []).length);
      if (!hasOptions) {
        return {
          ok: false,
          error: `Question "${question.label || question.id}" needs at least one pathway option.`,
        };
      }
    }
    if (type === "scale") {
      const min = Number(question.min);
      const max = Number(question.max);
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        return {
          ok: false,
          error: `Question "${question.label || question.id}" has an invalid scale range.`,
        };
      }
    }
    for (const condition of question.showIf?.all || []) {
      if (!condition.questionId || !questionIds.has(condition.questionId)) {
        return {
          ok: false,
          error: `Question "${question.label || question.id}" has a condition pointing to a missing question.`,
        };
      }
    }
    for (const rule of question.labelWhen || []) {
      if (!rule.questionId || !questionIds.has(rule.questionId)) {
        return {
          ok: false,
          error: `Question "${question.label || question.id}" has a label condition pointing to a missing question.`,
        };
      }
    }
  }

  return { ok: true };
}
