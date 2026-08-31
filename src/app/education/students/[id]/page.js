"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmActionModal from "@/components/ConfirmActionModal";

// ─── Small helpers ─────────────────────────────────────────────────────────────
function InputField({ label, name, value, onChange, type = "text", required = false, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
          <h3 className="text-lg font-bold font-headline text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function StudentProfileDetail() {
  const { id } = useParams();
  const { user, token, isInitializing } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // 'edit' | 'school' | 'attendance' | 'assessment_form'
  const [showConfirmMigrate, setShowConfirmMigrate] = useState(false);
  const [schools, setSchools] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [learningAssessments, setLearningAssessments] = useState([]);
  const [homeworkRecords, setHomeworkRecords] = useState([]);
  const [assessmentDateFilter, setAssessmentDateFilter] = useState("");
  const [homeworkDateFilter, setHomeworkDateFilter] = useState("");
  const [assessmentForms, setAssessmentForms] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [searchQ, setSearchQ] = useState("");

  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [academicMonthFilter, setAcademicMonthFilter] = useState("");

  // Form states
  const [editForm, setEditForm] = useState({});
  const [transitionForm, setTransitionForm] = useState({ academicYear: "", month: "", status: "CONTINUING_EDUCATION", description: "", location: "" });
  const [editTransitionId, setEditTransitionId] = useState(null);
  const [attendanceYearFilter, setAttendanceYearFilter] = useState("All Years");
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState("All Months");

  // Assessment form state
  const [activeFormTab, setActiveFormTab] = useState("basic");
  const [editingFormId, setEditingFormId] = useState(null);
  const [assessmentFormData, setAssessmentFormData] = useState({
    assessmentType: "", date: "",
    isEnrolledInSchool: null, reasonNotEnrolled: "",
    subjectResponses: [], flnScores: {}, selAnswers: {}
  });

  // Assessment templates
  const [templates, setTemplates] = useState({ flnCategories: [], selQuestions: [], subjectTemplates: [] });
  const [templateModalTab, setTemplateModalTab] = useState("fln");
  const [templateEditor, setTemplateEditor] = useState(null);
  const [templateDelete, setTemplateDelete] = useState(null);
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState("");

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const loadStudent = useCallback(async () => {
    try {
      const res = await fetch(`/api/students/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (json.success) {
        setStudent(json.data);
        setAttendanceLogs(json.data.attendanceLogs || []);
        setAssessmentForms(json.data.assessmentForms || []);
        setLearningAssessments(json.data.learningAssessments || []);
        setHomeworkRecords(json.data.homeworkRecords || []);
        setTransitions(json.data.transitions || []);
        if (json.data.beneficiary) setBeneficiaries([json.data.beneficiary]);
        setEditForm({
          name: json.data.name || "",
          studentId: json.data.studentId || "",
          dob: json.data.dob ? json.data.dob.split("T")[0] : "",
          gender: json.data.gender || "",
          email: json.data.email || "",
          phone: json.data.phone || "",
          address: json.data.address || "",
          grade: json.data.grade || "",
          gradeGroup: json.data.gradeGroup || "",
          district: json.data.district || "",
          guardianName: json.data.guardianName || "",
          guardianPhone: json.data.guardianPhone || "",
          enrolmentDate: json.data.enrolmentDate ? json.data.enrolmentDate.split("T")[0] : "",
          primaryLanguage: json.data.primaryLanguage || "",
          status: json.data.status || "On Track",
        });
      }
    } catch (err) {
      console.error("Failed to load student:", err);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!isInitializing) {
      loadStudent();
    }
  }, [loadStudent, isInitializing]);

  // Fetch schools for the school-assign modal
  useEffect(() => {
    if (modal !== "school") return;
    fetch("/api/schools", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(j => { if (j.success) setSchools(j.data); })
      .catch(console.error);
  }, [modal, token]);

  // Fetch assessment templates
  const loadTemplates = useCallback(async () => {
    try {
      const [flnRes, selRes, subjRes] = await Promise.all([
        fetch("/api/assessment-templates/fln-categories", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch("/api/assessment-templates/sel-questions", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch("/api/assessment-templates/subjects", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ]);
      const [flnData, selData, subjData] = await Promise.all([flnRes.json(), selRes.json(), subjRes.json()]);
      setTemplates({
        flnCategories: flnData.success ? flnData.data : [],
        selQuestions: selData.success ? selData.data : [],
        subjectTemplates: subjData.success ? subjData.data : []
      });
    } catch (err) { console.error("Failed to load templates:", err); }
  }, [token]);

  // Load assessment templates when modal opens or on mount
  useEffect(() => {
    if (!isInitializing && token) {
      loadTemplates();
    }
  }, [isInitializing, token, loadTemplates]);

  // Fetch fresh attendance
  const reloadAttendance = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/attendance`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setAttendanceLogs(j.data);
  }, [id, token]);

  // Fetch fresh assessment forms
  const reloadAssessmentForms = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/assessment-forms`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setAssessmentForms(j.data);
  }, [id, token]);

  // ─── Assessment Form Handlers ────────────────────────────────────────────────

  function openNewAssessmentForm() {
    setEditingFormId(null);
    setActiveFormTab("basic");
    const subjectResponses = (templates.subjectTemplates || []).map(st => ({
      subjectTemplateId: st.id, selectedOption: ""
    }));
    const flnScores = {};
    const selAnswers = {};
    (templates.flnCategories || []).forEach(cat => {
      (cat.questions || []).forEach(q => { flnScores[q.id] = ""; });
    });
    (templates.selQuestions || []).forEach(q => { selAnswers[q.id] = ""; });
    setAssessmentFormData({
      assessmentType: "", date: "",
      isEnrolledInSchool: null, reasonNotEnrolled: "",
      subjectResponses, flnScores, selAnswers
    });
    setModal("assessment_form");
  }

  function openEditAssessmentForm(form) {
    setEditingFormId(form.id);
    setActiveFormTab("basic");
    const subjectResponses = (templates.subjectTemplates || []).map(st => {
      const existing = (form.subjectResponses || []).find(sr => sr.subjectTemplateId === st.id);
      return { subjectTemplateId: st.id, selectedOption: existing ? existing.selectedOption : "" };
    });
    const flnScores = {};
    (templates.flnCategories || []).forEach(cat => {
      (cat.questions || []).forEach(q => {
        const existing = (form.flnResponses || []).find(fr => fr.flnQuestionId === q.id);
        flnScores[q.id] = existing ? existing.score : "";
      });
    });
    const selAnswers = {};
    (templates.selQuestions || []).forEach(q => {
      const existing = (form.selResponses || []).find(sr => sr.selQuestionId === q.id);
      selAnswers[q.id] = existing ? existing.answer : "";
    });
    setAssessmentFormData({
      assessmentType: form.assessmentType || "",
      date: form.date ? form.date.split("T")[0] : "",
      isEnrolledInSchool: form.isEnrolledInSchool,
      reasonNotEnrolled: form.reasonNotEnrolled || "",
      subjectResponses, flnScores, selAnswers
    });
    setModal("assessment_form");
  }

  async function handleAssessmentFormSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        assessmentType: assessmentFormData.assessmentType,
        date: assessmentFormData.date,
        isEnrolledInSchool: assessmentFormData.isEnrolledInSchool,
        reasonNotEnrolled: assessmentFormData.reasonNotEnrolled || null,
        subjectResponses: assessmentFormData.subjectResponses.filter(sr => sr.selectedOption),
        flnScores: Object.fromEntries(
          Object.entries(assessmentFormData.flnScores).filter(([, v]) => v !== "" && v !== null)
        ),
        selAnswers: Object.fromEntries(
          Object.entries(assessmentFormData.selAnswers).filter(([, v]) => v !== "" && v !== null)
        )
      };

      if (editingFormId) {
        await fetch(`/api/assessment-forms/${editingFormId}/responses`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`/api/students/${id}/assessment-forms`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
      }
      await reloadAssessmentForms();
      setModal(null);
      setEditingFormId(null);
    } catch (err) {
      console.error("Failed to save assessment form:", err);
    } finally { setSaving(false); }
  }

  async function handleDeleteAssessmentForm(formId) {
    if (!confirm("Delete this assessment form?")) return;
    await fetch(`/api/assessment-forms/${formId}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    await reloadAssessmentForms();
  }

  function normalizeTemplateOptions(options) {
    return (options || []).map(opt => opt.trim()).filter(Boolean);
  }

  function openTemplateEditor(type, item = null, extra = {}) {
    const defaultOptions = type === "sel-question"
      ? ["Too Easy", "Easy", "Hard", "Too Hard", "Can with Teachers Help"]
      : type === "subject"
        ? ["words", "letter", "beginner", "paragraph (STD 1 level text)", "absent"]
        : [];

    setTemplateEditor({
      type,
      id: item?.id || null,
      name: item?.name || "",
      questionText: item?.questionText || "",
      marks: item?.marks ?? 1,
      order: item?.order ?? extra.order ?? 0,
      categoryId: item?.categoryId || extra.categoryId || "",
      options: Array.isArray(item?.options) ? item.options : defaultOptions
    });
  }

  function updateTemplateOption(index, value) {
    setTemplateEditor(editor => ({
      ...editor,
      options: editor.options.map((option, i) => i === index ? value : option)
    }));
  }

  function addTemplateOption() {
    setTemplateEditor(editor => ({ ...editor, options: [...(editor.options || []), ""] }));
  }

  function removeTemplateOption(index) {
    setTemplateEditor(editor => ({
      ...editor,
      options: editor.options.filter((_, i) => i !== index)
    }));
  }

  async function handleTemplateSave(e) {
    e.preventDefault();
    if (!templateEditor) return;

    setSaving(true);
    try {
      const { type, id: templateId } = templateEditor;
      let endpoint = "";
      let payload = {};

      if (type === "fln-category") {
        endpoint = templateId
          ? `/api/assessment-templates/fln-categories/${templateId}`
          : "/api/assessment-templates/fln-categories";
        payload = {
          name: templateEditor.name.trim(),
          order: parseInt(templateEditor.order, 10) || 0
        };
      }

      if (type === "fln-question") {
        endpoint = templateId
          ? `/api/assessment-templates/fln-questions/${templateId}`
          : "/api/assessment-templates/fln-questions";
        payload = {
          categoryId: templateEditor.categoryId,
          questionText: templateEditor.questionText.trim(),
          marks: templateEditor.marks === "" ? 0 : Number(templateEditor.marks),
          order: parseInt(templateEditor.order, 10) || 0
        };
      }

      if (type === "sel-question") {
        endpoint = templateId
          ? `/api/assessment-templates/sel-questions/${templateId}`
          : "/api/assessment-templates/sel-questions";
        payload = {
          questionText: templateEditor.questionText.trim(),
          options: normalizeTemplateOptions(templateEditor.options),
          order: parseInt(templateEditor.order, 10) || 0
        };
      }

      if (type === "subject") {
        endpoint = templateId
          ? `/api/assessment-templates/subjects/${templateId}`
          : "/api/assessment-templates/subjects";
        payload = {
          name: templateEditor.name.trim(),
          options: normalizeTemplateOptions(templateEditor.options),
          order: parseInt(templateEditor.order, 10) || 0
        };
      }

      const res = await fetch(endpoint, {
        method: templateId ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to save template");
        return;
      }
      await loadTemplates();
      setTemplateEditor(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleTemplateDelete() {
    if (!templateDelete) return;

    const endpointMap = {
      "fln-category": `/api/assessment-templates/fln-categories/${templateDelete.id}`,
      "fln-question": `/api/assessment-templates/fln-questions/${templateDelete.id}`,
      "sel-question": `/api/assessment-templates/sel-questions/${templateDelete.id}`,
      subject: `/api/assessment-templates/subjects/${templateDelete.id}`
    };

    await fetch(endpointMap[templateDelete.type], {
      method: "DELETE",
      headers: authHeaders()
    });
    await loadTemplates();
    setTemplateDelete(null);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (json.success) { await loadStudent(); setModal(null); }
      else alert(json.error || "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleToggleMigrated() {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isMigrated: !student.isMigrated })
      });
      const json = await res.json();
      if (json.success) { await loadStudent(); }
      else alert(json.error || "Failed to update migration status");
    } finally { setSaving(false); setShowConfirmMigrate(false); }
  }

  async function handleSchoolAssign(schoolId) {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ schoolId: schoolId || null })
      });
      const json = await res.json();
      if (json.success) { await loadStudent(); setModal(null); }
      else alert(json.error || "Failed to update school");
    } finally { setSaving(false); }
  }

  async function handleTransitionSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTransitionId) {
        await fetch(`/api/students/${id}/transitions`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ transitionId: editTransitionId, ...transitionForm })
        });
      } else {
        await fetch(`/api/students/${id}/transitions`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ ...transitionForm })
        });
      }
      await reloadTransitions();
      setTransitionForm({ academicYear: "", month: "", status: "CONTINUING_EDUCATION", description: "", location: "" });
      setEditTransitionId(null);
      setModal(null);
    } finally { setSaving(false); }
  }

  async function handleDeleteTransition(transitionId) {
    if (!confirm("Delete this transition record?")) return;
    await fetch(`/api/students/${id}/transitions`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ transitionId })
    });
    await reloadTransitions();
  }

  async function handleLinkBeneficiary(beneficiaryId) {
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ beneficiaryId })
    });
    await loadStudent();
    setModal(null);
  }

  async function handleUnlinkBeneficiary() {
    await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ beneficiaryId: null })
    });
    await loadStudent();
    setBeneficiaries([]);
  }

  // Fetch fresh transitions
  const reloadTransitions = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/transitions`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setTransitions(j.data);
  }, [id, token]);

  // Fetch beneficiaries for linking
  const loadBeneficiaries = useCallback(async () => {
    const res = await fetch("/api/beneficiaries", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setBeneficiaries(j.data);
  }, [token]);


  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return <div className="p-8 text-center text-on-surface-variant font-medium">Student not found</div>;
  }

  // Dropout risk calculation
  const dropoutRisk = (() => {
    const att = student.attendance || 0;
    const completedHW = homeworkRecords.filter(h => h.homeworkStatus === "DONE").length;
    const totalHW = homeworkRecords.filter(h => h.homeworkStatus !== "NO_HOMEWORK").length;
    const hwRate = totalHW > 0 ? (completedHW / totalHW) * 100 : 100;
    const canReadCount = learningAssessments.filter(a => a.canRead).length;
    const totalLA = learningAssessments.length;

    let risk = "Low";
    let color = "bg-primary/10 text-primary";
    let barColor = "bg-primary";
    let reasons = [];
    if (att < 35) { risk = "High"; color = "bg-error/10 text-error"; barColor = "bg-error"; reasons.push("Attendance below 35%"); }
    else if (att < 60) { risk = "Medium"; color = "bg-yellow-500/10 text-yellow-600"; barColor = "bg-yellow-500"; reasons.push("Attendance below 60%"); }
    const recentAtt = attendanceLogs.slice(0, 3);
    if (recentAtt.length >= 2 && recentAtt.every(l => l.percentage < 50)) reasons.push("Declining recent attendance");
    if (totalHW > 0 && hwRate < 50) reasons.push("Low homework completion");
    if (totalLA > 3 && canReadCount < totalLA / 2) reasons.push("Reading difficulty");
    if (reasons.length === 0) reasons.push("On track - keep it up");
    return { risk, color, barColor, reasons, att, hwRate };
  })();

  const name = student.name;

  const attendanceYears = ["All Years", ...Array.from(new Set(attendanceLogs.map(log => {
    const yearMatch = log.month.match(/\b(20\d{2})\b/);
    return yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  }))).sort((a, b) => b.localeCompare(a))];
  const attendanceMonths = ["All Months", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const filteredAttendanceLogs = attendanceLogs.filter(log => {
    const yearMatch = log.month.match(/\b(20\d{2})\b/);
    const y = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    const matchYear = attendanceYearFilter === "All Years" || y === attendanceYearFilter;
    const matchMonth = attendanceMonthFilter === "All Months" || log.month.toLowerCase().includes(attendanceMonthFilter.toLowerCase());
    return matchYear && matchMonth;
  });

  const academicMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const academicYearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    academicYearOptions.push(`${y - 1}-${y}`);
  }

  const filteredAssessmentForms = assessmentForms.filter(f => {
    if (!assessmentTypeFilter) return true;
    return f.assessmentType === assessmentTypeFilter;
  });

  const isAdminOrManager = user && (user.roleName === "ADMIN" || user.roleName === "PROGRAM_MANAGER");

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link href="/education/students" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Students Directory</span>
      </Link>

      {/* Hero Section */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-4xl shrink-0 border-4 border-surface shadow-md">
            {name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">{student.name}</h2>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${student.status === "On Track" ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"}`}>
                {student.status}
              </span>
              {student.isMigrated && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">
                  Migrated
                </span>
              )}
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">school</span>
              {student.school ? student.school.name : "Unassigned"} • {student.grade}
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div><span className="font-bold text-on-surface">Student ID:</span> {student.studentId}</div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div><span className="font-bold text-on-surface">District:</span> {student.district || "—"}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start flex-wrap">
          <button
            onClick={() => setShowConfirmMigrate(true)}
            disabled={saving}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {student.isMigrated ? "undo" : "moving"}
            </span>
            {student.isMigrated ? "Unmark Migrated" : "Mark Migrated"}
          </button>
          <button
            onClick={() => setModal("edit")}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Student Info
          </button>
          <button
            onClick={() => setModal("school")}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            Manage School
          </button>
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">

          {/* Demographics */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Demographics &amp; Enrolment Records
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 font-sans text-sm">
              {[
                ["Full Name", name],
                ["Age / Gender", `${student.dob ? `${Math.floor((new Date() - new Date(student.dob)) / 31557600000)} Years` : "—"} / ${student.gender || "—"}`],
                ["Guardian Contact", `${student.guardianName || "—"} (${student.guardianPhone || "—"})`],
                ["Enrolment Date", student.enrolmentDate ? new Date(student.enrolmentDate).toLocaleDateString() : "—"],
                ["Primary Language", student.primaryLanguage || "—"],
                ["Home Location", `${student.address || "—"}, ${student.district || "—"}`],
                ["Email", student.email || "—"],
                ["Phone", student.phone || "—"],
              ].map(([label, val]) => (
                <div key={label} className="border-b border-surface-container pb-3">
                  <p className="text-on-surface-variant mb-1 font-medium">{label}</p>
                  <p className="font-semibold text-on-surface capitalize">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Assessments */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Academic Assessments
              </h3>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-6 pb-4 border-b border-outline-variant/20">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Assessment Type</label>
                <select value={assessmentTypeFilter} onChange={(e) => setAssessmentTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
                  <option value="">All Types</option>
                  <option value="BASELINE">Baseline</option>
                  <option value="MIDLINE">Midline</option>
                  <option value="ENDLINE">Endline</option>
                </select>
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => { loadTemplates().then(() => openNewAssessmentForm()); }}
                  className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  New Assessment
                </button>
              </div>
            </div>

            {/* Assessment Forms List */}
            {filteredAssessmentForms.length === 0 ? (
              <p className="text-center py-4 text-on-surface-variant font-sans text-xs">No assessment forms recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredAssessmentForms.map((form) => {
                  const typeColors = {
                    BASELINE: "bg-blue-100 text-blue-700",
                    MIDLINE: "bg-yellow-100 text-yellow-700",
                    ENDLINE: "bg-green-100 text-green-700"
                  };
                  const totalFLNMarks = templates.flnCategories.reduce((sum, cat) =>
                    sum + (cat.questions || []).reduce((s, q) => s + (q.marks || 0), 0), 0
                  );
                  const scoredFLN = (form.flnResponses || []).reduce((sum, r) => sum + (r.score || 0), 0);
                  return (
                    <div key={form.id} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[form.assessmentType] || "bg-surface-variant text-on-surface-variant"}`}>
                            {form.assessmentType}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {form.date ? new Date(form.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                          </span>
                          {form.fellow && (
                            <span className="text-xs text-on-surface-variant">by {form.fellow.name}</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                          <button
                            onClick={() => { loadTemplates().then(() => openEditAssessmentForm(form)); }}
                            className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          {isAdminOrManager && (
                            <button
                              onClick={() => handleDeleteAssessmentForm(form.id)}
                              className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Summary mini-cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-surface rounded p-2 text-center">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Enrolled</p>
                          <p className="text-sm font-semibold text-on-surface">
                            {form.isEnrolledInSchool === null ? "—" : form.isEnrolledInSchool ? "Yes" : "No"}
                          </p>
                        </div>
                        <div className="bg-surface rounded p-2 text-center">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Subjects</p>
                          <p className="text-sm font-semibold text-on-surface">
                            {form.subjectResponses?.length || 0}/{templates.subjectTemplates.length || 0}
                          </p>
                        </div>
                        <div className="bg-surface rounded p-2 text-center">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">FLN Score</p>
                          <p className="text-sm font-semibold text-on-surface">
                            {scoredFLN}/{totalFLNMarks}
                          </p>
                        </div>
                        <div className="bg-surface rounded p-2 text-center">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">SEL</p>
                          <p className="text-sm font-semibold text-on-surface">
                            {form.selResponses?.length || 0}/{templates.selQuestions.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">

          {/* Attendance Ledger */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  Attendance Ledger
                </h3>
              </div>
              <div className="flex gap-2">
                <select
                  value={attendanceYearFilter}
                  onChange={(e) => setAttendanceYearFilter(e.target.value)}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary flex-1"
                >
                  {attendanceYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={attendanceMonthFilter}
                  onChange={(e) => setAttendanceMonthFilter(e.target.value)}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary flex-1"
                >
                  {attendanceMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-4 font-sans text-sm">
              {filteredAttendanceLogs.length === 0 && (
                <p className="text-center py-4 text-on-surface-variant text-xs">No attendance records found.</p>
              )}
              {filteredAttendanceLogs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1.5 py-2 border-b border-surface-container last:border-none">
                  <div className="flex justify-between font-semibold">
                    <span className="text-on-surface">{log.month}</span>
                    <span className="text-primary">{log.percentage}% ({log.present}/{log.total})</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${log.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dropout Risk */}
          <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-ambient border ${dropoutRisk.risk === "High" ? "border-error/30" : dropoutRisk.risk === "Medium" ? "border-yellow-500/30" : "border-outline-variant/10"}`}>
            <h3 className="font-headline font-bold text-base text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">warning</span>
              Dropout Risk
            </h3>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Risk Level</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dropoutRisk.color}`}>{dropoutRisk.risk}</span>
              </div>
              <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${dropoutRisk.barColor}`} style={{ width: `${Math.max(dropoutRisk.att, 5)}%` }}></div>
              </div>
              <p className="text-xs text-on-surface-variant">Attendance: {dropoutRisk.att}%</p>
              <ul className="text-xs text-on-surface-variant space-y-1 list-disc pl-4">
                {dropoutRisk.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Program Linkages */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hub</span>
              Program Linkages
            </h3>
            <div className="space-y-4 font-sans text-sm">
              <div className="p-4 bg-surface rounded-lg">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Partner School</p>
                {student.school ? (
                  <Link href={`/education/schools/${student.school.id}`} className="font-semibold text-primary hover:underline">
                    {student.school.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-on-surface-variant">Unassigned</span>
                )}
                <p className="text-xs text-on-surface-variant mt-1">
                  {student.school ? `${student.school.location || ""}` : "Not yet linked to any institution."}
                </p>
              </div>

              <div className="p-4 bg-surface rounded-lg">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Fellows (via School)</p>
                {student.school?.fellows && student.school.fellows.length > 0 ? (
                  <div className="space-y-2">
                    {student.school.fellows.map(fs => (
                      <div key={fs.fellow?.id || fs.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                          {fs.fellow?.name ? fs.fellow.name[0].toUpperCase() : "?"}
                        </div>
                        <Link href={`/education/fellows/${fs.fellow?.id}`} className="font-semibold text-primary text-sm hover:underline">
                          {fs.fellow?.name || "—"}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-on-surface-variant">
                    {student.school ? "No fellows assigned to this school." : "Assign a school first."}
                  </span>
                )}
              </div>

              <div className="p-4 bg-surface rounded-lg">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Beneficiary Family</p>
                {student.beneficiary ? (
                  <div className="flex items-center justify-between">
                    <Link href={`/beneficiaries/${student.beneficiary.id}`} className="font-semibold text-primary text-sm hover:underline">
                      {student.beneficiary.name}
                    </Link>
                    <button onClick={() => handleUnlinkBeneficiary()}
                      className="text-error hover:underline text-xs font-medium cursor-pointer">Unlink</button>
                  </div>
                ) : (
                  <button onClick={() => { setModal("linkBeneficiary"); setSearchQ(""); loadBeneficiaries(); }}
                    className="text-primary text-xs font-medium hover:underline cursor-pointer">
                    + Link to Beneficiary
                  </button>
                )}
              </div>
            </div>
          </div>

          {isAdminOrManager && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">settings</span>
                    Assessment Templates
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    FLN, SEL, and subject template setup
                  </p>
                </div>
                <button
                  onClick={() => { loadTemplates(); setModal("assessment_templates"); }}
                  className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Manage
                </button>
              </div>
            </div>
          )}

          {/* Learning Assessment History */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                Learning Assessment History
              </h3>
              <input
                type="date"
                value={assessmentDateFilter}
                onChange={(e) => setAssessmentDateFilter(e.target.value)}
                className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>
            {learningAssessments.length === 0 ? (
              <p className="text-center py-4 text-on-surface-variant text-xs">No learning assessments recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto font-sans text-sm">
                {learningAssessments
                  .filter(a => {
                    if (!assessmentDateFilter) return true;
                    const d = new Date(a.date);
                    const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return localStr === assessmentDateFilter;
                  })
                  .map(assess => (
                  <div key={assess.id} className="flex items-center justify-between py-2 border-b border-surface-container last:border-none">
                    <span className="text-on-surface-variant text-xs">
                      {new Date(assess.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${assess.canRead ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                      {assess.canRead ? "Can Read" : "Cannot Read"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Homework History */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">assignment</span>
                Homework History
              </h3>
              <input
                type="date"
                value={homeworkDateFilter}
                onChange={(e) => setHomeworkDateFilter(e.target.value)}
                className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>
            {homeworkRecords.length === 0 ? (
              <p className="text-center py-4 text-on-surface-variant text-xs">No homework records yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto font-sans text-sm">
                {homeworkRecords
                  .filter(h => {
                    if (!homeworkDateFilter) return true;
                    const d = new Date(h.date);
                    const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return localStr === homeworkDateFilter;
                  })
                  .map(hw => {
                  const statusColors = {
                    DONE: "bg-primary/10 text-primary",
                    NOT_DONE: "bg-error/10 text-error",
                    NO_HOMEWORK: "bg-surface-container text-on-surface-variant"
                  };
                  const statusLabels = { DONE: "Done", NOT_DONE: "Not Done", NO_HOMEWORK: "No HW" };
                  return (
                    <div key={hw.id} className="flex items-center justify-between py-2 border-b border-surface-container last:border-none">
                      <span className="text-on-surface-variant text-xs">
                        {new Date(hw.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[hw.homeworkStatus] || 'bg-surface-container text-on-surface-variant'}`}>
                        {statusLabels[hw.homeworkStatus] || hw.homeworkStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* School Transition History */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                School Transition History
              </h3>
              <button
                onClick={() => {
                  const now = new Date();
                  setModal("transition"); setEditTransitionId(null);
                  setTransitionForm({ academicYear: `${now.getFullYear() - 1}-${now.getFullYear()}`, month: now.toLocaleString('en-US', { month: 'short' }), status: "CONTINUING_EDUCATION", description: "", location: "" });
                }}
                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add
              </button>
            </div>
            {transitions.length === 0 ? (
              <p className="text-center py-4 text-on-surface-variant text-xs">No transition records yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto font-sans text-sm">
                {transitions.map(t => {
                  const statusColors = {
                    CONTINUING_EDUCATION: "bg-primary/10 text-primary",
                    ENROLLED_COLLEGE: "bg-secondary/10 text-secondary",
                    WORKING: "bg-tertiary/10 text-tertiary",
                    DROPOUT: "bg-error/10 text-error",
                    OTHER: "bg-surface-container text-on-surface-variant"
                  };
                  const statusLabels = {
                    CONTINUING_EDUCATION: "Continuing Education",
                    ENROLLED_COLLEGE: "Enrolled in College",
                    WORKING: "Working",
                    DROPOUT: "Dropout",
                    OTHER: "Other"
                  };
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-surface-container last:border-none">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[t.status] || 'bg-surface-container text-on-surface-variant'}`}>
                            {statusLabels[t.status] || t.status}
                          </span>
                          <span className="text-xs text-on-surface-variant">{t.month} {t.academicYear}</span>
                        </div>
                        {(t.description || t.location) && (
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{[t.description, t.location].filter(Boolean).join(' — ')}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button onClick={() => { setEditTransitionId(t.id); setTransitionForm({ academicYear: t.academicYear || "", month: t.month || "", status: t.status, description: t.description || "", location: t.location || "" }); setModal("transition"); }}
                          className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteTransition(t.id)}
                          className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────────────── */}

      {/* Edit Student Info Modal */}
      {modal === "edit" && (
        <Modal title="Edit Student Info" onClose={() => setModal(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Full Name" name="name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              <InputField label="Student ID" name="studentId" value={editForm.studentId} onChange={e => setEditForm(f => ({ ...f, studentId: e.target.value }))} />
              <InputField label="Date of Birth" name="dob" type="date" value={editForm.dob} onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))} />
              <InputField label="Gender" name="gender" value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} options={["", "Male", "Female", "Other"]} />
              <InputField label="Grade" name="grade" value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} />
              <InputField label="Grade Group" name="gradeGroup" value={editForm.gradeGroup} onChange={e => setEditForm(f => ({ ...f, gradeGroup: e.target.value }))} options={["", "Primary", "Middle", "Secondary", "Senior Secondary"]} />
              <InputField label="District" name="district" value={editForm.district} onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))} />
              <InputField label="Primary Language" name="primaryLanguage" value={editForm.primaryLanguage} onChange={e => setEditForm(f => ({ ...f, primaryLanguage: e.target.value }))} />
              <InputField label="Email" name="email" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              <InputField label="Phone" name="phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              <InputField label="Guardian Name" name="guardianName" value={editForm.guardianName} onChange={e => setEditForm(f => ({ ...f, guardianName: e.target.value }))} />
              <InputField label="Guardian Phone" name="guardianPhone" value={editForm.guardianPhone} onChange={e => setEditForm(f => ({ ...f, guardianPhone: e.target.value }))} />
              <InputField label="Address" name="address" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
              <InputField label="Enrolment Date" name="enrolmentDate" type="date" value={editForm.enrolmentDate} onChange={e => setEditForm(f => ({ ...f, enrolmentDate: e.target.value }))} />
              <InputField label="Status" name="status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} options={["On Track", "Needs Attention", "At Risk", "Graduated", "Inactive"]} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage School Modal */}
      {modal === "school" && (
        <Modal title="Manage School Assignment" onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4">
            Currently assigned: <strong className="text-on-surface">{student.school?.name || "None"}</strong>
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
            <button
              onClick={() => handleSchoolAssign(null)}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer text-sm font-sans ${!student.schoolId ? "border-primary bg-primary/10 text-primary" : "border-outline-variant hover:bg-surface-container"}`}
            >
              <span className="font-semibold">Unassign (No School)</span>
            </button>
            {schools.map(s => (
              <button
                key={s.id}
                onClick={() => handleSchoolAssign(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer text-sm font-sans ${student.schoolId === s.id ? "border-primary bg-primary/10 text-primary" : "border-outline-variant hover:bg-surface-container"}`}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-on-surface-variant ml-2">{s.location}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Assessment Form Modal */}
      {modal === "assessment_form" && (
        <Modal title={editingFormId ? "Edit Assessment Form" : "New Assessment Form"} onClose={() => { setModal(null); setEditingFormId(null); }}>
          <form onSubmit={handleAssessmentFormSave} className="space-y-4">
            {/* Tab navigation */}
            <div className="flex gap-1 border-b border-outline-variant/20 pb-2 overflow-x-auto">
              {["basic", "enrollment", "subjects", "fln", "sel"].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFormTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeFormTab === tab ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {tab === "basic" ? "Basic Info" : tab === "enrollment" ? "Enrollment" : tab === "subjects" ? "Subjects" : tab === "fln" ? "FLN" : "SEL"}
                </button>
              ))}
            </div>

            {/* Basic Info Tab */}
            {activeFormTab === "basic" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Fellow Name</label>
                    <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                      {user?.fellowName || user?.name || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Student Name</label>
                    <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                      {student.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Gender</label>
                    <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                      {student.gender || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Age</label>
                    <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                      {student.dob ? `${Math.floor((new Date() - new Date(student.dob)) / 31557600000)} Years` : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Class / Grade</label>
                    <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                      {student.grade || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">School Name</label>
                    <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                      {student.school?.name || "Unassigned"}
                    </span>
                  </div>
                </div>
                <InputField label="Assessment Type" name="assessmentType" value={assessmentFormData.assessmentType}
                  onChange={e => setAssessmentFormData(f => ({ ...f, assessmentType: e.target.value }))}
                  options={["", "BASELINE", "MIDLINE", "ENDLINE"]} required />
                <InputField label="Date" name="date" type="date" value={assessmentFormData.date}
                  onChange={e => setAssessmentFormData(f => ({ ...f, date: e.target.value }))} required />
              </div>
            )}

            {/* Enrollment Tab */}
            {activeFormTab === "enrollment" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-on-surface">Is the child enrolled in School?</label>
                  <div className="flex gap-4">
                    {[true, false].map(val => (
                      <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="isEnrolled" checked={assessmentFormData.isEnrolledInSchool === val}
                          onChange={() => setAssessmentFormData(f => ({ ...f, isEnrolledInSchool: val, reasonNotEnrolled: val ? "" : f.reasonNotEnrolled }))}
                          className="accent-primary" />
                        <span className="text-sm text-on-surface">{val ? "Yes" : "No"}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {assessmentFormData.isEnrolledInSchool === false && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">If no, why?</label>
                    <textarea rows="3" value={assessmentFormData.reasonNotEnrolled}
                      onChange={e => setAssessmentFormData(f => ({ ...f, reasonNotEnrolled: e.target.value }))}
                      className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
                  </div>
                )}
              </div>
            )}

            {/* Subjects Tab */}
            {activeFormTab === "subjects" && (
              <div className="space-y-4">
                {templates.subjectTemplates.length === 0 ? (
                  <p className="text-center py-4 text-on-surface-variant text-xs">No subject templates configured.</p>
                ) : (
                  templates.subjectTemplates.map((st) => {
                    const resp = assessmentFormData.subjectResponses.find(sr => sr.subjectTemplateId === st.id);
                    const options = Array.isArray(st.options) ? st.options : [];
                    return (
                      <InputField key={st.id}
                        label={st.name}
                        name={`subject_${st.id}`}
                        value={resp ? resp.selectedOption : ""}
                        onChange={e => {
                          setAssessmentFormData(f => ({
                            ...f,
                            subjectResponses: f.subjectResponses.map(sr =>
                              sr.subjectTemplateId === st.id ? { ...sr, selectedOption: e.target.value } : sr
                            )
                          }));
                        }}
                        options={["", ...options]} />
                    );
                  })
                )}
              </div>
            )}

            {/* FLN Tab */}
            {activeFormTab === "fln" && (
              <div className="space-y-6">
                {templates.flnCategories.length === 0 ? (
                  <p className="text-center py-4 text-on-surface-variant text-xs">No FLN categories configured.</p>
                ) : (
                  templates.flnCategories.map(cat => {
                    const catScore = (cat.questions || []).reduce((sum, q) =>
                      sum + (parseFloat(assessmentFormData.flnScores[q.id]) || 0), 0);
                    const catMax = (cat.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0);
                    return (
                      <div key={cat.id} className="border border-outline-variant/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-headline font-bold text-sm text-on-surface">{cat.name}</h4>
                          <span className="text-xs text-on-surface-variant">{catScore}/{catMax}</span>
                        </div>
                        {(cat.questions || []).map(q => (
                          <div key={q.id} className="flex items-center gap-3 py-1.5">
                            <span className="text-xs text-on-surface-variant flex-1">
                              Q{q.order}. {q.questionText}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <input type="number" min="0" max={q.marks}
                                value={assessmentFormData.flnScores[q.id] ?? ""}
                                onChange={e => {
                                  const parsed = parseFloat(e.target.value);
                                  const val = Number.isNaN(parsed) ? "" : Math.min(Math.max(0, parsed), q.marks);
                                  setAssessmentFormData(f => ({
                                    ...f,
                                    flnScores: { ...f.flnScores, [q.id]: val }
                                  }));
                                }}
                                className="w-16 px-2 py-1 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm text-center focus:outline-none focus:border-primary" />
                              <span className="text-xs text-on-surface-variant">/ {q.marks}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
                {templates.flnCategories.length > 0 && (
                  <div className="text-right pt-2 border-t border-outline-variant/20">
                    <span className="text-sm font-bold text-on-surface">
                      Total FLN: {
                        Object.entries(assessmentFormData.flnScores).reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0)
                      } / {
                        templates.flnCategories.reduce((sum, cat) =>
                          sum + (cat.questions || []).reduce((s, q) => s + (q.marks || 0), 0), 0)
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SEL Tab */}
            {activeFormTab === "sel" && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {templates.selQuestions.length === 0 ? (
                  <p className="text-center py-4 text-on-surface-variant text-xs">No SEL questions configured.</p>
                ) : (
                  templates.selQuestions.map(q => {
                    const options = Array.isArray(q.options) ? q.options : [];
                    return (
                      <div key={q.id} className="border-b border-outline-variant/10 pb-3">
                        <label className="text-sm font-medium text-on-surface mb-1.5 block">
                          Q{q.order}. {q.questionText}
                        </label>
                        <select
                          value={assessmentFormData.selAnswers[q.id] || ""}
                          onChange={e => setAssessmentFormData(f => ({
                            ...f,
                            selAnswers: { ...f.selAnswers, [q.id]: e.target.value }
                          }))}
                          className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary w-full"
                        >
                          <option value="">Select...</option>
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
              <button type="button" onClick={() => { setModal(null); setEditingFormId(null); }} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : editingFormId ? "Update" : "Save Assessment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "assessment_templates" && (
        <Modal title="Assessment Templates" onClose={() => { setModal(null); setTemplateEditor(null); }}>
          <div className="space-y-5">
            <div className="flex gap-1 border-b border-outline-variant/20 pb-2 overflow-x-auto">
              {[
                ["fln", "FLN"],
                ["sel", "SEL"],
                ["subjects", "Subjects"]
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTemplateModalTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    templateModalTab === tab ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {templateModalTab === "fln" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-sm text-on-surface">FLN Categories</h4>
                  <button
                    type="button"
                    onClick={() => openTemplateEditor("fln-category", null, { order: templates.flnCategories.length + 1 })}
                    className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Category
                  </button>
                </div>
                {templates.flnCategories.length === 0 ? (
                  <p className="text-xs text-on-surface-variant p-3 border border-outline-variant/20 rounded-lg">No FLN categories configured.</p>
                ) : (
                  <div className="space-y-3">
                    {templates.flnCategories.map(cat => (
                      <div key={cat.id} className="border border-outline-variant/20 rounded-lg">
                        <div className="flex items-center justify-between gap-3 p-3 bg-surface-container-low border-b border-outline-variant/10">
                          <div>
                            <p className="font-semibold text-sm text-on-surface">{cat.name}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Order {cat.order}</p>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => openTemplateEditor("fln-category", cat)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                            <button type="button" onClick={() => setTemplateDelete({ type: "fln-category", id: cat.id, label: cat.name })} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {(cat.questions || []).map(q => (
                            <div key={q.id} className="flex items-start justify-between gap-3 text-xs">
                              <span className="text-on-surface-variant flex-1">Q{q.order}. {q.questionText} ({q.marks} mark{q.marks === 1 ? "" : "s"})</span>
                              <div className="flex gap-1 shrink-0">
                                <button type="button" onClick={() => openTemplateEditor("fln-question", q, { categoryId: cat.id })} className="p-0.5 hover:text-primary cursor-pointer text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px]">edit</span>
                                </button>
                                <button type="button" onClick={() => setTemplateDelete({ type: "fln-question", id: q.id, label: q.questionText })} className="p-0.5 hover:text-error cursor-pointer text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px]">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => openTemplateEditor("fln-question", null, { categoryId: cat.id, order: (cat.questions || []).length + 1 })}
                            className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">add</span>
                            Add Question
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {templateModalTab === "sel" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-sm text-on-surface">SEL Questions</h4>
                  <button type="button" onClick={() => openTemplateEditor("sel-question", null, { order: templates.selQuestions.length + 1 })} className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Question
                  </button>
                </div>
                {templates.selQuestions.length === 0 ? (
                  <p className="text-xs text-on-surface-variant p-3 border border-outline-variant/20 rounded-lg">No SEL questions configured.</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10 border border-outline-variant/20 rounded-lg max-h-[55vh] overflow-y-auto">
                    {templates.selQuestions.map(q => (
                      <div key={q.id} className="flex items-start justify-between gap-3 p-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-on-surface">Q{q.order}. {q.questionText}</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">{(q.options || []).join(", ")}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => openTemplateEditor("sel-question", q)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setTemplateDelete({ type: "sel-question", id: q.id, label: q.questionText })} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {templateModalTab === "subjects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-sm text-on-surface">Subject Templates</h4>
                  <button type="button" onClick={() => openTemplateEditor("subject", null, { order: templates.subjectTemplates.length + 1 })} className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Subject
                  </button>
                </div>
                {templates.subjectTemplates.length === 0 ? (
                  <p className="text-xs text-on-surface-variant p-3 border border-outline-variant/20 rounded-lg">No subject templates configured.</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10 border border-outline-variant/20 rounded-lg">
                    {templates.subjectTemplates.map(st => (
                      <div key={st.id} className="flex items-start justify-between gap-3 p-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-on-surface">{st.name}</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">{(st.options || []).join(", ")}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => openTemplateEditor("subject", st)} className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button type="button" onClick={() => setTemplateDelete({ type: "subject", id: st.id, label: st.name })} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {templateEditor && (
        <Modal
          title={`${templateEditor.id ? "Edit" : "Add"} ${
            templateEditor.type === "fln-category" ? "FLN Category" :
            templateEditor.type === "fln-question" ? "FLN Question" :
            templateEditor.type === "sel-question" ? "SEL Question" : "Subject Template"
          }`}
          onClose={() => setTemplateEditor(null)}
        >
          <form onSubmit={handleTemplateSave} className="space-y-4">
            {templateEditor.type === "fln-category" && (
              <InputField label="Category Name" name="name" value={templateEditor.name} onChange={e => setTemplateEditor(f => ({ ...f, name: e.target.value }))} required />
            )}

            {templateEditor.type === "fln-question" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Category</label>
                  <select
                    value={templateEditor.categoryId}
                    onChange={e => setTemplateEditor(f => ({ ...f, categoryId: e.target.value }))}
                    required
                    className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">Select category</option>
                    {templates.flnCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Question Text</label>
                  <textarea rows="3" value={templateEditor.questionText} onChange={e => setTemplateEditor(f => ({ ...f, questionText: e.target.value }))} required className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Marks</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={templateEditor.marks}
                    onChange={e => setTemplateEditor(f => ({ ...f, marks: e.target.value }))}
                    required
                    className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </>
            )}

            {templateEditor.type === "sel-question" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Question Text</label>
                <textarea rows="3" value={templateEditor.questionText} onChange={e => setTemplateEditor(f => ({ ...f, questionText: e.target.value }))} required className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
            )}

            {templateEditor.type === "subject" && (
              <InputField label="Subject Name" name="name" value={templateEditor.name} onChange={e => setTemplateEditor(f => ({ ...f, name: e.target.value }))} required />
            )}

            <InputField label="Order" name="order" type="number" value={templateEditor.order} onChange={e => setTemplateEditor(f => ({ ...f, order: e.target.value }))} />

            {(templateEditor.type === "sel-question" || templateEditor.type === "subject") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Dropdown Options</label>
                  <button type="button" onClick={addTemplateOption} className="text-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    Add Option
                  </button>
                </div>
                {(templateEditor.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input value={option} onChange={e => updateTemplateOption(index, e.target.value)} className="flex-1 px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
                    <button type="button" onClick={() => removeTemplateOption(index)} className="p-2 hover:bg-error-container rounded-full cursor-pointer text-error">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
              <button type="button" onClick={() => setTemplateEditor(null)} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transition Modal */}
      {modal === "transition" && (
        <Modal title={editTransitionId ? "Edit Transition" : "Add Transition Record"} onClose={() => { setModal(null); setEditTransitionId(null); setTransitionForm({ academicYear: "", month: "", status: "CONTINUING_EDUCATION", description: "", location: "" }); }}>
          <form onSubmit={handleTransitionSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Academic Year" name="academicYear" value={transitionForm.academicYear} onChange={e => setTransitionForm(f => ({ ...f, academicYear: e.target.value }))} options={["", ...academicYearOptions]} />
              <InputField label="Month" name="month" value={transitionForm.month} onChange={e => setTransitionForm(f => ({ ...f, month: e.target.value }))} options={["", ...academicMonths]} />
            </div>
            <InputField label="Status" name="status" value={transitionForm.status} onChange={e => setTransitionForm(f => ({ ...f, status: e.target.value }))}
              options={["CONTINUING_EDUCATION", "ENROLLED_COLLEGE", "WORKING", "DROPOUT", "OTHER"]} />
            {transitionForm.status === "OTHER" && (
              <InputField label="Describe (Other)" name="description" value={transitionForm.description} onChange={e => setTransitionForm(f => ({ ...f, description: e.target.value }))} />
            )}
            {transitionForm.status !== "OTHER" && (
              <InputField label="Description" name="description" value={transitionForm.description} onChange={e => setTransitionForm(f => ({ ...f, description: e.target.value }))} />
            )}
            <InputField label="Location" name="location" value={transitionForm.location} onChange={e => setTransitionForm(f => ({ ...f, location: e.target.value }))} />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setModal(null); setEditTransitionId(null); }} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : editTransitionId ? "Update" : "Add Transition"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Link Beneficiary Modal */}
      {modal === "linkBeneficiary" && (
        <Modal title="Link to Beneficiary" onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4">Search and select a beneficiary to link this student to.</p>
          <input type="text" placeholder="Search beneficiaries..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4" />
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {beneficiaries
              .filter(b => b.name.toLowerCase().includes(searchQ.toLowerCase()) || b.enrolmentId?.includes(searchQ))
              .map(b => (
                <button key={b.id}
                  onClick={() => handleLinkBeneficiary(b.id)}
                  className="w-full text-left p-3 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer text-sm font-sans"
                >
                  <span className="font-semibold text-on-surface">{b.name}</span>
                  <span className="text-xs text-on-surface-variant ml-2">{b.enrolmentId}</span>
                </button>
              ))}
          </div>
        </Modal>
      )}

      <ConfirmActionModal
        isOpen={showConfirmMigrate}
        onClose={() => setShowConfirmMigrate(false)}
        onConfirm={handleToggleMigrated}
        title={student.isMigrated ? "Unmark as Migrated" : "Mark as Migrated"}
        message={student.isMigrated ? "Are you sure you want to unmark this student as migrated?" : "Are you sure you want to mark this student as migrated?"}
        confirmText={student.isMigrated ? "Unmark" : "Mark as Migrated"}
        variant="primary"
      />

      <ConfirmActionModal
        isOpen={!!templateDelete}
        onClose={() => setTemplateDelete(null)}
        onConfirm={handleTemplateDelete}
        title="Delete Template Item"
        message={`Delete "${templateDelete?.label || "this item"}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

    </div>
  );
}
