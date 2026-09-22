import { prisma } from "@/lib/prisma";

export const PHASES = ["BASELINE", "MIDLINE", "ENDLINE"];
export const ACADEMIC_YEAR_START_MONTH = 3; // April (0-indexed). Months >= April => new session, Jan-Mar => previous session.
export const FLN_PASS_RATIO = 0.7; // 70% category marks needed to qualify at that level
export const READING_FLUENCY_KEY = "READING_FLUENCY";
export const READING_FLUENCY_TITLE = "Reading Fluency";
export const SOURCES = ["school", "afterSchool"];
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

// Resolve the level key a single form represents for a given section.
function formLevelKey(form, sectionKey, flnCategories) {
  if (sectionKey === READING_FLUENCY_KEY) {
    const flnResponses = form.flnResponses || [];
    if (!flnResponses.length) return null; // not assessed for reading fluency
    return resolveFlnLevel(flnResponses, flnCategories) || UNQUALIFIED_KEY;
  }
  const resp = (form.subjectResponses || []).find((r) => r.subjectTemplateId === sectionKey);
  return resp?.selectedOption || null;
}

// Map studentId -> level key for a set of forms (one per student per phase).
function buildLevelMap(forms, sectionKey, flnCategories) {
  const map = new Map();
  for (const form of forms) {
    const levelKey = formLevelKey(form, sectionKey, flnCategories);
    if (!levelKey) continue;
    map.set(form.studentId, levelKey);
  }
  return map;
}

// Rank function for a section: higher rank = further along the progression.
// Subjects follow SubjectAssessmentTemplate.options order (absent/unknown unranked).
// Reading fluency follows FLNCategory.order; __UNQUALIFIED sits below all categories.
function makeRankFn(sectionKey, subjectTemplates, flnCategories) {
  if (sectionKey === READING_FLUENCY_KEY) {
    const rank = {};
    [...flnCategories].sort((a, b) => a.order - b.order).forEach((c, i) => { rank[c.id] = i; });
    rank[UNQUALIFIED_KEY] = -1;
    return (key) => (key in rank ? rank[key] : null);
  }
  const template = subjectTemplates.find((t) => t.id === sectionKey);
  const rank = {};
  let r = 0;
  for (const opt of (template?.options || [])) {
    const key = String(opt || "").trim();
    if (!key || key.toLowerCase() === "absent") continue;
    rank[key] = r++;
  }
  return (key) => (key in rank ? rank[key] : null);
}

// Compare target vs reference levels for students present in both maps.
function buildComparison(targetMap, referenceMap, rankFn, referenceLabel) {
  const result = { referenceLabel, compared: 0, improved: 0, declined: 0, same: 0, transitions: [] };
  const transitions = new Map();
  for (const [studentId, targetKey] of targetMap) {
    if (!referenceMap.has(studentId)) continue;
    const fromKey = referenceMap.get(studentId);
    const targetRank = rankFn(targetKey);
    const refRank = rankFn(fromKey);
    if (targetRank === null || refRank === null) continue;
    result.compared += 1;
    if (targetRank === refRank) {
      result.same += 1;
      continue;
    }
    const direction = targetRank > refRank ? "up" : "down";
    if (direction === "up") result.improved += 1;
    else result.declined += 1;
    const tKey = `${fromKey}|${targetKey}`;
    const existing = transitions.get(tKey);
    if (existing) existing.count += 1;
    else transitions.set(tKey, { from: fromKey, to: targetKey, count: 1, direction });
  }
  result.transitions = Array.from(transitions.values()).sort((a, b) => b.count - a.count);
  return result;
}

function emptyComparison(referenceLabel = null) {
  return { referenceLabel, compared: 0, improved: 0, declined: 0, same: 0, transitions: [] };
}

export async function getFellowStudentData(fellowId, session, source = "school") {
  if (!SOURCES.includes(source)) source = "school";

  const fellow = await prisma.Fellow.findUnique({
    where: { id: fellowId },
    select: {
      students: { select: { id: true } },
      afterSchoolStudents: { select: { id: true } },
    },
  });

  if (!fellow) return null;

  const isAfterSchool = source === "afterSchool";
  const studentIds = isAfterSchool
    ? (fellow.afterSchoolStudents || []).map((s) => s.id)
    : (fellow.students || []).map((s) => s.id);

  const [subjectTemplates, flnCategories] = await Promise.all([
    prisma.SubjectAssessmentTemplate.findMany({ orderBy: { order: "asc" } }),
    prisma.FLNCategory.findMany({
      include: { questions: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const forms = studentIds.length
    ? isAfterSchool
      ? await prisma.AfterSchoolAssessmentForm.findMany({
          where: { studentId: { in: studentIds } },
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
      : await prisma.AssessmentForm.findMany({
          where: { studentId: { in: studentIds } },
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
    : [];

  const mapped = forms.map((f) => ({ ...f, source }));

  const sessions = Array.from(new Set(mapped.map((f) => deriveSession(f.date)))).sort().reverse();

  if (!session) session = currentSession();

  const notes = await prisma.FellowStudentDataNote.findMany({
    where: { fellowId, session, source },
    select: { phase: true, sectionKey: true, note: true },
  });

  const relevant = dedupeForms(mapped.filter((f) => deriveSession(f.date) === session));

  // Previous session (nearest with data) is used only as the Baseline reference.
  const previousSession = sessions.find((s) => s < session) || null;
  const previousForms = previousSession
    ? dedupeForms(mapped.filter((f) => deriveSession(f.date) === previousSession))
    : [];

  const currentByPhase = {
    BASELINE: relevant.filter((f) => f.assessmentType === "BASELINE"),
    MIDLINE: relevant.filter((f) => f.assessmentType === "MIDLINE"),
    ENDLINE: relevant.filter((f) => f.assessmentType === "ENDLINE"),
  };
  const previousEndline = previousForms.filter((f) => f.assessmentType === "ENDLINE");

  // Growth: each phase compared against its predecessor.
  // Baseline <- previous session Endline; Midline <- Baseline; Endline <- Midline.
  const comparisonFor = (sectionKey) => {
    const rankFn = makeRankFn(sectionKey, subjectTemplates, flnCategories);
    const levels = {
      BASELINE: buildLevelMap(currentByPhase.BASELINE, sectionKey, flnCategories),
      MIDLINE: buildLevelMap(currentByPhase.MIDLINE, sectionKey, flnCategories),
      ENDLINE: buildLevelMap(currentByPhase.ENDLINE, sectionKey, flnCategories),
    };
    return {
      BASELINE: previousSession
        ? buildComparison(levels.BASELINE, buildLevelMap(previousEndline, sectionKey, flnCategories), rankFn, `Endline ${previousSession}`)
        : emptyComparison(),
      MIDLINE: buildComparison(levels.MIDLINE, levels.BASELINE, rankFn, `Baseline ${session}`),
      ENDLINE: buildComparison(levels.ENDLINE, levels.MIDLINE, rankFn, `Midline ${session}`),
    };
  };

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
      comparison: comparisonFor(template.id),
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
    comparison: comparisonFor(READING_FLUENCY_KEY),
  });

  const noteMap = {};
  for (const n of notes) {
    noteMap[`${n.phase}|${n.sectionKey}`] = n.note;
  }

  return {
    session,
    source,
    sessions,
    previousSession,
    totalStudents: studentIds.length,
    phases: PHASES,
    subjectTemplates: subjectTemplates.map((t) => ({ id: t.id, name: t.name, options: t.options || [], order: t.order })),
    flnCategories: flnCategories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
    sections,
    notes: noteMap,
  };
}
