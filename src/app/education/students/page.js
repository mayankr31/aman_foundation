"use client";

import Link from "next/link";
import { useState } from "react";

export default function StudentsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [performanceFilter, setPerformanceFilter] = useState("All Performance");
  const [districtFilter, setDistrictFilter] = useState("All Districts");

  const [students, setStudents] = useState([
    {
      initials: "AK",
      bgClass: "bg-primary-container text-on-primary-container",
      name: "Aarav Kumar",
      id: "STU-2023-089",
      school: "Vidya Mandir High School",
      grade: "Grade 8",
      gradeGroup: "Middle (6-8)",
      district: "North District",
      attendance: 92,
      attendanceColor: "text-primary",
      barColor: "bg-primary",
      hasGlow: true,
      status: "On Track",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      initials: "PS",
      bgClass: "bg-secondary-container text-on-secondary-container",
      name: "Priya Singh",
      id: "STU-2023-142",
      school: "Saraswati Vidya Peeth",
      grade: "Grade 5",
      gradeGroup: "Primary (1-5)",
      district: "East District",
      attendance: 68,
      attendanceColor: "text-secondary",
      barColor: "bg-secondary",
      hasGlow: false,
      status: "Needs Attention",
      statusClass: "bg-error-container text-on-error-container",
    },
    {
      initials: "RD",
      bgClass: "bg-surface-variant text-on-surface",
      name: "Rahul Desai",
      id: "STU-2022-401",
      school: "Global Vision Academy",
      grade: "Grade 10",
      gradeGroup: "High (9-10)",
      district: "South District",
      attendance: 98,
      attendanceColor: "text-primary",
      barColor: "bg-primary",
      hasGlow: true,
      status: "Excelling",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      initials: "MP",
      bgClass: "bg-tertiary-container text-on-tertiary-container",
      name: "Meera Patel",
      id: "STU-2024-012",
      school: "Vidya Mandir High School",
      grade: "Grade 6",
      gradeGroup: "Middle (6-8)",
      district: "North District",
      attendance: 85,
      attendanceColor: "text-on-surface-variant",
      barColor: "bg-surface-tint",
      hasGlow: false,
      status: "Satisfactory",
      statusClass: "bg-surface-container text-on-surface-variant",
    },
  ]);

  const clearFilters = () => {
    setGradeFilter("All Grades");
    setPerformanceFilter("All Performance");
    setDistrictFilter("All Districts");
    setSearchQuery("");
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade =
      gradeFilter === "All Grades" || s.gradeGroup === gradeFilter;

    const matchesPerformance =
      performanceFilter === "All Performance" ||
      (performanceFilter === "Excellent" && s.status === "Excelling") ||
      (performanceFilter === "Satisfactory" &&
        (s.status === "On Track" || s.status === "Satisfactory")) ||
      (performanceFilter === "Needs Attention" && s.status === "Needs Attention");

    const matchesDistrict =
      districtFilter === "All Districts" || s.district === districtFilter;

    return matchesSearch && matchesGrade && matchesPerformance && matchesDistrict;
  });

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
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative w-full md:w-64">
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
          <button className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full hover:shadow-[0_8px_24px_rgba(0,104,87,0.2)] transition-all font-medium text-sm flex-shrink-0 font-sans">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
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
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option>All Districts</option>
            <option>North District</option>
            <option>South District</option>
            <option>East District</option>
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
              {filteredStudents.map((s, index) => (
                <tr
                  key={s.id}
                  className={`group hover:bg-surface-container-low/50 transition-colors ${
                    index > 0 ? "border-t border-surface-container-low" : ""
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${s.bgClass}`}
                      >
                        {s.initials}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{s.name}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">ID: {s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-medium text-on-surface">{s.school}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      {s.grade} • {s.district}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-on-surface">Attendance</span>
                        <span className={s.attendanceColor}>{s.attendance}%</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full relative ${s.barColor}`}
                          style={{ width: `${s.attendance}%` }}
                        >
                          {s.hasGlow && (
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 rounded-full blur-[1px]"></div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-max mt-1 ${s.statusClass}`}
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
              ))}
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
        <div className="px-6 py-4 flex items-center justify-between border-t border-surface-container-low mt-2 font-sans">
          <span className="text-xs text-on-surface-variant">
            {filteredStudents.length === students.length ? (
              "Showing 1 to 4 of 4,285 entries"
            ) : (
              `Showing 1 to ${filteredStudents.length} of ${filteredStudents.length} entries`
            )}
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface-variant disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm font-medium text-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface font-medium text-sm">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface font-medium text-sm">
              3
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant text-sm">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
