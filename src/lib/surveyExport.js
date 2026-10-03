// Client-side PDF exporters for fellow surveys. Imported dynamically so the
// jsPDF bundle is only loaded when the user actually exports.

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

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function hasValue(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

// ─── Engagement Survey ─────────────────────────────────────────────────────────

const ENGAGEMENT_QUESTION_LABELS = [
  { key: "q1", label: "1. I identify as" },
  { key: "q2", label: "2. I share the background (economic, racial, ethnic, religious, etc.) of the most disadvantaged groups in India" },
  { key: "q3", label: "3. I have a growing understanding of why all children in Assam today do not attain a quality education and livelihood opportunities" },
  { key: "q4", label: "4. I believe it is possible for all children in Assam to attain quality education" },
  { key: "q5", label: "5. My journey at Aman Foundation so far has been a good investment in my personal and professional development." },
  { key: "q6", label: "6. I feel supported by the Aman Foundation Staff" },
  { key: "q7", label: "7. I feel comfortable in approaching my Program Manager and Senior Leadership Team" },
  { key: "q8", label: "8. I feel part of a community, where peers help each other drive impact collectively" },
  { key: "q9", label: "9. I find purpose and meaning in the work I do" },
  { key: "q10", label: "10. I am proud to be a part of Aman Foundation" },
  { key: "q11", label: "11. I plan to stay in touch with the Aman Foundation Alumni community after my Fellowship" },
  { key: "q12", label: "12. There are repercussions when a Fellow/Staff performs poorly or acts against our core values" },
  { key: "q13", label: "13. I know what is expected of me in my role" },
  { key: "q14", label: "14. My day-to-day experiences match the expectations that were set when I went through the recruitment and selection process" },
  { key: "q14Reason", label: "14a. What would you have liked to know about the Fellowship experience before starting the Fellowship?" },
  { key: "q15", label: "15. My organization provides me with the resources and support I need to manage my well-being" },
  { key: "q16", label: "16. I feel equipped to build relationships with school & Community stakeholders and deal with challenges at school & Community level" },
  { key: "q17", label: "17. Aman Foundation creates an inclusive environment for me" },
  { key: "q18", label: "18. My feedback is welcomed and valued" },
  { key: "q19", label: "19. People who perform well are recognized for it" },
  { key: "q20", label: "20. My PM/Manager" },
  { key: "q21", label: "21. Since the beginning of the academic year, my PM/Manager has observed my class and shared feedback through technical notes/conversations at the following frequency" },
  { key: "q22_selected", label: "22. Since the start of the year, which of the following learning and development spaces have you accessed?" },
  { key: "q23", label: "23. Based on all the learning and development opportunities, what aspects have you found helpful or what could be strengthened?" },
  { key: "q24", label: "24. On a scale of 0-10, how likely is it that you would recommend the Fellowship to any qualified individual you know?" },
  { key: "q24Reason", label: "24a. Reason for rating" },
  { key: "q25", label: "25. Top two aspects of the Fellowship program that you like the most" },
  { key: "q26", label: "26. Top 2 areas that Aman Foundation can focus on to enhance your experience with the Fellowship program" },
];

const ENGAGEMENT_Q22_ITEMS = {
  a: { bold: "Institute", text: " prepared me with the adequate foundational skills to begin teaching" },
  b: { bold: "Technical trainings", text: " help me upskill and develop as a teacher" },
  c: { bold: "Learning Circle (or Community Circle for TTF)", text: " is a safe and effective space to connect and build relationships, problem solve, share best practices and reflect on progress" },
};

const ENGAGEMENT_Q22_KEYS = ["q22a", "q22b", "q22c"];

const ENGAGEMENT_SECTIONS = [
  { title: "Demographics", keys: ["q1", "q2"] },
  { title: "Section 1 - Belief Questions", keys: ["q3", "q4"] },
  { title: "Section 2.1 - Culture", keys: ["q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"] },
  { title: "Section 2.2 - Expectations, Well-being and Progress", keys: ["q13", "q14", "q14Reason", "q15", "q16", "q17", "q18", "q19"] },
  { title: "Section 3 - Support", keys: ["q20", "q21"] },
  { title: "Section 4 - Quality of L&D Spaces", keys: ["q22_selected", "q23"] },
  { title: "Section 5 - Overall Feedback", keys: ["q24", "q24Reason", "q25", "q26"] },
];

function shouldShow(key, value) {
  if (!value && value !== 0) return false;
  if (key === "q22_selected" && Array.isArray(value) && value.length === 0) return false;
  return true;
}

function engagementAnswer(key, value, responses) {
  if (key === "q22_selected") {
    const answered = ENGAGEMENT_Q22_KEYS.filter((k) => responses[k]);
    return answered
      .map((k) => {
        const item = ENGAGEMENT_Q22_ITEMS[k.slice(-1)];
        return item ? `${item.bold}${item.text} — ${responses[k]}` : `${k}: ${responses[k]}`;
      })
      .join("; ");
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "");
}

export async function exportEngagementSurveyPdf(survey, fellowName) {
  const { JsPDF, autoTable } = await loadPdf();
  const doc = new JsPDF();
  const responses = survey?.responses || {};
  const labelMap = {};
  ENGAGEMENT_QUESTION_LABELS.forEach((q) => {
    labelMap[q.key] = q.label;
  });

  doc.setFontSize(16);
  doc.text("Engagement Survey", 14, 18);
  doc.setFontSize(10);
  doc.text(`Fellow: ${fellowName || "—"}`, 14, 26);
  doc.text(`Submitted on: ${formatDate(survey.surveyDate)}`, 14, 32);

  const body = [];
  ENGAGEMENT_SECTIONS.forEach((section) => {
    const visibleKeys = section.keys.filter((key) => shouldShow(key, responses[key]));
    if (visibleKeys.length === 0) return;
    body.push([{ content: section.title, colSpan: 2, styles: SECTION_HEADER_STYLE }]);
    section.keys.forEach((key) => {
      const value = responses[key];
      if (!shouldShow(key, value)) return;
      body.push([labelMap[key] || key, engagementAnswer(key, value, responses)]);
    });
  });

  autoTable(doc, {
    head: [["Question", "Answer"]],
    body,
    startY: 38,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, valign: "top" },
    headStyles: { fillColor: [13, 148, 136] },
    columnStyles: { 0: { cellWidth: 95 } },
  });

  doc.save(`engagement_survey_${safeFileName(fellowName)}_${toIsoDate(survey.surveyDate)}.pdf`);
}

