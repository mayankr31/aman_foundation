"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DEFAULT_STUDENTS } from "@/lib/schoolsData";

export default function StudentProfileDetail() {
  const { id } = useParams();
  const name = decodeURIComponent(id || "Aarav Kumar").replace(/-/g, " ");

  const student = DEFAULT_STUDENTS.find(s => s.name.toLowerCase() === name.toLowerCase()) || {
    name: name,
    id: "STU-2026-999",
    school: "Raiyan Academy Bartary",
    grade: "Grade 8",
    district: "Bartari",
    status: "On Track"
  };

  const [attendanceLogs] = useState([
    { month: "Jan", present: 20, total: 22, percentage: 90 },
    { month: "Feb", present: 19, total: 20, percentage: 95 },
    { month: "Mar", present: 21, total: 23, percentage: 91 },
    { month: "Apr", present: 18, total: 20, percentage: 90 },
    { month: "May", present: 22, total: 22, percentage: 100 },
  ]);

  const [subjects] = useState([
    { name: "Mathematics", score: 88, grade: "A", remarks: "Excellent problem solver." },
    { name: "Reading & Literacy", score: 76, grade: "B", remarks: "Good comprehension, needs focus on vocabulary." },
    { name: "General Science", score: 92, grade: "A+", remarks: "Outstanding performance in experiments." },
    { name: "Social Studies", score: 85, grade: "A", remarks: "Active participation in class discussions." },
  ]);

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/education/students"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Students Directory
        </span>
      </Link>

      {/* Hero Section */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-4xl shrink-0 border-4 border-surface shadow-md">
            {name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                {student.name}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {student.status}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">school</span>
              {student.school} • {student.grade}
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div>
                <span className="font-bold text-on-surface">Student ID:</span> {student.id}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">District:</span> {student.district}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Student Info
          </button>
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Progress Report
          </button>
        </div>
      </header>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Demographics & Academic Progress */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Demographic Records */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Demographics &amp; Enrolment Records
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 font-sans text-sm">
              <div className="border-b border-surface-container pb-3">
                <p className="text-on-surface-variant mb-1 font-medium">Full Name</p>
                <p className="font-semibold text-on-surface capitalize">{name}</p>
              </div>
              <div className="border-b border-surface-container pb-3">
                <p className="text-on-surface-variant mb-1 font-medium">Age / Gender</p>
                <p className="font-semibold text-on-surface">13 Years / Male</p>
              </div>
              <div className="border-b border-surface-container pb-3">
                <p className="text-on-surface-variant mb-1 font-medium">Guardian Contact</p>
                <p className="font-semibold text-on-surface">Rajesh Kumar (+91 98765 43210)</p>
              </div>
              <div className="border-b border-surface-container pb-3">
                <p className="text-on-surface-variant mb-1 font-medium">Enrolment Date</p>
                <p className="font-semibold text-on-surface">June 15, 2023</p>
              </div>
              <div className="border-b border-surface-container pb-3">
                <p className="text-on-surface-variant mb-1 font-medium">Primary Language</p>
                <p className="font-semibold text-on-surface">Hindi, English</p>
              </div>
              <div className="border-b border-surface-container pb-3">
                <p className="text-on-surface-variant mb-1 font-medium">Home Location</p>
                <p className="font-semibold text-on-surface">Ward 4, {student.district}</p>
              </div>
            </div>
          </div>

          {/* Academic Progress */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Academic Progress &amp; Report Card
            </h3>
            <div className="space-y-6">
              {subjects.map((sub, idx) => (
                <div key={idx} className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface text-base">{sub.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{sub.remarks}</p>
                  </div>
                  <div className="flex items-center gap-6 self-end md:self-auto shrink-0 font-sans">
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant font-medium">Assessment Score</p>
                      <p className="font-bold text-on-surface">{sub.score} / 100</p>
                    </div>
                    <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {sub.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Attendance & Institutional Links */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Attendance Ledger */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Attendance Ledger
            </h3>
            <div className="space-y-4 font-sans text-sm">
              {attendanceLogs.map((log, index) => (
                <div key={index} className="flex flex-col gap-1.5 py-2 border-b border-surface-container last:border-none">
                  <div className="flex justify-between font-semibold">
                    <span className="text-on-surface">{log.month} Attendance</span>
                    <span className="text-primary">{log.percentage}% ({log.present}/{log.total})</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${log.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Linkages */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hub</span>
              Program Linkages
            </h3>
            <div className="space-y-4 font-sans text-sm">
              <div className="p-4 bg-surface rounded-lg">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Partner Institution</p>
                <Link href={`/education/schools/${encodeURIComponent(student.school.replace(/\s+/g, '-'))}`} className="font-semibold text-primary hover:underline">
                  {student.school}
                </Link>
                <p className="text-xs text-on-surface-variant mt-1">Status: Active Partnership</p>
              </div>

              <div className="p-4 bg-surface rounded-lg">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Assigned Educational Fellow</p>
                <Link href="/education/fellows" className="font-semibold text-primary hover:underline">
                  Aisha Rahman
                </Link>
                <p className="text-xs text-on-surface-variant mt-1">Cohort Placement: '24</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
