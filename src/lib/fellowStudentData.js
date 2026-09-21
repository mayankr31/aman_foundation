import { prisma } from "@/lib/prisma";

export const PHASES = ["BASELINE", "MIDLINE", "ENDLINE"];
export const ACADEMIC_YEAR_START_MONTH = 3; // April (0-indexed). Months >= April => new session, Jan-Mar => previous session.
export const FLN_PASS_RATIO = 0.7; // 70% category marks needed to qualify at that level
export const READING_FLUENCY_KEY = "READING_FLUENCY";
export const READING_FLUENCY_TITLE = "Reading Fluency";
const UNQUALIFIED_KEY = "__UNQUALIFIED";

export function deriveSession(dateOrString) {
  const d = new Date(dateOrString);
  const startYear = d.getMonth() >= ACADEMIC_YEAR_START_MONTH ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

export function currentSession() {
  return deriveSession(new Date());
}

function emptyPhases() {
  return { BASELINE: { counts: {}, assessed: 0 }, MIDLINE: { counts: {}, assessed: 0 }, ENDLINE: { counts: {}, assessed: 0 } };
}

function phaseMap(assessmentType) {
  return {
    BASELINE: "BASELINE",
    MIDLINE: "MIDLINE",
    ENDLINE: "ENDLINE",
  }[assessmentType];
}

// Pick the most recent form per (source, studentId, assessmentType).
function dedupeForms(forms) {
  const best = new Map();
  for (const form of forms) {
    const key = `${form.source}|${form.studentId}|${form.assessmentType}`;
    const existing = best.get(key);
    if (!existing || new Date(form.date) > new Date(existing.date)) {
      best.set(key, form);
    }
  }
  return Array.from(best.values());
}

// For a student form decide the highest FLN category they qualify in.
// A category qualifies when scored >= 70% of that category's total marks.
// Hierarchy follows FLNCategory.order (Emergent -> Beginner -> Intermediate -> Advanced).
function resolveFlnLevel(flnResponses, categoryConfig) {
  const perCategoryScore = {};
  for (const resp of flnResponses || []) {
    const cat = resp.flnQuestion?.category;
    if (!cat) continue;
    perCategoryScore[cat.id] = (perCategoryScore[cat.id] || 0) + (resp.score || 0);
  }
  let level = null;
  const sorted = [...categoryConfig].sort((a, b) => a.order - b.order);
  for (const cat of sorted) {
    const catMax = (cat.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0);
    if (catMax <= 0) continue;
    const scored = perCategoryScore[cat.id] || 0;
    if (scored / catMax >= FLN_PASS_RATIO) {
      level = cat.id;
    }
  }
  return level;
}

export async function getFellowStudentData(fellowId, session) {
  const fellow = await prisma.Fellow.findUnique({
    where: { id: fellowId },
    select: {
      students: { select: { id: true } },
      afterSchoolStudents: { select: { id: true } },
    },
  });

  if (!fellow) return null;

  const schoolIds = (fellow.students || []).map((s) => s.id);
  const afterSchoolIds = (fellow.afterSchoolStudents || []).map((s) => s.id);

  const [subjectTemplates, flnCategories] = await Promise.all([
    prisma.SubjectAssessmentTemplate.findMany({ orderBy: { order: "asc" } }),
    prisma.FLNCategory.findMany({
      include: { questions: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const [schoolForms, afterSchoolForms] = await Promise.all([
    schoolIds.length
      ? prisma.AssessmentForm.findMany({
          where: { studentId: { in: schoolIds } },
          orderBy: { date: "asc" },
          include: {
            subjectResponses: { select: { subjectTemplateId: true, selectedOption: true } },
            flnResponses: {
              select: {
                score: true,
                flnQuestion: { select: { id: true, categoryId: true, category: { select: { id: true, order: true } } } },
              },
            },
          },
        })
      : Promise.resolve([]),
    afterSchoolIds.length
      ? prisma.AfterSchoolAssessmentForm.findMany({
          where: { studentId: { in: afterSchoolIds } },
          orderBy: { date: "asc" },
          include: {
            subjectResponses: { select: { subjectTemplateId: true, selectedOption: true } },
            flnResponses: {
              select: {
                score: true,
                flnQuestion: { select: { id: true, categoryId: true, category: { select: { id: true, order: true } } } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const mapped = [
    ...schoolForms.map((f) => ({ ...f, source: "school" })),
    ...afterSchoolForms.map((f) => ({ ...f, source: "afterSchool" })),
  ];

  const sessions = Array.from(new Set(mapped.map((f) => deriveSession(f.date)))).sort().reverse();

  if (!session) session = currentSession();

  const notes = await prisma.FellowStudentDataNote.findMany({
    where: { fellowId, session },
    select: { phase: true, sectionKey: true, note: true },
  });

  const relevant = dedupeForms(mapped.filter((f) => deriveSession(f.date) === session));

  // ── Subject sections ──
  const sections = subjectTemplates.map((template) => {
    const phases = emptyPhases();
    for (const form of relevant) {
      const phase = phaseMap(form.assessmentType);
      if (!phase) continue;
      phases[phase].assessed += 1;
      const resp = (form.subjectResponses || []).find((r) => r.subjectTemplateId === template.id);
      if (!resp || !resp.selectedOption) continue;
      phases[phase].counts[resp.selectedOption] = (phases[phase].counts[resp.selectedOption] || 0) + 1;
    }
    return {
      kind: "SUBJECT",
      key: template.id,
      title: template.name,
      order: template.order,
      phases,
    };
  });

  // ── Reading fluency section ──
  const fluencyPhases = emptyPhases();
  for (const form of relevant) {
    const phase = phaseMap(form.assessmentType);
    if (!phase) continue;
    const flnResponses = form.flnResponses || [];
    if (!flnResponses.length) continue; // not assessed for reading fluency in this round
    fluencyPhases[phase].assessed += 1;
    const level = resolveFlnLevel(flnResponses, flnCategories);
    if (level) {
      fluencyPhases[phase].counts[level] = (fluencyPhases[phase].counts[level] || 0) + 1;
    } else {
      fluencyPhases[phase].counts[UNQUALIFIED_KEY] = (fluencyPhases[phase].counts[UNQUALIFIED_KEY] || 0) + 1;
    }
  }
  sections.push({
    kind: "READING_FLUENCY",
    key: READING_FLUENCY_KEY,
    title: READING_FLUENCY_TITLE,
    order: subjectTemplates.length + 1,
    phases: fluencyPhases,
  });

  const noteMap = {};
  for (const n of notes) {
    noteMap[`${n.phase}|${n.sectionKey}`] = n.note;
  }

  return {
    session,
    sessions,
    totalStudents: schoolIds.length + afterSchoolIds.length,
    phases: PHASES,
    subjectTemplates: subjectTemplates.map((t) => ({ id: t.id, name: t.name, options: t.options || [], order: t.order })),
    flnCategories: flnCategories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
    sections,
    notes: noteMap,
  };
}