// ─── Look Beyond Survey ────────────────────────────────────────────────────────

const Q1_LABELS = {
  a: "I would like to study",
  b: "I will be preparing for competitive exams",
  c: "I would like to work",
  d: "I will be starting my own organization",
  e: "I am on sabbatical and will return to my employer",
  f: "I have decided to take a break",
  g: "I am unsure",
};

const Q8_LABELS = {
  pathway_exposure: "Pathway Exposure Series",
  theory_of_change: "Personal Theory of Change workshop",
  org_immersions: "Org Immersions",
  one_on_one: "1-on-1 Conversations with City Staff",
  microsite: "Post-Fellowship Support Microsite",
  depth_tracks: "Depth Tracks",
  internship: "Internship/ Apprenticeship",
};

const PATHWAY_GROUP_LABELS = {
  ts_teaching: "Transformational Schools - a. Teaching",
  ts_school_leadership: "Transformational Schools - b. School Leadership",
  ts_school_entrepreneurship: "Transformational Schools - c. School Entrepreneurship",
  ts_after_school: "Transformational Schools - d. After School Programs and Community Centers",
  en_service_people: "Enablers - a. Service Provider (People)",
  en_service_product: "Enablers - b. Service Provider (Product)",
  en_intermediary: "Enablers - c. Intermediary",
  en_funding: "Enablers - d. Funding",
  pg_consulting: "Policy and governance - a. Governance Consulting",
  pg_fellowships: "Policy and governance - b. Government Fellowships",
  pg_bureaucracy: "Policy and governance - c. Bureaucracy",
  pg_politics: "Policy and governance - d. Politics",
  op_edu_sector: "Other Pathways - a. Working in the education sector, but not specifically focused on children from low-income communities",
  op_dev_ecosystem: "Other Pathways - b. Working in the larger development ecosystem, but not focused on the education system",
  op_not_impacting: "Other Pathways - c. Working in roles not impacting educational outcomes or children from low-income backgrounds directly/ indirectly",
  op_other: "Other Pathways - d. Other",
  u_unsure: "Unsure",
};

