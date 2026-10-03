"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

const EMPTY_STUDENT_FORM = {
  name: "",
  studentId: "",
  centreId: "",
  fellowId: "",
  dob: "",
  gender: "",
  grade: "",
  gradeGroup: "",
  district: "",
  primaryLanguage: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
  enrolmentDate: "",
  status: "On Track",
};

function normalizeGradeGroup(value) {
  const base = (value || "").split(" (")[0].trim();
  return base === "High" ? "Secondary" : base;
}

function FormField({ label, name, value, onChange, type = "text", required = false, placeholder, options, disabled = false }) {
  const inputClasses =
    "px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface disabled:opacity-50";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      {options ? (
        <select name={name} value={value} onChange={(e) => onChange(name, e.target.value)} required={required} disabled={disabled} className={inputClasses}>
          {options.map((o, index) => {
            const optValue = typeof o === "string" ? o : o.value;
            const optLabel = typeof o === "string" ? o : o.label;
            return <option key={`${optValue}-${index}`} value={optValue}>{optLabel}</option>;
          })}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  );
}

export default function AfterSchoolStudentsModule() {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [performanceFilter, setPerformanceFilter] = useState("All Performance");
  const [centreFilter, setCentreFilter] = useState("All Centres");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [students, setStudents] = useState([]);
  const [centres, setCentres] = useState([]);

  // Form state for adding an after school student
  const [newStudentForm, setNewStudentForm] = useState(EMPTY_STUDENT_FORM);
  const [centreFellows, setCentreFellows] = useState([]);

  const isFellow = user?.roleName === "FELLOW";

  const handleNewStudentChange = (name, value) => {
    setNewStudentForm((f) => ({ ...f, [name]: value }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [studRes, centreRes] = await Promise.all([
          fetch("/api/after-school-students", { headers }),
          fetch("/api/after-school-centres", { headers })
        ]);
        const studJson = await studRes.json();
        const centreJson = await centreRes.json();
        if (studJson.success) setStudents(studJson.data);
        if (centreJson.success) setCentres(centreJson.data);
      } catch (err) {
        console.error("Failed to load after school students/centres data:", err);
      }
    }
    loadData();
  }, [token]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.centreId) return;

    try {
      const res = await fetch("/api/after-school-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...newStudentForm,
          studentId: newStudentForm.studentId || `AST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          attendance: 0,
          dob: newStudentForm.dob || null,
          enrolmentDate: newStudentForm.enrolmentDate || null,
          fellowId: newStudentForm.fellowId || null,
        })
      });
      const json = await res.json();
      if (json.success) {
        const loadRes = await fetch("/api/after-school-students", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const loadJson = await loadRes.json();
        if (loadJson.success) {
          setStudents(loadJson.data);
        }
        setNewStudentForm(EMPTY_STUDENT_FORM);
        setCentreFellows([]);
        setShowAddModal(false);
      } else {
        alert(json.error || "Failed to add student");
      }
    } catch (err) {
      console.error("Failed to add student:", err);
    }
  };

  const handleExport = async () => {
    if (filteredStudents.length === 0) {
      alert("No student records to export.");
      return;
    }

    const rows = filteredStudents.map((s) => ({
      "Student ID": s.studentId,
      "Name": s.name,
      "Centre": s.centre ? s.centre.name : "Unassigned",
      "Grade": s.grade || "",
      "Grade Group": s.gradeGroup || "",
      "Gender": s.gender || "",
      "Date of Birth": s.dob ? new Date(s.dob).toLocaleDateString() : "",
      "District": s.district || "",
      "Primary Language": s.primaryLanguage || "",
      "Guardian Name": s.guardianName || "",
      "Guardian Phone": s.guardianPhone || "",
      "Email": s.email || "",
      "Phone": s.phone || "",
      "Address": s.address || "",
      "Enrolment Date": s.enrolmentDate ? new Date(s.enrolmentDate).toLocaleDateString() : "",
      "Attendance (%)": s.attendance ?? 0,
      "Status": s.status,
      "Fellow": s.fellow ? s.fellow.name : "",
    }));

    try {
      const imported = await import("xlsx");
      const XLSX = imported.default || imported;
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `after_school_students_export_${date}.xlsx`);
    } catch (err) {
      console.error("Failed to export students:", err);
      alert("Failed to export students. Please try again.");
    }
  };

  const handleCentreChange = async (centreId, name = "centreId") => {
    setNewStudentForm((f) => ({ ...f, [name]: centreId, fellowId: "" }));
    setCentreFellows([]);
    if (!centreId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/after-school-centres/${centreId}/fellows`, { headers });
      const json = await res.json();
      if (json.success) setCentreFellows(json.data);
    } catch (err) {
      console.error("Failed to load centre fellows:", err);
    }
  };

  const clearFilters = () => {
    setGradeFilter("All Grades");
    setPerformanceFilter("All Performance");
    setCentreFilter("All Centres");
    setSearchQuery("");
    setCurrentPage(1);
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
      (s.centre && s.centre.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade =
      gradeFilter === "All Grades" ||
      normalizeGradeGroup(s.gradeGroup) === gradeFilter;

    const matchesPerformance =
      performanceFilter === "All Performance" ||
      (performanceFilter === "Excellent" && s.status === "Excelling") ||
      (performanceFilter === "Satisfactory" &&
        (s.status === "On Track" || s.status === "Satisfactory")) ||
      (performanceFilter === "Needs Attention" && s.status === "Needs Attention");

    const matchesCentre =
      centreFilter === "All Centres" || (s.centre && s.centre.id === centreFilter);

    return matchesSearch && matchesGrade && matchesPerformance && matchesCentre;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
            After School Students Directory
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl text-sm md:text-base">
            Manage after school learners, track attendance and academic progress across community learning centres.
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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              type="text"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-label text-sm uppercase tracking-widest flex-shrink-0 cursor-pointer"
          >
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
            <span className="text-3xl font-black text-on-surface tracking-tighter">{students.length.toLocaleString()}</span>
            <div className="flex items-center gap-1 text-primary text-xs font-medium mt-1">
              <span className="material-symbols-outlined text-xs">location_city</span>
              <span>Across {centres.length} learning {centres.length === 1 ? "centre" : "centres"}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-6 flex flex-wrap gap-4 items-center shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-label mr-2">
            Filters
          </span>
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option>All Grades</option>
            <option>Primary</option>
            <option>Middle</option>
            <option>Secondary</option>
            <option>Senior Secondary</option>
          </select>
          <select
            value={performanceFilter}
            onChange={(e) => { setPerformanceFilter(e.target.value); setCurrentPage(1); }}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option>All Performance</option>
            <option>Excellent</option>
            <option>Satisfactory</option>
            <option>Needs Attention</option>
          </select>
          <select
            value={centreFilter}
            onChange={(e) => { setCentreFilter(e.target.value); setCurrentPage(1); }}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="All Centres">All Centres</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
                <th className="px-6 py-4 font-semibold">Centre Linkage</th>
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
                      <div className="font-medium text-on-surface">{s.centre ? s.centre.name : "Unassigned"}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {s.grade || s.gradeGroup || "—"} • {s.district || s.centre?.location || "Community Learning Centre"}
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
                        href={`/education/after-school-students/${encodeURIComponent(s.name.replace(/\s+/g, '-'))}`}
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
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl font-sans">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
              <h3 className="text-lg font-bold font-headline text-on-surface">Add New After School Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <FormField label="Full Name" name="name" value={newStudentForm.name} onChange={handleNewStudentChange} required placeholder="e.g. Aarav Kumar" />
                <FormField label="Student ID (Optional)" name="studentId" value={newStudentForm.studentId} onChange={handleNewStudentChange} placeholder="Leave blank to auto-generate" />
                <div className="md:col-span-2">
                  <FormField
                    label="Centre"
                    name="centreId"
                    value={newStudentForm.centreId}
                    onChange={(name, value) => handleCentreChange(value, name)}
                    required
                    options={[{ value: "", label: "Select community learning centre..." }, ...centres.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                </div>
                {!isFellow && (
                  <div className="md:col-span-2">
                    <FormField
                      label="Assign under Fellow (Optional)"
                      name="fellowId"
                      value={newStudentForm.fellowId}
                      onChange={handleNewStudentChange}
                      disabled={!newStudentForm.centreId}
                      options={[
                        { value: "", label: newStudentForm.centreId ? "Select fellow..." : "Select a centre first" },
                        ...centreFellows.map((f) => ({ value: f.id, label: f.name })),
                      ]}
                    />
                  </div>
                )}
                <FormField label="Date of Birth" name="dob" type="date" value={newStudentForm.dob} onChange={handleNewStudentChange} />
                <FormField label="Gender" name="gender" value={newStudentForm.gender} onChange={handleNewStudentChange} options={["", "Male", "Female", "Other"]} />
                <FormField label="Grade" name="grade" value={newStudentForm.grade} onChange={handleNewStudentChange} placeholder="e.g. Grade 6" />
                <FormField label="Grade Group" name="gradeGroup" value={newStudentForm.gradeGroup} onChange={handleNewStudentChange} options={[{ value: "", label: "Not applicable" }, "Primary", "Middle", "Secondary", "Senior Secondary"]} />
                <FormField label="District" name="district" value={newStudentForm.district} onChange={handleNewStudentChange} />
                <FormField label="Primary Language" name="primaryLanguage" value={newStudentForm.primaryLanguage} onChange={handleNewStudentChange} />
                <FormField label="Guardian Name" name="guardianName" value={newStudentForm.guardianName} onChange={handleNewStudentChange} />
                <FormField label="Guardian Phone" name="guardianPhone" value={newStudentForm.guardianPhone} onChange={handleNewStudentChange} />
                <FormField label="Email" name="email" type="email" value={newStudentForm.email} onChange={handleNewStudentChange} />
                <FormField label="Phone" name="phone" value={newStudentForm.phone} onChange={handleNewStudentChange} />
                <div className="md:col-span-2">
                  <FormField label="Address" name="address" value={newStudentForm.address} onChange={handleNewStudentChange} placeholder="Village / Town, Post Office" />
                </div>
                <FormField label="Enrolment Date" name="enrolmentDate" type="date" value={newStudentForm.enrolmentDate} onChange={handleNewStudentChange} />
                <FormField label="Status" name="status" value={newStudentForm.status} onChange={handleNewStudentChange} options={["On Track", "Needs Attention", "At Risk", "Graduated", "Inactive"]} />
                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
