"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function PtaEventDetail() {
  const { id } = useParams();
  const title = id === "101" ? "Q3 PTA General Assembly" : "Fellow-Parent Welcome Committee";

  const [attendees] = useState([
    { name: "Rajesh Kumar", role: "Parent (Grade 8)", signed: "Yes", time: "10:02 AM" },
    { name: "Aisha Rahman", role: "Fellow (Assigned)", signed: "Yes", time: "09:45 AM" },
    { name: "Margaret Alva", role: "School Principal", signed: "Yes", time: "09:55 AM" },
    { name: "Suresh Patil", role: "Parent (Grade 3)", signed: "No (Apology Sent)", time: "-" },
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
          <div className="w-16 h-16 rounded-full bg-secondary-fixed text-on-secondary-container flex items-center justify-center text-3xl font-bold shrink-0">
            <span className="material-symbols-outlined text-3xl">diversity_3</span>
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                {title}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Scheduled
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
              Nov 12, 2026 • 11:30 AM at Riverside Classroom B
            </p>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Meeting Details & Attendees */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Minutes / Meeting Details */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-4">Meeting Agenda &amp; Focus</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              This assembly is scheduled to establish critical linkages between newly onboarded educational fellows and parent representatives. We will review attendance goals, distribute learning block materials, and define community feedback paths.
            </p>
          </div>

          {/* Attendee Sign Ins */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">how_to_reg</span>
              PTA Attendee Registry &amp; Sign-ins
            </h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Signed In</th>
                    <th className="py-3 px-4 text-right">Time Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a, idx) => (
                    <tr key={idx} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-on-surface">{a.name}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{a.role}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          a.signed === "Yes" ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                        }`}>
                          {a.signed}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-on-surface-variant">{a.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Communication Logs */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Action Log / Communications */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6">Action &amp; Communication Logs</h3>
            <div className="space-y-4 font-sans text-xs text-on-surface-variant">
              <div className="p-3 bg-surface rounded border border-surface-container">
                <span className="font-bold text-on-surface block mb-1">Pre-Alert Sent</span>
                SMS invitations sent automatically to 32 parents registered in Grade 3 and Grade 4 cohorts.
                <span className="text-[10px] text-slate-400 block mt-2">Oct 29, 2026 • 09:12 AM</span>
              </div>

              <div className="p-3 bg-surface rounded border border-surface-container">
                <span className="font-bold text-on-surface block mb-1">Follow-up reminder</span>
                Acknowledged by Fellow coordinator. Review booklets packed for distribution.
                <span className="text-[10px] text-slate-400 block mt-2">Oct 31, 2026 • 15:45 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
