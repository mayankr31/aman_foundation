// Client-side PDF exporters for fellow surveys. Imported dynamically so the
// jsPDF bundle is only loaded when the user actually exports.

import { formatDate } from "./date";
import { buildResponseSections } from "./surveyTemplates";
import ENGAGEMENT_SURVEY_TEMPLATE from "@/data/engagementSurveyTemplate";
import POST_FELLOWSHIP_SURVEY_TEMPLATE from "@/data/postFellowshipSurveyTemplate";

const SECTION_HEADER_STYLE = {
  fillColor: [226, 232, 240],
  textColor: [15, 23, 42],
  fontStyle: "bold",
  halign: "left",
};

async function loadPdf() {
  const [{ default: JsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { JsPDF, autoTable: autoTableModule.default || autoTableModule };
}

function safeFileName(value) {
  return String(value || "fellow")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function toIsoDate(value) {
  return new Date(value).toISOString().split("T")[0];
}

async function exportSurveyPdf({ survey, fellowName, template, filePrefix, documentTitle }) {
  const { JsPDF, autoTable } = await loadPdf();
  const doc = new JsPDF();
  const sections = buildResponseSections(template, survey?.responses || {});

  doc.setFontSize(16);
  doc.text(documentTitle || template?.title || "Survey", 14, 18);
  doc.setFontSize(10);
  doc.text(`Fellow: ${fellowName || "—"}`, 14, 26);
  doc.text(`Submitted on: ${formatDate(survey?.surveyDate)}`, 14, 32);

  const body = [];
  sections.forEach((section) => {
    body.push([{ content: section.title, colSpan: 2, styles: SECTION_HEADER_STYLE }]);
    section.rows.forEach((row) => {
      const label =
        Array.isArray(row.description) && row.description.length > 0
          ? `${row.label}\n${row.description.join("\n")}`
          : row.label;
      body.push([label, row.value]);
    });
  });

  if (body.length === 0) {
    body.push(["No responses were recorded for this survey.", ""]);
  }

  autoTable(doc, {
    head: [["Question", "Answer"]],
    body,
    startY: 38,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, valign: "top" },
    headStyles: { fillColor: [13, 148, 136] },
    columnStyles: { 0: { cellWidth: 95 } },
  });

  doc.save(`${filePrefix}_${safeFileName(fellowName)}_${toIsoDate(survey?.surveyDate || new Date())}.pdf`);
}

export async function exportEngagementSurveyPdf(survey, fellowName, template) {
  await exportSurveyPdf({
    survey,
    fellowName,
    template: template || ENGAGEMENT_SURVEY_TEMPLATE,
    filePrefix: "engagement_survey",
    documentTitle: "Engagement Survey",
  });
}

export async function exportPostFellowshipSurveyPdf(survey, fellowName, template) {
  await exportSurveyPdf({
    survey,
    fellowName,
    template: template || POST_FELLOWSHIP_SURVEY_TEMPLATE,
    filePrefix: "post_fellowship_survey",
    documentTitle: "Post Fellowship Survey",
  });
}
