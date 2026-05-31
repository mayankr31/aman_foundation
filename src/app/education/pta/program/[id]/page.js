"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function PtaProgramDetail() {
  const { id } = useParams();
  const title = id === "1" ? "Annual Literacy Drive" : "Digital Literacy Course";

  const [participants] = useState([
    { name: "Aarav Kumar", id: "STU-2023-089", school: "Vidya Mandir", progress: "85% Completed" },
    { name: "Meera Patel", id: "STU-2024-012", school: "Vidya Mandir", progress: "60% Completed" },
    { name: "Rahul Desai", id: "STU-2022-401", school: "Global Vision", progress: "92% Completed" },
  ]);

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/education/pta"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to PTA Hub
        </span>
      </Link>

      {/* Hero */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold shrink-0">
            <span className="material-symbols-outlined text-3xl">campaign</span>
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                {title}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">schedule</span>
              Continuous Education Initiative • 6 Months Planned
            </p>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Description & Progress */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-4">Program Goals &amp; Metrics</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              This long-term program is designed to integrate basic phonics and reading competencies into primary classrooms, supporting assigned educational fellows with tailored toolkits and assessment templates. Progress outcomes are synced on a bi-weekly basis.
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>General Learning Objective Reached</span>
                  <span className="text-primary">78% Progress</span>
                </div>
                <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Roster */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">groups</span>
              Participant Student Roster
            </h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4 text-right">Individual Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, idx) => (
                    <tr key={idx} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-on-surface">{p.name}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{p.school}</td>
                      <td className="py-4 px-4 text-right font-semibold text-primary">{p.progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Resources & outcomes */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Program Details</h3>
            <div className="space-y-4 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Scheduled Term</span>
                <span className="font-semibold text-on-surface">Jun - Dec 2026</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Active Coordinator</span>
                <span className="font-semibold text-on-surface">Aisha Rahman</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Total Target</span>
                <span className="font-semibold text-on-surface">450 Students</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
