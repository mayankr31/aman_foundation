"use client";

import { KYR_SECTIONS, KYR_SCORECARD } from "@/lib/kyrFormSchema";
import { computeKyrScores } from "@/lib/kyrSurveyScores";
import { formatDate } from "@/lib/date";

const EMPTY = "Not answered";

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return String(value).trim() === "";
}

function primitive(value) {
  if (isEmpty(value)) return EMPTY;
  return String(value);
}

function questionHasAnswer(question, responses) {
  const value = responses[question.id];
  if (question.type === "checkbox") return Array.isArray(value) && value.length > 0;
  if (question.type === "grid" || question.type === "gridMulti") {
    return Object.values(value || {}).some((entry) =>
      Array.isArray(entry) ? entry.length > 0 : !isEmpty(entry)
    );
  }
  if (question.type === "composite" || question.type === "amountRange") {
    return (question.fields || []).some((field) => !isEmpty(responses[field.key]));
  }
  return !isEmpty(value);
}

function AnswerBlock({ question, responses }) {
  const value = responses[question.id];

  if (question.type === "composite" || question.type === "amountRange") {
    return (
      <ul className="space-y-1.5 w-full">
        {question.fields.map((field) => {
          const fieldValue = responses[field.key];
          const display =
            field.type === "date" && !isEmpty(fieldValue)
              ? formatDate(fieldValue, String(fieldValue))
              : primitive(fieldValue);
          return (
            <li
              key={field.key}
              className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 border-b border-surface-container-highest last:border-0 pb-1.5 last:pb-0"
            >
              <span className="font-bold text-on-surface text-xs min-w-[120px]">
                {field.label}:
              </span>
              <span className="text-on-surface-variant break-words min-w-0">{display}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (question.type === "grid") {
    const entries = Object.entries(value || {}).filter(([, answer]) => !isEmpty(answer));
    if (!entries.length) return <span>{EMPTY}</span>;
    return (
      <ul className="space-y-1.5 w-full">
        {entries.map(([row, answer]) => (
          <li
            key={row}
            className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 border-b border-surface-container-highest last:border-0 pb-1.5 last:pb-0"
          >
            <span className="font-bold text-on-surface text-xs min-w-[120px]">{row}:</span>
            <span className="text-on-surface-variant break-words min-w-0">{answer}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (question.type === "gridMulti") {
    const entries = Object.entries(value || {}).filter(
      ([, answers]) => Array.isArray(answers) && answers.length > 0
    );
    if (!entries.length) return <span>{EMPTY}</span>;
    return (
      <ul className="space-y-1.5 w-full">
        {entries.map(([row, answers]) => (
          <li
            key={row}
            className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 border-b border-surface-container-highest last:border-0 pb-1.5 last:pb-0"
          >
            <span className="font-bold text-on-surface text-xs min-w-[120px]">{row}:</span>
            <span className="text-on-surface-variant break-words min-w-0">
              {answers.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (question.type === "checkbox") {
    if (!Array.isArray(value) || value.length === 0) return <span>{EMPTY}</span>;
    let text = value.join(", ");
    if (question.otherField && value.includes(question.otherOption)) {
      const other = responses[question.otherField];
      if (!isEmpty(other)) text = `${text} (${other})`;
    }
    return <span>{text}</span>;
  }

  if (question.type === "radio" && question.otherField && value === question.otherOption) {
    const other = responses[question.otherField];
    if (!isEmpty(other)) return <span>{`${value} (${other})`}</span>;
  }

  return <span>{primitive(value)}</span>;
}

export default function KyrReadOnlyView({ responses, survey }) {
  if (!responses) return <div>No responses recorded.</div>;

  const computedScores = computeKyrScores(responses);
  const scores = KYR_SCORECARD.map((item) => ({
    ...item,
    value:
      survey && survey[item.key] !== undefined && survey[item.key] !== null
        ? survey[item.key]
        : computedScores[item.key],
  }));
  const overall =
    survey && survey.overallScore !== undefined && survey.overallScore !== null
      ? survey.overallScore
      : computedScores.overallScore;

  return (
    <div className="font-sans space-y-10">
      {KYR_SECTIONS.map((section) => {
        const hasAnyAnswer = section.questions.some((question) =>
          questionHasAnswer(question, responses)
        );
        if (!hasAnyAnswer) return null;

        return (
          <div key={section.id} className="space-y-4">
            <h3 className="text-xl font-bold font-headline border-b border-surface-container-highest pb-2">
              Section {section.id} - {section.title}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {section.questions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 bg-surface-container-lowest rounded-lg border border-surface-container-highest flex flex-col justify-between"
                >
                  <p className="text-sm font-semibold text-on-surface mb-3 leading-relaxed">
                    {question.displayId || question.id}. {question.text}
                  </p>
                  <div className="bg-surface-container-low p-3 rounded text-sm text-on-surface-variant font-medium mt-auto">
                    <AnswerBlock question={question} responses={responses} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="space-y-3">
        <h3 className="text-xl font-bold font-headline border-b border-surface-container-highest pb-2">
          Your Family&apos;s Resilience Scorecard
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[420px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-on-surface-variant border-b border-surface-container-highest">
                <th className="p-2">Sn</th>
                <th className="p-2">Indicator</th>
                <th className="p-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((item, index) => (
                <tr key={item.key} className="border-b border-surface-container-high last:border-0">
                  <td className="p-2 text-on-surface-variant">{index + 1}</td>
                  <td className="p-2 font-semibold text-on-surface">{item.label}</td>
                  <td className="p-2 text-right font-bold text-primary">{Number(item.value) || 0}%</td>
                </tr>
              ))}
              <tr className="bg-surface-container-low">
                <td className="p-2" />
                <td className="p-2 font-bold text-on-surface">Overall Resilience Score</td>
                <td className="p-2 text-right text-lg font-bold text-primary">
                  {Number(overall) || 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
