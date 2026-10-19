import { prisma } from "@/lib/prisma";
import { sortSubjectOptions, deriveSession, currentSession, ACADEMIC_YEAR_START_MONTH } from "@/data/assessmentOptions";

export { deriveSession, currentSession, ACADEMIC_YEAR_START_MONTH };

export const PHASES = ["BASELINE", "MIDLINE", "ENDLINE"];
export const FLN_PASS_RATIO = 0.7; // 70% category marks needed to qualify at that level
export const READING_FLUENCY_KEY = "READING_FLUENCY";
export const READING_FLUENCY_TITLE = "Reading Fluency";
export const SOURCES = ["school", "afterSchool"];
export const INSTITUTION_SCOPES = ["school", "afterSchoolCentre"];
const UNQUALIFIED_KEY = "__UNQUALIFIED";

function emptyPhases() {
  return {
    BASELINE: { counts: {}, assessed: 0, byFellow: {} },
    MIDLINE: { counts: {}, assessed: 0, byFellow: {} },
    ENDLINE: { counts: {}, assessed: 0, byFellow: {} },
  };
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
  for (const opt of sortSubjectOptions(template?.options || [])) {
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

const STUDENT_SELECT = {
  id: true,
  name: true,
  gender: true,
  dob: true,
  grade: true,
  fellow: { select: { id: true, name: true } },
};

function fellowForStudent(student) {
  if (student?.fellow?.id) {
    return { id: student.fellow.id, name: student.fellow.name };
  }
  return { id: "__unassigned", name: "Unassigned" };
}

// Load the students belonging to a fellow, school, or after-school centre.
async function loadScope(scopeType, scopeId, source) {
  if (scopeType === "school") {
    const school = await prisma.School.findUnique({
      where: { id: scopeId },
      select: { name: true, students: { select: STUDENT_SELECT } },
    });
    return school ? { name: school.name, students: school.students } : null;
  }

  if (scopeType === "afterSchoolCentre") {
    const centre = await prisma.AfterSchoolCentre.findUnique({
      where: { id: scopeId },
      select: { name: true, students: { select: STUDENT_SELECT } },
    });
    return centre ? { name: centre.name, students: centre.students } : null;
  }

  const fellow = await prisma.Fellow.findUnique({
    where: { id: scopeId },
    select: {
      name: true,
      students: { select: STUDENT_SELECT },
      afterSchoolStudents: { select: STUDENT_SELECT },
    },
  });

  if (!fellow) return null;

  return {
    name: fellow.name,
    students: source === "afterSchool" ? fellow.afterSchoolStudents : fellow.students,
  };
}

async function loadNotes(scopeType, scopeId, session, source) {
  if (scopeType === "fellow") {
    return prisma.FellowStudentDataNote.findMany({
      where: { fellowId: scopeId, session, source },
      select: { phase: true, sectionKey: true, note: true },
    });
  }

  return prisma.InstitutionStudentDataNote.findMany({
    where: { scopeType, scopeId, session, source },
    select: { phase: true, sectionKey: true, note: true },
  });
}

// Increment the overall phase bucket and the matching fellow bucket.
function bumpPhase(phaseData, fellow, levelKey) {
  phaseData.assessed += 1;

  if (!fellow) return;

  if (!phaseData.byFellow[fellow.id]) {
    phaseData.byFellow[fellow.id] = { counts: {}, assessed: 0 };
  }
  const bucket = phaseData.byFellow[fellow.id];
  bucket.assessed += 1;

  if (!levelKey) return;
  phaseData.counts[levelKey] = (phaseData.counts[levelKey] || 0) + 1;
  bucket.counts[levelKey] = (bucket.counts[levelKey] || 0) + 1;
}

async function buildStudentData({ scopeType, scopeId, scopeName, students, session, source }) {
  const isAfterSchool = source === "afterSchool";
  const studentIds = (students || []).map((s) => s.id);

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

  const notes = await loadNotes(scopeType, scopeId, session, source);

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

  const studentFellowMap = new Map(
    (students || []).map((student) => [student.id, fellowForStudent(student)])
  );

  const fellowsById = new Map();
  for (const student of students || []) {
    const fellow = fellowForStudent(student);
    if (!fellowsById.has(fellow.id)) {
      fellowsById.set(fellow.id, { ...fellow, studentCount: 0 });
    }
    fellowsById.get(fellow.id).studentCount += 1;
  }
  const fellows = Array.from(fellowsById.values()).sort((a, b) => a.name.localeCompare(b.name));

  // ── Subject sections ──
  const sections = subjectTemplates.map((template) => {
    const phases = emptyPhases();
    for (const form of relevant) {
      const phase = phaseMap(form.assessmentType);
      if (!phase) continue;
      const resp = (form.subjectResponses || []).find((r) => r.subjectTemplateId === template.id);
      bumpPhase(phases[phase], studentFellowMap.get(form.studentId), resp?.selectedOption || null);
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
    const level = resolveFlnLevel(flnResponses, flnCategories);
    bumpPhase(fluencyPhases[phase], studentFellowMap.get(form.studentId), level || UNQUALIFIED_KEY);
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
    scopeType,
    scopeId,
    scopeName,
    session,
    source,
    sessions,
    previousSession,
    totalStudents: studentIds.length,
    fellows,
    phases: PHASES,
    subjectTemplates: subjectTemplates.map((t) => ({ id: t.id, name: t.name, options: t.options || [], order: t.order })),
    flnCategories: flnCategories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
    sections,
    notes: noteMap,
  };
}

export async function getFellowStudentData(fellowId, session, source = "school") {
  if (!SOURCES.includes(source)) source = "school";

  const scope = await loadScope("fellow", fellowId, source);
  if (!scope) return null;

  return buildStudentData({
    scopeType: "fellow",
    scopeId: fellowId,
    scopeName: scope.name,
    students: scope.students,
    session,
    source,
  });
}

export async function getInstitutionStudentData(scopeType, scopeId, session) {
  if (!INSTITUTION_SCOPES.includes(scopeType)) return null;

  const source = scopeType === "school" ? "school" : "afterSchool";
  const scope = await loadScope(scopeType, scopeId, source);
  if (!scope) return null;

  return buildStudentData({
    scopeType,
    scopeId,
    scopeName: scope.name,
    students: scope.students,
    session,
    source,
  });
}

// Raw per-form assessment rows for one academic session.
// Used by the "Export Assessment Data" bulk export on the Student Data tab.
async function buildAssessmentExport({ scopeType, scopeId, scopeName, students, session, source }) {
  const isAfterSchool = source === "afterSchool";
  const studentIds = (students || []).map((s) => s.id);

  const [subjectTemplates, flnCategories, selQuestions] = await Promise.all([
    prisma.SubjectAssessmentTemplate.findMany({ orderBy: { order: "asc" } }),
    prisma.FLNCategory.findMany({
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    isAfterSchool
      ? Promise.resolve([])
      : prisma.SELQuestion.findMany({ orderBy: { order: "asc" } }),
  ]);

  const forms = studentIds.length
    ? isAfterSchool
      ? await prisma.AfterSchoolAssessmentForm.findMany({
          where: { studentId: { in: studentIds } },
          orderBy: { date: "asc" },
          include: {
            student: { select: { name: true, gender: true, dob: true, grade: true, fellow: { select: { name: true } } } },
            fellow: { select: { name: true } },
            centre: { select: { name: true } },
            subjectResponses: {
              include: { subjectTemplate: { select: { id: true, name: true, order: true } } },
            },
            flnResponses: {
              include: { flnQuestion: { include: { category: true } } },
            },
          },
        })
      : await prisma.AssessmentForm.findMany({
          where: { studentId: { in: studentIds } },
          orderBy: { date: "asc" },
          include: {
            student: { select: { name: true, gender: true, dob: true, grade: true, fellow: { select: { name: true } } } },
            fellow: { select: { name: true } },
            school: { select: { name: true } },
            subjectResponses: {
              include: { subjectTemplate: { select: { id: true, name: true, order: true } } },
            },
            flnResponses: {
              include: { flnQuestion: { include: { category: true } } },
            },
            selResponses: {
              include: { selQuestion: { select: { id: true, questionText: true, order: true } } },
            },
          },
        })
    : [];

  const relevant = session
    ? forms.filter((f) => deriveSession(f.date) === session)
    : forms;

  return {
    scopeType,
    scopeId,
    scopeName,
    fellowName: scopeType === "fellow" ? scopeName : "",
    session: session || null,
    source,
    subjectTemplates: subjectTemplates.map((t) => ({ id: t.id, name: t.name, order: t.order })),
    flnQuestions: flnCategories.flatMap((c) =>
      (c.questions || []).map((q) => ({
        id: q.id,
        questionText: q.questionText,
        order: q.order,
        categoryName: c.name,
        categoryOrder: c.order,
      }))
    ),
    selQuestions: selQuestions.map((q) => ({ id: q.id, questionText: q.questionText, order: q.order })),
    rows: relevant.map((f) => ({
      id: f.id,
      assessmentType: f.assessmentType,
      date: f.date,
      isEnrolledInSchool: f.isEnrolledInSchool,
      reasonNotEnrolled: f.reasonNotEnrolled,
      studentName: f.student?.name || "",
      studentGender: f.student?.gender || "",
      studentDob: f.student?.dob || null,
      studentGrade: f.student?.grade || "",
      fellowName: f.fellow?.name || f.student?.fellow?.name || (scopeType === "fellow" ? scopeName : ""),
      schoolName: isAfterSchool ? f.centre?.name || "" : f.school?.name || "",
      subjectResponses: (f.subjectResponses || []).map((r) => ({
        subjectTemplateId: r.subjectTemplateId,
        selectedOption: r.selectedOption,
      })),
      flnResponses: (f.flnResponses || []).map((r) => ({
        flnQuestionId: r.flnQuestionId,
        score: r.score,
      })),
      selResponses: (f.selResponses || []).map((r) => ({
        selQuestionId: r.selQuestionId,
        answer: r.answer,
      })),
    })),
  };
}

export async function getFellowAssessmentExport(fellowId, session, source = "school") {
  if (!SOURCES.includes(source)) source = "school";

  const scope = await loadScope("fellow", fellowId, source);
  if (!scope) return null;

  return buildAssessmentExport({
    scopeType: "fellow",
    scopeId: fellowId,
    scopeName: scope.name,
    students: scope.students,
    session,
    source,
  });
}

export async function getInstitutionAssessmentExport(scopeType, scopeId, session) {
  if (!INSTITUTION_SCOPES.includes(scopeType)) return null;

  const source = scopeType === "school" ? "school" : "afterSchool";
  const scope = await loadScope(scopeType, scopeId, source);
  if (!scope) return null;

  return buildAssessmentExport({
    scopeType,
    scopeId,
    scopeName: scope.name,
    students: scope.students,
    session,
    source,
  });
}
