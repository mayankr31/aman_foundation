"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

function InputField({ label, name, value, onChange, type = "text", required = false, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      {options ? (
        <select name={name} value={value} onChange={onChange}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
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

export default function SchoolProfileDetail() {
  const { id } = useParams();
  const { token, isInitializing } = useAuth();
  const toast = useToast();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // 'edit' | 'students' | 'fellows' | 'programs' | 'attendance'

  // For assignment modals
  const [allStudents, setAllStudents] = useState([]);
  const [allFellows, setAllFellows] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [searchQ, setSearchQ] = useState("");

  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceSelection, setAttendanceSelection] = useState(new Set());
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [attendanceReviewMode, setAttendanceReviewMode] = useState(false);
  const [attendanceAction, setAttendanceAction] = useState(""); // "Present" or "Absent"
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState({});

  const [includeLearningAssessment, setIncludeLearningAssessment] = useState(false);
  const [includeHomework, setIncludeHomework] = useState(false);
  const [learningAssessmentMap, setLearningAssessmentMap] = useState({});
  const [homeworkMap, setHomeworkMap] = useState({});

  const [editForm, setEditForm] = useState({});

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const loadSchool = useCallback(async () => {
    try {
      const res = await fetch(`/api/schools/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (json.success) {
        const s = json.data;
        setSchool(s);
        setEditForm({
          name: s.name || "",
          principalName: s.principalName || "",
          udiseCode: s.udiseCode || "",
          email: s.email || "",
          phone: s.phone || "",
          address: s.address || "",
          location: s.location || "",
          status: s.status || "Active",
          mapUrl: s.mapUrl || "",
          goal: s.goal || 80,
        });
      }
    } catch (err) { console.error("Failed to load school:", err); }
    finally { setLoading(false); }
  }, [id, token]);

  useEffect(() => {
    if (!isInitializing) {
      loadSchool();
    }
  }, [loadSchool, isInitializing]);

  // Load relevant lists when modals open
  useEffect(() => {
    if (!modal) return;
    const h = token ? { Authorization: `Bearer ${token}` } : {};
    if (modal === "students") {
      fetch("/api/students", { headers: h }).then(r => r.json()).then(j => { if (j.success) setAllStudents(j.data); });
    }
    if (modal === "fellows") {
      fetch("/api/fellows", { headers: h }).then(r => r.json()).then(j => { if (j.success) setAllFellows(j.data); });
    }
    if (modal === "programs") {
      fetch("/api/programs", { headers: h }).then(r => r.json()).then(j => { if (j.success) setAllPrograms(j.data); });
    }
  }, [modal, token]);

  const loadExistingAttendance = useCallback(async (date) => {
    if (!date) return;
    try {
      const res = await fetch(`/api/schools/${id}/attendance?date=${date}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setIsEditingAttendance(true);
        const presentIds = new Set(json.data.filter(d => d.status === "Present" || d.status === "Late" || d.status === "Excused").map(d => d.studentId));
        setAttendanceSelection(presentIds);
        setViewOnlyMode(true);
      } else {
        setIsEditingAttendance(false);
        setAttendanceSelection(new Set(school?.students?.map(s => s.id) || []));
        setViewOnlyMode(false);
      }
      if (json.learningAssessments && json.learningAssessments.length > 0) {
        const laMap = {};
        json.learningAssessments.forEach(a => { laMap[a.studentId] = a.canRead; });
        setLearningAssessmentMap(laMap);
        setIncludeLearningAssessment(true);
      } else {
        setLearningAssessmentMap({});
        setIncludeLearningAssessment(false);
      }
      if (json.homework && json.homework.length > 0) {
        const hwMap = {};
        json.homework.forEach(h => { hwMap[h.studentId] = h.homeworkStatus; });
        setHomeworkMap(hwMap);
        setIncludeHomework(true);
      } else {
        setHomeworkMap({});
        setIncludeHomework(false);
      }
    } catch (err) {
      console.error("Failed to load existing attendance");
    }
  }, [id, authHeaders, school?.students]);

  const loadCalendarData = useCallback(async () => {
    try {
      const res = await fetch(`/api/schools/${id}/attendance/calendar?month=${currentMonth}&year=${currentYear}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const dataMap = {};
        json.data.forEach(d => { dataMap[d.date] = d; });
        setCalendarData(dataMap);
      }
    } catch (err) {
      console.error("Failed to load calendar data", err);
    }
  }, [id, currentMonth, currentYear, authHeaders]);

  useEffect(() => {
    if (school) {
      loadCalendarData();
    }
  }, [school, loadCalendarData]);

  useEffect(() => {
    if (modal === "attendance" && attendanceDate && !attendanceReviewMode) {
      loadExistingAttendance(attendanceDate);
    }
  }, [attendanceDate, modal, attendanceReviewMode, loadExistingAttendance]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleEditSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/schools/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(editForm) });
      const json = await res.json();
      if (json.success) { await loadSchool(); setModal(null); toast.success("Profile saved"); }
      else { toast.error(json.error || "Failed to save"); alert(json.error || "Failed to save"); }
    } finally { setSaving(false); }
  }

  async function handleAssignStudent(studentId) {
    await fetch(`/api/schools/${id}/students`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ studentId }) });
    await loadSchool();
  }

  async function handleRemoveStudent(studentId) {
    if (!confirm("Remove this student from the school?")) return;
    await fetch(`/api/schools/${id}/students`, { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ studentId }) });
    await loadSchool();
  }

  async function handleAssignFellow(fellowId) {
    await fetch(`/api/schools/${id}/fellows`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ fellowId }) });
    await loadSchool();
  }

  async function handleRemoveFellow(fellowId) {
    if (!confirm("Remove this fellow from the school?")) return;
    await fetch(`/api/schools/${id}/fellows`, { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ fellowId }) });
    await loadSchool();
  }

  async function handleAssignProgram(programId) {
    await fetch(`/api/schools/${id}/programs`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ programId }) });
    await loadSchool();
  }

  async function handleRemoveProgram(programId) {
    if (!confirm("Remove this program from the school?")) return;
    await fetch(`/api/schools/${id}/programs`, { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ programId }) });
    await loadSchool();
  }

  function handleReviewAttendance(e, statusAction) {
    e.preventDefault();
    setAttendanceAction(statusAction);
    setAttendanceReviewMode(true);
  }

  async function handleConfirmAttendance() {
    setSaving(true);
    try {
      const studentStatuses = (school?.students || []).map(s => ({
        studentId: s.id,
        status: attendanceSelection.has(s.id) ? attendanceAction : (attendanceAction === "Present" ? "Absent" : "Present")
      }));
      const body = { date: attendanceDate, studentStatuses };
      if (includeLearningAssessment) {
        body.learningAssessments = (school?.students || []).map(s => ({
          studentId: s.id,
          canRead: !!learningAssessmentMap[s.id]
        }));
      }
      if (includeHomework) {
        body.homework = (school?.students || []).map(s => ({
          studentId: s.id,
          status: homeworkMap[s.id] || "NO_HOMEWORK"
        }));
      }
      const res = await fetch(`/api/schools/${id}/attendance`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isEditingAttendance ? "Attendance updated successfully!" : "Attendance marked successfully!");
        setModal(null);
        setAttendanceReviewMode(false);
        await loadSchool();
        await loadCalendarData();
      } else {
        toast.error(json.error || "Failed to mark attendance");
      }
    } catch (err) {
      toast.error("An error occurred while marking attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (isInitializing || loading) return (
    <div className="p-8 flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!school) return <div className="p-8 text-center text-on-surface-variant font-medium">School not found</div>;

  const enrolledStudents = school.students || [];
  const assignedFellows = school.fellows || [];
  const assignedPrograms = school.programs || [];
  const { totalEnrolled = 0, genderRatio = {} } = school;
  const maleCount = genderRatio.male || 0;
  const femaleCount = genderRatio.female || 0;
  const malePercent = totalEnrolled > 0 ? Math.round((maleCount / totalEnrolled) * 100) : 0;
  const femalePercent = totalEnrolled > 0 ? Math.round((femaleCount / totalEnrolled) * 100) : 0;

  const schoolStudentIds = new Set(enrolledStudents.map(s => s.id));
  const schoolFellowIds = new Set(assignedFellows.map(f => f.fellowId));
  const schoolProgramIds = new Set(assignedPrograms.map(p => p.programId));

  const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.studentId?.includes(searchQ));
  const filteredFellows = allFellows.filter(f => f.name.toLowerCase().includes(searchQ.toLowerCase()));
  const filteredPrograms = allPrograms.filter(p => p.title.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back */}
      <Link href="/education/schools" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Schools Directory</span>
      </Link>

      {/* Hero Header */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          {school.img ? (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-surface-container overflow-hidden shrink-0 border-4 border-surface shadow-md">
              <img alt="School" className="w-full h-full object-cover" src={school.img} />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center text-4xl font-bold shrink-0 border-4 border-surface shadow-md">
              {school.name[0]}
            </div>
          )}
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize leading-tight">{school.name}</h2>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${school.status === "Active" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container text-on-surface-variant"}`}>
                {school.status}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {school.location} • Regional Impact Partner
            </p>
            <div className="flex flex-col gap-2 mt-2 text-xs font-medium text-slate-500 font-sans">
              <div className="flex flex-wrap gap-4">
                <div><span className="font-bold text-on-surface">Principal:</span> {school.principalName || "—"}</div>
                <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                <div><span className="font-bold text-on-surface">UDISE Code:</span> {school.udiseCode || "—"}</div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div><span className="font-bold text-on-surface">Email:</span> {school.email || "—"}</div>
                <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                <div><span className="font-bold text-on-surface">Phone:</span> {school.phone || "—"}</div>
              </div>
              {school.address && <div><span className="font-bold text-on-surface">Address:</span> {school.address}</div>}
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start flex-wrap">
          <button onClick={() => setModal("edit")}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profile
          </button>
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span> Export Report
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Map & Programs */}
        <div className="lg:col-span-8 space-y-8">

          {/* Map */}
          {school.mapUrl && (
            <div className="bg-surface-container-lowest rounded-xl p-2 shadow-ambient border border-outline-variant/10">
              <div className="relative w-full h-[280px] rounded-lg overflow-hidden bg-surface-container-low">
                <iframe src={school.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-full"></iframe>
              </div>
            </div>
          )}

          {/* Programs */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">campaign</span>
                Active Program Participation
              </h3>
              <button onClick={() => { setModal("programs"); setSearchQ(""); }}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">add</span> Manage Programs
              </button>
            </div>
            {assignedPrograms.length === 0 ? (
              <p className="text-center py-8 text-on-surface-variant font-sans text-sm">No programs linked. Click "Manage Programs" to add one.</p>
            ) : (
              <div className="space-y-4">
                {assignedPrograms.map(({ program, programId }) => (
                  <div key={programId} className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{program.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{program.description}</p>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${program.status === "Active" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container text-on-surface-variant"}`}>
                        {program.status}
                      </span>
                      <Link href={`/education/pta/program/${programId}`} className="text-xs text-primary hover:underline font-medium">View</Link>
                      <button onClick={() => handleRemoveProgram(programId)} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                        <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Attendance Calendar */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  Daily Attendance
                </h3>
                {(() => {
                  const todayForAvg = new Date();
                  const isCurrentMonthAvg = todayForAvg.getFullYear() === currentYear && (todayForAvg.getMonth() + 1) === currentMonth;
                  const isFutureMonthAvg = currentYear > todayForAvg.getFullYear() || (currentYear === todayForAvg.getFullYear() && currentMonth > (todayForAvg.getMonth() + 1));
                  
                  if (isFutureMonthAvg) return null;
                  
                  const lastDayToCount = isCurrentMonthAvg ? todayForAvg.getDate() : new Date(currentYear, currentMonth, 0).getDate();
                  let totalPresent = 0;
                  let totalStudents = 0;
                  
                  for (let i = 1; i <= lastDayToCount; i++) {
                    const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    if (calendarData[dStr]) {
                      totalPresent += calendarData[dStr].present;
                      totalStudents += calendarData[dStr].total;
                    }
                  }
                  
                  const averageAttendance = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
                  return (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      MTD Avg: {averageAttendance}%
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => {
                  if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
                  else { setCurrentMonth(currentMonth - 1); }
                }} className="p-1 hover:bg-surface-container rounded-full cursor-pointer transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="font-bold text-on-surface text-sm w-32 text-center">
                  {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => {
                  if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
                  else { setCurrentMonth(currentMonth + 1); }
                }} className="p-1 hover:bg-surface-container rounded-full cursor-pointer transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-on-surface-variant py-2 uppercase tracking-wider">{day}</div>
              ))}
              {Array.from({ length: new Date(currentYear, currentMonth - 1, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              {Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }).map((_, i) => {
                const dateNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
                const dayData = calendarData[dateStr];
                
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                
                return (
                  <button 
                    key={dateNum}
                    onClick={() => { setModal("attendance"); setAttendanceDate(dateStr); setAttendanceReviewMode(false); setSearchQ(""); setIncludeLearningAssessment(false); setIncludeHomework(false); setLearningAssessmentMap({}); setHomeworkMap({}); }}
                    className={`aspect-square p-2 rounded-lg border flex flex-col items-center justify-center transition-colors cursor-pointer relative ${dayData ? 'border-primary/30 hover:border-primary/60 bg-surface-container-lowest' : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-low/20'} ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest font-bold !border-primary' : ''}`}
                  >
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-on-surface'}`}>{dateNum}</span>
                    {dayData && (
                      <span className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full ${dayData.percentage >= 80 ? 'bg-primary/20 text-primary' : dayData.percentage >= 50 ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>
                        {dayData.percentage}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enrolled Students */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Enrolled Students ({totalEnrolled})
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { setModal("students"); setSearchQ(""); }}
                  className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span> Manage Students
                </button>
              </div>
            </div>
            {enrolledStudents.length === 0 ? (
              <p className="text-center py-8 text-on-surface-variant font-sans text-sm">No students enrolled. Click "Manage Students" to assign.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Student ID</th>
                      <th className="py-3 px-3">Grade</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Risk</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(s => (
                      <tr key={s.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-3">
                          <Link href={`/education/students/${s.id}`} className="font-semibold text-primary hover:underline">{s.name}</Link>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">{s.studentId}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{s.grade}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${s.status === "On Track" ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {(() => {
                            const att = s.attendance || 0;
                            let risk = "Low";
                            let color = "bg-primary/10 text-primary";
                            if (att < 35) { risk = "High"; color = "bg-error/10 text-error"; }
                            else if (att < 60) { risk = "Med"; color = "bg-yellow-500/10 text-yellow-600"; }
                            return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{risk}</span>;
                          })()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => handleRemoveStudent(s.id)} className="text-error hover:underline text-xs font-medium cursor-pointer">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metrics, Fellows */}
        <div className="lg:col-span-4 space-y-8">

          {/* School Metrics */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6">School Metrics</h3>
            <div className="space-y-4 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Total Enrolled</span>
                <span className="font-bold text-on-surface">{totalEnrolled} Students</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Enrollment Goal</span>
                <span className="font-bold text-on-surface">{school.goal} Students</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Active Fellows</span>
                <span className="font-bold text-primary">{assignedFellows.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Active Programs</span>
                <span className="font-bold text-primary">{assignedPrograms.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">At Risk ({enrolledStudents.filter(s => (s.attendance || 0) < 35).length})</span>
                <span className="font-bold text-error">{enrolledStudents.filter(s => (s.attendance || 0) < 35).length} Students</span>
              </div>
            </div>
          </div>

          {/* Gender Ratio */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Gender Ratio</h3>
            {totalEnrolled === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">No students enrolled yet.</p>
            ) : (
              <div className="space-y-4 font-sans text-sm">
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-primary">Male</span>
                    <span className="text-on-surface">{maleCount} ({malePercent}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${malePercent}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-secondary">Female</span>
                    <span className="text-on-surface">{femaleCount} ({femalePercent}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: `${femalePercent}%` }}></div>
                  </div>
                </div>
                {genderRatio.other > 0 && (
                  <div>
                    <div className="flex justify-between mb-1.5 font-medium">
                      <span className="text-tertiary">Other</span>
                      <span className="text-on-surface">{genderRatio.other} ({100 - malePercent - femalePercent}%)</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full" style={{ width: `${100 - malePercent - femalePercent}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assigned Fellows */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">people</span>
                Fellows ({assignedFellows.length})
              </h3>
              <button onClick={() => { setModal("fellows"); setSearchQ(""); }}
                className="bg-primary/10 text-primary p-1.5 rounded-full text-sm hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
            {assignedFellows.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">No fellows assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {assignedFellows.map(fs => (
                  <div key={fs.id} className="flex items-center justify-between py-2 border-b border-surface-container last:border-none font-sans text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                        {fs.fellow?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <Link href={`/education/fellows/${fs.fellowId}`} className="font-semibold text-primary hover:underline text-sm">
                          {fs.fellow?.name || "—"}
                        </Link>
                        <p className="text-xs text-on-surface-variant">{fs.fellow?.cohort || ""}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFellow(fs.fellowId)} className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error">
                      <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────────────── */}

      {/* Mark Attendance Modal */}
      {modal === "attendance" && (
        <Modal title={viewOnlyMode ? "Review Marked Attendance" : (isEditingAttendance ? "Edit Attendance" : "Bulk Mark Attendance")} onClose={() => { setModal(null); setAttendanceReviewMode(false); setViewOnlyMode(false); setIncludeLearningAssessment(false); setIncludeHomework(false); setLearningAssessmentMap({}); setHomeworkMap({}); }}>
          {viewOnlyMode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4 border-b border-outline-variant/20 pb-4">
                <h4 className="font-bold text-lg text-on-surface">Date: {attendanceDate}</h4>
                <button type="button" onClick={() => setViewOnlyMode(false)} className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors cursor-pointer text-sm">
                  Edit Attendance
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low">
                  <h5 className="font-bold text-primary mb-2 border-b border-outline-variant/20 pb-2">Present ({attendanceSelection.size})</h5>
                  <ul className="text-sm space-y-1 max-h-64 overflow-y-auto pl-4 list-disc text-on-surface-variant">
                    {enrolledStudents.filter(s => attendanceSelection.has(s.id)).map(s => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low">
                  <h5 className="font-bold text-error mb-2 border-b border-outline-variant/20 pb-2">Absent ({enrolledStudents.length - attendanceSelection.size})</h5>
                  <ul className="text-sm space-y-1 max-h-64 overflow-y-auto pl-4 list-disc text-on-surface-variant">
                    {enrolledStudents.filter(s => !attendanceSelection.has(s.id)).map(s => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {includeLearningAssessment && Object.keys(learningAssessmentMap).length > 0 && (
                <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low">
                  <h5 className="font-bold text-secondary mb-2 border-b border-outline-variant/20 pb-2">Learning Assessment &mdash; Can Read</h5>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {enrolledStudents.map(s => (
                      <div key={s.id} className="text-sm flex items-center gap-2">
                        <span className={learningAssessmentMap[s.id] ? "text-primary font-bold" : "text-on-surface-variant"}>{learningAssessmentMap[s.id] ? "✓" : "✗"}</span>
                        <span className="text-on-surface-variant truncate">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {includeHomework && Object.keys(homeworkMap).length > 0 && (
                <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low">
                  <h5 className="font-bold text-secondary mb-2 border-b border-outline-variant/20 pb-2">Homework Status</h5>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {enrolledStudents.map(s => {
                      const hw = homeworkMap[s.id];
                      const color = hw === "DONE" ? "text-primary" : hw === "NOT_DONE" ? "text-error" : "text-on-surface-variant";
                      const label = hw === "DONE" ? "Done" : hw === "NOT_DONE" ? "Not Done" : "No HW";
                      return (
                        <div key={s.id} className="text-xs flex items-center gap-1">
                          <span className={`font-semibold ${color}`}>{label}</span>
                          <span className="text-on-surface-variant truncate">{s.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4 mt-4 border-t border-outline-variant/20">
                <button type="button" onClick={() => { setModal(null); setViewOnlyMode(false); }} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm font-semibold">Close</button>
              </div>
            </div>
          ) : !attendanceReviewMode ? (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <InputField label="Attendance Date" name="date" type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} required />
              </div>
              <p className="text-sm text-on-surface-variant mb-4">Select students below, then choose an action. Unselected students will be marked with the opposite status.</p>
              <input type="text" placeholder="Search enrolled students..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-2" />
              
              <div className="flex items-center gap-2 mb-2 text-sm">
                <button type="button" className="text-primary font-medium hover:underline cursor-pointer" onClick={() => setAttendanceSelection(new Set(enrolledStudents.map(s => s.id)))}>Select All</button>
                <span className="text-on-surface-variant">|</span>
                <button type="button" className="text-primary font-medium hover:underline cursor-pointer" onClick={() => setAttendanceSelection(new Set())}>Clear All</button>
                <span className="ml-auto font-bold text-on-surface">{attendanceSelection.size} selected</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-4 border border-outline-variant/30 rounded-lg p-2">
                {enrolledStudents.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.studentId?.includes(searchQ)).map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors">
                    <input type="checkbox" checked={attendanceSelection.has(s.id)} onChange={(e) => {
                      const newSet = new Set(attendanceSelection);
                      if (e.target.checked) newSet.add(s.id);
                      else newSet.delete(s.id);
                      setAttendanceSelection(newSet);
                    }} className="w-4 h-4 text-primary focus:ring-primary border-outline-variant rounded" />
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{s.name}</p>
                      <p className="text-xs text-on-surface-variant">{s.studentId} • Grade {s.grade}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Learning Assessment Toggle */}
              <div className="border border-outline-variant/30 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={includeLearningAssessment} onChange={(e) => {
                    setIncludeLearningAssessment(e.target.checked);
                    if (!e.target.checked) setLearningAssessmentMap({});
                  }} className="w-4 h-4 text-secondary focus:ring-secondary border-outline-variant rounded" />
                  <span className="text-sm font-semibold text-on-surface">Mark Learning Assessment</span>
                  <span className="text-xs text-on-surface-variant">— "Was the student able to read?"</span>
                </label>
                {includeLearningAssessment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <button type="button" className="text-primary font-medium hover:underline cursor-pointer" onClick={() => {
                        const map = {};
                        enrolledStudents.forEach(s => { map[s.id] = true; });
                        setLearningAssessmentMap(map);
                      }}>Mark All: Can Read</button>
                      <span className="text-on-surface-variant">|</span>
                      <button type="button" className="text-error font-medium hover:underline cursor-pointer" onClick={() => {
                        const map = {};
                        enrolledStudents.forEach(s => { map[s.id] = false; });
                        setLearningAssessmentMap(map);
                      }}>Mark All: Cannot Read</button>
                      <span className="ml-auto text-on-surface-variant">
                        {Object.values(learningAssessmentMap).filter(v => v === true).length} can read
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {enrolledStudents.map(s => (
                        <label key={s.id} className="flex items-center gap-2 text-xs p-1.5 hover:bg-surface-container rounded cursor-pointer">
                          <input type="checkbox" checked={!!learningAssessmentMap[s.id]} onChange={(e) => {
                            const map = { ...learningAssessmentMap };
                            map[s.id] = e.target.checked;
                            setLearningAssessmentMap(map);
                          }} className="w-3.5 h-3.5 text-secondary focus:ring-secondary border-outline-variant rounded" />
                          <span className="truncate text-on-surface-variant">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Homework Toggle */}
              <div className="border border-outline-variant/30 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={includeHomework} onChange={(e) => {
                    setIncludeHomework(e.target.checked);
                    if (!e.target.checked) setHomeworkMap({});
                  }} className="w-4 h-4 text-secondary focus:ring-secondary border-outline-variant rounded" />
                  <span className="text-sm font-semibold text-on-surface">Mark Homework</span>
                </label>
                {includeHomework && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <button type="button" className="text-primary font-medium hover:underline cursor-pointer" onClick={() => {
                        const map = { ...homeworkMap };
                        enrolledStudents.forEach(s => { map[s.id] = "DONE"; });
                        setHomeworkMap(map);
                      }}>All: Done</button>
                      <span className="text-on-surface-variant">|</span>
                      <button type="button" className="text-error font-medium hover:underline cursor-pointer" onClick={() => {
                        const map = { ...homeworkMap };
                        enrolledStudents.forEach(s => { map[s.id] = "NOT_DONE"; });
                        setHomeworkMap(map);
                      }}>All: Not Done</button>
                      <span className="text-on-surface-variant">|</span>
                      <button type="button" className="text-on-surface-variant font-medium hover:underline cursor-pointer" onClick={() => {
                        const map = { ...homeworkMap };
                        enrolledStudents.forEach(s => { map[s.id] = "NO_HOMEWORK"; });
                        setHomeworkMap(map);
                      }}>All: No Homework</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {enrolledStudents.map(s => {
                        const hw = homeworkMap[s.id] || "NO_HOMEWORK";
                        return (
                          <div key={s.id} className="flex items-center gap-2 text-xs p-1.5">
                            <select value={hw} onChange={(e) => {
                              const map = { ...homeworkMap };
                              map[s.id] = e.target.value;
                              setHomeworkMap(map);
                            }} className="text-xs border border-outline-variant rounded px-1 py-0.5 bg-surface text-on-surface focus:outline-none focus:border-primary w-20">
                              <option value="NO_HOMEWORK">No HW</option>
                              <option value="DONE">Done</option>
                              <option value="NOT_DONE">Not Done</option>
                            </select>
                            <span className="truncate text-on-surface-variant">{s.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button type="button" onClick={() => { setModal(null); setAttendanceReviewMode(false); }} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
                <div className="flex gap-2">
                  <button type="button" disabled={!attendanceDate} onClick={(e) => handleReviewAttendance(e, "Absent")} className="px-5 py-2 rounded-full bg-error text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                    Review as Absent
                  </button>
                  <button type="button" disabled={!attendanceDate} onClick={(e) => handleReviewAttendance(e, "Present")} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                    Review as Present
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-on-surface mb-2">Review Attendance - {attendanceDate}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-outline-variant/30 rounded-lg p-3">
                  <h5 className="font-bold text-primary mb-2 border-b border-outline-variant/20 pb-2">Present ({attendanceAction === "Present" ? attendanceSelection.size : enrolledStudents.length - attendanceSelection.size})</h5>
                  <ul className="text-sm space-y-1 max-h-48 overflow-y-auto pl-4 list-disc text-on-surface-variant">
                    {enrolledStudents.filter(s => (attendanceAction === "Present" ? attendanceSelection.has(s.id) : !attendanceSelection.has(s.id))).map(s => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="border border-outline-variant/30 rounded-lg p-3">
                  <h5 className="font-bold text-error mb-2 border-b border-outline-variant/20 pb-2">Absent ({attendanceAction === "Absent" ? attendanceSelection.size : enrolledStudents.length - attendanceSelection.size})</h5>
                  <ul className="text-sm space-y-1 max-h-48 overflow-y-auto pl-4 list-disc text-on-surface-variant">
                    {enrolledStudents.filter(s => (attendanceAction === "Absent" ? attendanceSelection.has(s.id) : !attendanceSelection.has(s.id))).map(s => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {includeLearningAssessment && (
                <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low">
                  <h5 className="font-bold text-secondary mb-2 border-b border-outline-variant/20 pb-2">Learning Assessment</h5>
                  <p className="text-sm text-on-surface-variant">
                    Can Read: {Object.values(learningAssessmentMap).filter(v => v === true).length} of {enrolledStudents.length} students
                    &middot; Cannot Read: {Object.values(learningAssessmentMap).filter(v => v === false).length} of {enrolledStudents.length}
                  </p>
                </div>
              )}

              {includeHomework && (
                <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low">
                  <h5 className="font-bold text-secondary mb-2 border-b border-outline-variant/20 pb-2">Homework</h5>
                  <p className="text-sm text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1">
                    <span>Done: {Object.values(homeworkMap).filter(v => v === "DONE").length}</span>
                    <span>Not Done: {Object.values(homeworkMap).filter(v => v === "NOT_DONE").length}</span>
                    <span>No Homework: {Object.values(homeworkMap).filter(v => v === "NO_HOMEWORK").length}</span>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button type="button" disabled={saving} onClick={() => setAttendanceReviewMode(false)} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm disabled:opacity-50">Back</button>
                <button type="button" disabled={saving} onClick={handleConfirmAttendance} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                  {saving ? "Saving..." : (isEditingAttendance ? "Update Attendance" : "Mark Attendance")}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Edit School Profile */}
      {modal === "edit" && (
        <Modal title="Edit School Profile" onClose={() => setModal(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="School Name" name="name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              <InputField label="Principal / Headmaster Name" name="principalName" value={editForm.principalName} onChange={e => setEditForm(f => ({ ...f, principalName: e.target.value }))} />
              <InputField label="UDISE Code" name="udiseCode" value={editForm.udiseCode} onChange={e => setEditForm(f => ({ ...f, udiseCode: e.target.value }))} />
              <InputField label="Email" name="email" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              <InputField label="Phone" name="phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              <InputField label="Location/City" name="location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
              <InputField label="Status" name="status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} options={["Active", "Inactive", "Under Review"]} />
              <InputField label="Enrolment Goal" name="goal" type="number" value={editForm.goal} onChange={e => setEditForm(f => ({ ...f, goal: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Address</label>
              <textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} rows="2"
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Google Maps Embed URL</label>
              <input value={editForm.mapUrl} onChange={e => setEditForm(f => ({ ...f, mapUrl: e.target.value }))}
                placeholder="https://maps.google.com/embed?..."
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
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

      {/* Manage Students */}
      {modal === "students" && (
        <Modal title="Manage Students" onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4">Assign or remove students from this school. Unassigned students are highlighted.</p>
          <input type="text" placeholder="Search students..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4" />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudents.map(s => {
              const isAssigned = schoolStudentIds.has(s.id);
              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"}`}>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{s.name}</p>
                    <p className="text-xs text-on-surface-variant">{s.studentId} • {s.grade} • {s.schoolId ? (isAssigned ? "This School" : "Other School") : "Unassigned"}</p>
                  </div>
                  <button
                    onClick={() => isAssigned ? handleRemoveStudent(s.id) : handleAssignStudent(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${isAssigned ? "bg-error-container text-on-error-container hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                  >
                    {isAssigned ? "Remove" : "Assign"}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Manage Fellows */}
      {modal === "fellows" && (
        <Modal title="Manage Fellows" onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4">Assign or remove fellows from this school. A fellow can be in multiple schools.</p>
          <input type="text" placeholder="Search fellows..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4" />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredFellows.map(f => {
              const isAssigned = schoolFellowIds.has(f.id);
              return (
                <div key={f.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                      {f.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{f.name}</p>
                      <p className="text-xs text-on-surface-variant">Cohort: {f.cohort} • {f.email || "—"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => isAssigned ? handleRemoveFellow(f.id) : handleAssignFellow(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${isAssigned ? "bg-error-container text-on-error-container hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                  >
                    {isAssigned ? "Remove" : "Assign"}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Manage Programs */}
      {modal === "programs" && (
        <Modal title="Manage Programs" onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4">Assign or remove programs from this school.</p>
          <input type="text" placeholder="Search programs..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4" />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPrograms.map(p => {
              const isAssigned = schoolProgramIds.has(p.id);
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"}`}>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{p.title}</p>
                    <p className="text-xs text-on-surface-variant">{p.status} • {p.duration || "—"}</p>
                  </div>
                  <button
                    onClick={() => isAssigned ? handleRemoveProgram(p.id) : handleAssignProgram(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${isAssigned ? "bg-error-container text-on-error-container hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                  >
                    {isAssigned ? "Remove" : "Assign"}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
