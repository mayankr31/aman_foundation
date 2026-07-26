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
  const { token, isInitializing } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // 'edit' | 'academic' | 'school' | 'attendance'
  const [showConfirmMigrate, setShowConfirmMigrate] = useState(false);
  const [schools, setSchools] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [learningAssessments, setLearningAssessments] = useState([]);
  const [homeworkRecords, setHomeworkRecords] = useState([]);
  const [assessmentDateFilter, setAssessmentDateFilter] = useState("");
  const [homeworkDateFilter, setHomeworkDateFilter] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);

  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [academicMonthFilter, setAcademicMonthFilter] = useState("");

  // Form states
  const [editForm, setEditForm] = useState({});
  const [transitionForm, setTransitionForm] = useState({ academicYear: "", month: "", status: "CONTINUING_EDUCATION", description: "", location: "" });
  const [editTransitionId, setEditTransitionId] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ subject: "", score: "", grade: "A+", academicYear: "", academicGrade: "", month: "", remarks: "" });
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({ assessmentName: "", topic: "", totalMarks: "", marksObtained: "", academicYear: "", academicGrade: "", month: "", remarks: "" });
  const [editAssessmentId, setEditAssessmentId] = useState(null);
  const [attendanceYearFilter, setAttendanceYearFilter] = useState("All Years");
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState("All Months");

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
        setSubjects(json.data.subjectMarks || []);
        setLearningAssessments(json.data.learningAssessments || []);
        setHomeworkRecords(json.data.homeworkRecords || []);
        setAssessments(json.data.assessments || []);
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

  // Fetch fresh subjects
  const reloadSubjects = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/subjects`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setSubjects(j.data);
  }, [id, token]);

  // Fetch fresh attendance
  const reloadAttendance = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/attendance`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setAttendanceLogs(j.data);
  }, [id, token]);

  // Fetch fresh assessments
  const reloadAssessments = useCallback(async () => {
    const res = await fetch(`/api/students/${id}/assessments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const j = await res.json();
    if (j.success) setAssessments(j.data);
  }, [id, token]);

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

  async function handleSubjectSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSubjectId) {
        await fetch(`/api/students/${id}/subjects`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ subjectMarkId: editSubjectId, ...subjectForm, score: parseFloat(subjectForm.score) })
        });
      } else {
        await fetch(`/api/students/${id}/subjects`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ ...subjectForm, score: parseFloat(subjectForm.score) })
        });
      }
      await reloadSubjects();
      setSubjectForm({ subject: "", score: "", grade: "A+", academicYear: "", academicGrade: "", month: "", remarks: "" });
      setEditSubjectId(null);
    } finally { setSaving(false); }
  }

  async function handleDeleteSubject(subjectMarkId) {
    if (!confirm("Delete this subject mark?")) return;
    await fetch(`/api/students/${id}/subjects`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ subjectMarkId })
    });
    await reloadSubjects();
  }

  async function handleAssessmentSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editAssessmentId) {
        await fetch(`/api/students/${id}/assessments`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ assessmentId: editAssessmentId, ...assessmentForm, totalMarks: parseFloat(assessmentForm.totalMarks), marksObtained: parseFloat(assessmentForm.marksObtained) })
        });
      } else {
        await fetch(`/api/students/${id}/assessments`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ ...assessmentForm, totalMarks: parseFloat(assessmentForm.totalMarks), marksObtained: parseFloat(assessmentForm.marksObtained) })
        });
      }
      await reloadAssessments();
      setAssessmentForm({ assessmentName: "", topic: "", totalMarks: "", marksObtained: "", academicYear: "", academicGrade: "", month: "", remarks: "" });
      setEditAssessmentId(null);
      setModal(null);
    } finally { setSaving(false); }
  }

  async function handleDeleteAssessment(assessmentId) {
    if (!confirm("Delete this assessment?")) return;
    await fetch(`/api/students/${id}/assessments`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ assessmentId })
    });
    await reloadAssessments();
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
  // Dynamic fellows from school (if assigned)
  const schoolFellows = student.school?.fellows || [];

  const gradeColor = (g) => {
    if (!g) return "bg-surface-container text-on-surface-variant";
    if (g.includes("A")) return "bg-primary/10 text-primary";
    if (g.includes("B")) return "bg-secondary-fixed text-on-secondary-container";
    return "bg-tertiary-container text-on-tertiary-container";
  };

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

  const filteredSubjects = subjects.filter(s => {
    if (!academicYearFilter && !academicMonthFilter) return true;
    let match = true;
    if (academicYearFilter) match = match && s.academicYear === academicYearFilter;
    if (academicMonthFilter) match = match && s.month === academicMonthFilter;
    return match;
  });

  const filteredAssessments = assessments.filter(a => {
    if (!academicYearFilter && !academicMonthFilter) return true;
    let match = true;
    if (academicYearFilter) match = match && a.academicYear === academicYearFilter;
    if (academicMonthFilter) match = match && a.month === academicMonthFilter;
    return match;
  });

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

          {/* Academic Progress */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Academic Progress &amp; Report Card
              </h3>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-6 pb-4 border-b border-outline-variant/20">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Academic Year</label>
                <select value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
                  <option value="">All Years</option>
                  {academicYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">Month</label>
                <select value={academicMonthFilter} onChange={(e) => setAcademicMonthFilter(e.target.value)}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
                  <option value="">All Months</option>
                  {academicMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex gap-2 ml-auto">
                {(() => {
                  const now = new Date();
                  const defMonth = now.toLocaleString('en-US', { month: 'short' });
                  const defYear = now.getFullYear();
                  const defAcademicYear = `${defYear - 1}-${defYear}`;
                  const defGrade = student.grade ? `Grade ${student.grade}` : "";
                  return (
                    <>
                      <button
                        onClick={() => {
                          setModal("academic"); setEditSubjectId(null);
                          setSubjectForm({ subject: "", score: "", grade: "A+", academicYear: defAcademicYear, academicGrade: defGrade, month: defMonth, remarks: "" });
                        }}
                        className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Subject
                      </button>
                      <button
                        onClick={() => {
                          setModal("assessment"); setEditAssessmentId(null);
                          setAssessmentForm({ assessmentName: "", topic: "", totalMarks: "", marksObtained: "", academicYear: defAcademicYear, academicGrade: defGrade, month: defMonth, remarks: "" });
                        }}
                        className="bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-secondary/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Assessment
                      </button>
                    </>
                  );
                })()}
            </div>
            </div>

            {/* Subject Marks */}
            <div className="mb-6">
              <h4 className="font-headline font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">book_4</span>
                Subject Marks {filteredSubjects.length > 0 && `(${filteredSubjects.length})`}
              </h4>
              {filteredSubjects.length === 0 ? (
                <p className="text-center py-4 text-on-surface-variant font-sans text-xs">No subject records for this period.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {filteredSubjects.map((sub) => (
                    <div key={sub.id} className="p-3 bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-on-surface text-sm">{sub.subject}</h4>
                          {sub.academicYear && <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{sub.academicYear}</span>}
                          {sub.month && <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{sub.month}</span>}
                        </div>
                        {sub.remarks && <p className="text-xs text-on-surface-variant mt-1">{sub.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0 font-sans">
                        <div className="text-right">
                          <p className="text-xs text-on-surface-variant font-medium">{sub.score} / 100</p>
                        </div>
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${gradeColor(sub.grade)}`}>
                          {sub.grade}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditSubjectId(sub.id); setSubjectForm({ subject: sub.subject, score: sub.score, grade: sub.grade, academicYear: sub.academicYear || "", academicGrade: sub.academicGrade || "", month: sub.month || "", remarks: sub.remarks || "" }); setModal("academic"); }}
                            className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessments */}
            <div>
              <h4 className="font-headline font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">quiz</span>
                Assessments {filteredAssessments.length > 0 && `(${filteredAssessments.length})`}
              </h4>
              {filteredAssessments.length === 0 ? (
                <p className="text-center py-4 text-on-surface-variant font-sans text-xs">No assessments for this period.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {filteredAssessments.map((asmt) => (
                    <div key={asmt.id} className="p-3 bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-on-surface text-sm">{asmt.assessmentName}</h4>
                          <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{asmt.topic}</span>
                          {asmt.month && <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{asmt.month}</span>}
                        </div>
                        {asmt.remarks && <p className="text-xs text-on-surface-variant mt-1">{asmt.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0 font-sans">
                        <div className="text-right">
                          <p className="text-xs text-on-surface-variant font-medium">{asmt.marksObtained} / {asmt.totalMarks}</p>
                          <div className="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                            <div className="bg-secondary h-full rounded-full" style={{ width: `${asmt.totalMarks > 0 ? Math.min(100, (asmt.marksObtained / asmt.totalMarks) * 100) : 0}%` }}></div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditAssessmentId(asmt.id); setAssessmentForm({ assessmentName: asmt.assessmentName, topic: asmt.topic, totalMarks: asmt.totalMarks, marksObtained: asmt.marksObtained, academicYear: asmt.academicYear || "", academicGrade: asmt.academicGrade || "", month: asmt.month || "", remarks: asmt.remarks || "" }); setModal("assessment"); }}
                            className="p-1 hover:bg-surface-container rounded-full cursor-pointer text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(asmt.id)}
                            className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

      {/* Academic Progress Modal */}
      {modal === "academic" && (
        <Modal title={editSubjectId ? "Edit Subject Mark" : "Add Subject Mark"} onClose={() => { setModal(null); setEditSubjectId(null); setSubjectForm({ subject: "", score: "", grade: "A+", academicYear: "", academicGrade: "", month: "", remarks: "" }); }}>
          <form onSubmit={handleSubjectSave} className="space-y-4">
            <InputField label="Subject" name="subject" value={subjectForm.subject} onChange={e => setSubjectForm(f => ({ ...f, subject: e.target.value }))} required />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Academic Grade</label>
                <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                  {student.grade ? `${student.grade}` : "—"}
                </span>
              </div>
              <InputField label="Academic Year" name="academicYear" value={subjectForm.academicYear} onChange={e => setSubjectForm(f => ({ ...f, academicYear: e.target.value }))} options={["", ...academicYearOptions]} />
              <InputField label="Month" name="month" value={subjectForm.month} onChange={e => setSubjectForm(f => ({ ...f, month: e.target.value }))} options={["", ...academicMonths]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Score (out of 100)" name="score" type="number" value={subjectForm.score} onChange={e => setSubjectForm(f => ({ ...f, score: e.target.value }))} required />
              <InputField label="Grade" name="grade" value={subjectForm.grade} onChange={e => setSubjectForm(f => ({ ...f, grade: e.target.value }))} options={["A+", "A", "B+", "B", "C+", "C", "D", "F"]} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Remarks</label>
              <textarea rows="3" value={subjectForm.remarks} onChange={e => setSubjectForm(f => ({ ...f, remarks: e.target.value }))} className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setModal(null); setEditSubjectId(null); }} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : editSubjectId ? "Update" : "Add Subject"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assessment Modal */}
      {modal === "assessment" && (
        <Modal title={editAssessmentId ? "Edit Assessment" : "Add Assessment"} onClose={() => { setModal(null); setEditAssessmentId(null); setAssessmentForm({ assessmentName: "", topic: "", totalMarks: "", marksObtained: "", academicYear: "", academicGrade: "", month: "", remarks: "" }); }}>
          <form onSubmit={handleAssessmentSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Assessment Name" name="assessmentName" value={assessmentForm.assessmentName} onChange={e => setAssessmentForm(f => ({ ...f, assessmentName: e.target.value }))} required />
              <InputField label="Topic" name="topic" value={assessmentForm.topic} onChange={e => setAssessmentForm(f => ({ ...f, topic: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Academic Grade</label>
                <span className="px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface text-sm font-semibold">
                  {student.grade ? `${student.grade}` : "—"}
                </span>
              </div>
              <InputField label="Academic Year" name="academicYear" value={assessmentForm.academicYear} onChange={e => setAssessmentForm(f => ({ ...f, academicYear: e.target.value }))} options={["", ...academicYearOptions]} />
              <InputField label="Month" name="month" value={assessmentForm.month} onChange={e => setAssessmentForm(f => ({ ...f, month: e.target.value }))} options={["", ...academicMonths]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Total Marks" name="totalMarks" type="number" value={assessmentForm.totalMarks} onChange={e => setAssessmentForm(f => ({ ...f, totalMarks: e.target.value }))} required />
              <InputField label="Marks Obtained" name="marksObtained" type="number" value={assessmentForm.marksObtained} onChange={e => setAssessmentForm(f => ({ ...f, marksObtained: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Remarks</label>
              <textarea rows="3" value={assessmentForm.remarks} onChange={e => setAssessmentForm(f => ({ ...f, remarks: e.target.value }))} className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setModal(null); setEditAssessmentId(null); }} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : editAssessmentId ? "Update" : "Add Assessment"}
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

    </div>
  );
}