function buildLookBeyondSections(responses) {
  const sections = [];

  // Section 1: Post-Fellowship Plans
  const section1 = [];
  if (hasValue(responses.q1)) {
    section1.push([
      "1. Which statement best describes your current thinking around your plans right after the Fellowship?",
      Q1_LABELS[responses.q1] || responses.q1,
    ]);
    if (responses.q1 === "a") {
      if (hasValue(responses.q1_study_course)) section1.push(["What course(s) are you aspiring to get into?", responses.q1_study_course]);
      if (hasValue(responses.q1_study_other)) section1.push(["Other (specified)", responses.q1_study_other]);
    }
    if (responses.q1 === "b") {
      if (hasValue(responses.q1_exam_course)) section1.push(["What course(s) are you aspiring to get into?", responses.q1_exam_course]);
      if (hasValue(responses.q1_exam_other)) section1.push(["Others (specified)", responses.q1_exam_other]);
    }
    if (responses.q1 === "f") {
      if (hasValue(responses.q1_break_plan)) section1.push(["What do you plan on doing during your break?", responses.q1_break_plan]);
      if (hasValue(responses.q1_break_other)) section1.push(["Other (specified)", responses.q1_break_other]);
    }
    if (responses.q1 === "g" && hasValue(responses.q1_unsure_reason)) {
      section1.push(["What is making you unsure?", responses.q1_unsure_reason]);
    }
  }
  if (section1.length) sections.push({ title: "Section 1: Post-Fellowship Plans", rows: section1 });

  // Section 2: Puzzle Piece Alignment
  const section2 = [];
  const push2 = (q, v) => {
    if (hasValue(v)) section2.push([q, v]);
  };
  push2("2. Evolving idea of role as Alum towards educational equity", responses.q2);
  push2("3. Fellowship experience is helping grow capabilities for personal and professional development", responses.q3);
  push2("4. Familiar with TFI's 3 prioritized puzzle pieces", responses.q4);
  push2("5. Aware of types of roles and organizations within 3 puzzle pieces", responses.q5);
  push2("6. Aware of how strengths align with opportunities within 3 puzzle pieces", responses.q6);

  const ranked = responses.q7_ranked || [];
  if (ranked.length > 0) {
    const isAfter = responses.q1 === "c" || responses.q1 === "d" || responses.q1 === "e";
    const q7 = isAfter
      ? "7. What are the top 3 pathways you envision yourself working in right after the Fellowship?"
      : "7. What are the top 3 pathways you envision yourself working in when you seek a work opportunity in the future?";
    let answer = ranked
      .map((item, idx) => `Rank ${idx + 1}: ${PATHWAY_GROUP_LABELS[item.key] || item.key}`)
      .join("; ");
    if (ranked.some((r) => r.key === "op_other") && responses.q7_other_text) {
      answer += ` (Other: ${responses.q7_other_text})`;
    }
    section2.push([q7, answer]);
  }
  if (section2.length) sections.push({ title: "Section 2: Puzzle Piece Alignment", rows: section2 });

  // Section 3: Support and Opportunities
  const section3 = [];
  const selected = responses.q8_selected || [];
  selected.forEach((key) => {
    let answer = Q8_LABELS[key] || key;
    const rating = responses[`q8_${key}`];
    if (rating) answer += ` — Rating: ${rating}`;
    if (key === "depth_tracks" && responses.q8_depth_track_choice) {
      answer += ` — Track: ${responses.q8_depth_track_choice}${
        responses.q8_depth_track_choice === "Others" && responses.q8_depth_track_other
          ? ` - ${responses.q8_depth_track_other}`
          : ""
      }`;
    }
    if (key === "internship" && responses.q8_internship_org) {
      answer += ` — Organisation: ${responses.q8_internship_org}`;
    }
    section3.push(["8. Which opportunities created by Teach For India have you accessed?", answer]);
  });

  if (hasValue(responses.q9_btcp)) {
    section3.push(["9. Have you done a Be The Change Project (BTCP)?", responses.q9_btcp === "yes" ? "Yes" : "No"]);
    if (responses.q9_btcp === "yes") {
      if (hasValue(responses.q9_btcp_stage)) section3.push(["BTCP Stage", responses.q9_btcp_stage]);
      if (hasValue(responses.q9_btcp_rating)) section3.push(["BTCP Experience", responses.q9_btcp_rating]);
    }
    if (responses.q9_btcp === "no" && hasValue(responses.q9_btcp_reason)) {
      section3.push(["Reason for not doing BTCP", responses.q9_btcp_reason]);
    }
  }
  if (hasValue(responses.q10)) section3.push(["10. Other opportunities accessed", responses.q10]);
  if (hasValue(responses.q11)) section3.push(["11. Post-Fellowship support is high quality and suited to my needs", responses.q11]);
  if (hasValue(responses.q12)) section3.push(["12. Recommendations to strengthen support", responses.q12]);
  if (section3.length) sections.push({ title: "Section 3: Support and Opportunities", rows: section3 });

  return sections;
}

export async function exportLookBeyondSurveyPdf(survey, fellowName) {
  const { JsPDF, autoTable } = await loadPdf();
  const doc = new JsPDF();
  const responses = survey?.responses || {};

  doc.setFontSize(16);
  doc.text("Look Beyond Survey", 14, 18);
  doc.setFontSize(10);
  doc.text(`Fellow: ${fellowName || "—"}`, 14, 26);
  doc.text(`Submitted on: ${formatDate(survey.surveyDate)}`, 14, 32);

  const body = [];
  buildLookBeyondSections(responses).forEach((section) => {
    body.push([{ content: section.title, colSpan: 2, styles: SECTION_HEADER_STYLE }]);
    section.rows.forEach((row) => body.push(row));
  });

  autoTable(doc, {
    head: [["Question", "Answer"]],
    body,
    startY: 38,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, valign: "top" },
    headStyles: { fillColor: [13, 148, 136] },
    columnStyles: { 0: { cellWidth: 95 } },
  });

  doc.save(`look_beyond_survey_${safeFileName(fellowName)}_${toIsoDate(survey.surveyDate)}.pdf`);
}
