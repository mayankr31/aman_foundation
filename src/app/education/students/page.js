"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function StudentsModule() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [performanceFilter, setPerformanceFilter] = useState("All Performance");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [migratedFilter, setMigratedFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);

  // Form states for adding a student
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("Grade 8");
  const [newStudentGradeGroup, setNewStudentGradeGroup] = useState("Middle (6-8)");
  const [newStudentAttendance, setNewStudentAttendance] = useState("");
  const [newStudentStatus, setNewStudentStatus] = useState("On Track");

  useEffect(() => {
    async function loadData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [studRes, schRes] = await Promise.all([
          fetch("/api/students", { headers }),
          fetch("/api/schools", { headers })
        ]);
        const studJson = await studRes.json();
        const schJson = await schRes.json();
        if (studJson.success) setStudents(studJson.data);
        if (schJson.success) setSchools(schJson.data);
      } catch (err) {
        console.error("Failed to load students/schools data:", err);
      }
    }
    loadData();
  }, [token]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName || !newStudentSchool || !newStudentAttendance) return;

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          studentId: newStudentId || `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          name: newStudentName,
          schoolId: newStudentSchool,
          grade: newStudentGrade,
          gradeGroup: newStudentGradeGroup,
          attendance: parseFloat(newStudentAttendance),
          status: newStudentStatus,
          district: "Kalgachia"
        })
      });
      const json = await res.json();
      if (json.success) {
        const loadRes = await fetch("/api/students", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const loadJson = await loadRes.json();
        if (loadJson.success) {
          setStudents(loadJson.data);
        }
        setNewStudentName("");
        setNewStudentId("");
        setNewStudentSchool("");
        setNewStudentGrade("Grade 8");
        setNewStudentGradeGroup("Middle (6-8)");
        setNewStudentAttendance("");
        setNewStudentStatus("On Track");
        setShowAddModal(false);
      } else {
        alert(json.error || "Failed to add student");
      }
    } catch (err) {
      console.error("Failed to add student:", err);
    }
  };

  const clearFilters = () => {
    setGradeFilter("All Grades");
    setPerformanceFilter("All Performance");
    setSchoolFilter("All Schools");
    setMigratedFilter("All");
    setSearchQuery("");
  };

  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "ST";
  };

  const getBgClass = (name) => {
    const bgClasses = [
      "bg-primary-container text-on-primary-container",
      "bg-secondary-container text-on-secondary-container",
      "bg-tertiary-container text-on-tertiary-container",
      "bg-surface-variant text-on-surface"
    ];
    return bgClasses[name.length % bgClasses.length];
  };

  const getAttendanceColors = (attendance) => {
    const att = parseFloat(attendance || 0);
    const color = att > 85 ? "text-primary" : att > 70 ? "text-on-surface-variant" : "text-secondary";
    const bar = att > 85 ? "bg-primary" : att > 70 ? "bg-surface-tint" : "bg-secondary";
    return { color, bar, glow: att > 90 };
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      "On Track": "bg-primary-fixed text-on-primary-fixed",
      "Satisfactory": "bg-surface-container text-on-surface-variant",
      "Needs Attention": "bg-error-container text-on-error-container",
      "Excelling": "bg-primary-fixed text-on-primary-fixed"
    };
    return statusClasses[status] || "bg-surface-container text-on-surface-variant";
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.school && s.school.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade =
      gradeFilter === "All Grades" || s.gradeGroup === gradeFilter;

    const matchesPerformance =
      performanceFilter === "All Performance" ||
      (performanceFilter === "Excellent" && s.status === "Excelling") ||
      (performanceFilter === "Satisfactory" &&
        (s.status === "On Track" || s.status === "Satisfactory")) ||
      (performanceFilter === "Needs Attention" && s.status === "Needs Attention");

    const matchesSchool =
      schoolFilter === "All Schools" || (s.school && s.school.id === schoolFilter);

    const matchesMigrated =
      migratedFilter === "All" ||
      (migratedFilter === "Migrated" && s.isMigrated === true) ||
      (migratedFilter === "Not Migrated" && !s.isMigrated);

    return matchesSearch && matchesGrade && matchesPerformance && matchesSchool && matchesMigrated;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, gradeFilter, performanceFilter, schoolFilter, migratedFilter]);

  return (
    <div className="p-6 md:p-8 lg:p-12 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <Link
        href="/education"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Education Hub
        </span>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-on-surface tracking-tight leading-tight font-headline">
            Students Directory
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl text-sm md:text-base">
            Manage enrolled students, track academic progress, and monitor school linkages across all program areas.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 transition-shadow"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
            />
          </div>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-label text-sm uppercase tracking-widest flex-shrink-0 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="whitespace-nowrap">Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-all font-label text-sm uppercase tracking-widest flex-shrink-0 cursor-pointer shadow-[0_8px_24px_-10px_rgba(0,104,87,0.4)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="whitespace-nowrap">Add Student</span>
          </button>
        </div>
      </div>

      {/* Filters & Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-sans">
        <div className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container opacity-50"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-label">
              Total Enrolled
            </span>
            <span className="text-3xl font-black text-on-surface tracking-tighter">4,285</span>
            <div className="flex items-center gap-1 text-primary text-xs font-medium mt-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>+12% this term</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-6 flex flex-wrap gap-4 items-center shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-label mr-2">
            Filters
          </span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option>All Grades</option>
            <option>Primary (1-5)</option>
            <option>Middle (6-8)</option>
            <option>High (9-10)</option>
          </select>
          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option>All Performance</option>
            <option>Excellent</option>
            <option>Satisfactory</option>
            <option>Needs Attention</option>
          </select>
          <select
            value={migratedFilter}
            onChange={(e) => setMigratedFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option>All</option>
            <option>Not Migrated</option>
            <option>Migrated</option>
          </select>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="All Schools">All Schools</option>
            {schools.map((sch) => (
              <option key={sch.id} value={sch.id}>{sch.name}</option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="text-primary text-sm font-medium hover:underline ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Student Data Container */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden pt-4 pb-2 shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] font-sans">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-on-surface-variant font-label border-b border-surface-container">
                <th className="px-6 py-4 font-semibold">Student Info</th>
                <th className="px-6 py-4 font-semibold">School Linkage</th>
                <th className="px-6 py-4 font-semibold">Academic Progress</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedStudents.map((s, index) => {
                const initials = getInitials(s.name);
                const bgClass = getBgClass(s.name);
                const { color: attendanceColor, bar: barColor, glow: hasGlow } = getAttendanceColors(s.attendance);
                const statusClass = getStatusClass(s.status);
                
                return (
                  <tr
                    key={s.id}
                    className={`group hover:bg-surface-container-low/50 transition-colors ${
                      index > 0 ? "border-t border-surface-container-low" : ""
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${bgClass}`}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{s.name}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">ID: {s.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-medium text-on-surface">{s.school ? s.school.name : "Unassigned"}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {s.grade} • {s.district || "Kalgachia"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-on-surface">Attendance</span>
                          <span className={attendanceColor}>{s.attendance}%</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full relative ${barColor}`}
                            style={{ width: `${s.attendance}%` }}
                          >
                            {hasGlow && (
                              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 rounded-full blur-[1px]"></div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-max mt-1 ${statusClass}`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/education/students/${encodeURIComponent(s.name.replace(/\s+/g, '-'))}`}
                        className="text-primary hover:bg-primary/5 px-4 py-1.5 rounded-full text-xs font-bold transition-all inline-block hover:underline"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400 text-xs font-sans">
                    No student records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-surface-container-low mt-2 font-sans">
            <span className="text-xs text-on-surface-variant">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of{" "}
              {filteredStudents.length} entries
            </span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {(() => {
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 3) {
                      pages.push(1, 2, 3, '...', totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage, '...', totalPages);
                    }
                  }
                  return pages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...'}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                        page === currentPage
                          ? 'bg-primary text-white shadow-sm'
                          : page === '...'
                          ? 'text-on-surface-variant cursor-default'
                          : 'text-on-surface hover:bg-surface-container-high cursor-pointer'
                      }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add New Student Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Kumar"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Student ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-101 (Leave blank to auto-generate)"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Partner School Linkage
                </label>
                <select
                  required
                  value={newStudentSchool}
                  onChange={(e) => setNewStudentSchool(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                >
                  <option value="" disabled>Select partner school...</option>
                  {schools.map(sch => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Grade Group
                  </label>
                  <select
                    value={newStudentGradeGroup}
                    onChange={(e) => setNewStudentGradeGroup(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  >
                    <option>Primary (1-5)</option>
                    <option>Middle (6-8)</option>
                    <option>High (9-10)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Specific Grade
                  </label>
                  <select
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  >
                    {Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`).map(g => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Attendance (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 95"
                    value={newStudentAttendance}
                    onChange={(e) => setNewStudentAttendance(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Academic Status
                  </label>
                  <select
                    value={newStudentStatus}
                    onChange={(e) => setNewStudentStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  >
                    <option>On Track</option>
                    <option>Satisfactory</option>
                    <option>Needs Attention</option>
                    <option>Excelling</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
