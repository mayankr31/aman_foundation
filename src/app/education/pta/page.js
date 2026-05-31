"use client";

import Link from "next/link";
import { useState } from "react";

export default function PtaPrograms() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("Program"); // "Program" or "Event"

  const [programs, setPrograms] = useState([
    {
      id: 1,
      icon: "campaign",
      iconBg: "bg-primary/10 text-primary",
      title: "Annual Literacy Drive",
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      description: "Comprehensive reading initiative targeting Standard 3 students.",
      duration: "6 Months",
      participants: "450 Students Enrolled",
    },
    {
      id: 2,
      icon: "computer",
      iconBg: "bg-secondary-fixed text-on-secondary-container",
      title: "Digital Literacy Course",
      status: "Planning",
      statusClass: "bg-secondary-container text-on-secondary-fixed",
      description: "Basic computing classes for standard 8 students in partner schools.",
      duration: "3 Months",
      participants: "Planning (120 Expected)",
    },
  ]);

  const [events, setEvents] = useState([
    {
      id: 101,
      title: "Q3 PTA General Assembly",
      status: "Completed",
      statusClass: "bg-surface-container text-on-surface-variant",
      description: "Review of student outcomes, infrastructure needs, and parent feedback.",
      date: "Oct 24, 2026 • 10:00 AM",
      location: "Oakridge Main Hall",
    },
    {
      id: 102,
      title: "Fellow-Parent Welcome Committee",
      status: "Scheduled",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      description: "Orientation session welcoming Cohort '24 fellows to the district.",
      date: "Nov 12, 2026 • 11:30 AM",
      location: "Riverside Classroom B",
    },
  ]);

  // Form states
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newPriority, setNewPriority] = useState("Active");

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newName || !newDesc) return;

    if (modalType === "Program") {
      const newProg = {
        id: programs.length + 1,
        icon: "campaign",
        iconBg: "bg-primary/10 text-primary",
        title: newName,
        status: newPriority,
        statusClass: newPriority === "Active" ? "bg-primary-fixed text-on-primary-fixed" : "bg-secondary-container text-on-secondary-fixed",
        description: newDesc,
        duration: newDate || "Indefinite",
        participants: newLoc || "0 Enrolled",
      };
      setPrograms([...programs, newProg]);
    } else {
      const newEvent = {
        id: events.length + 101,
        title: newName,
        status: newPriority === "Active" ? "Scheduled" : "Completed",
        statusClass: newPriority === "Active" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container text-on-surface-variant",
        description: newDesc,
        date: newDate || "TBD",
        location: newLoc || "TBD",
      };
      setEvents([...events, newEvent]);
    }

    setNewName("");
    setNewDesc("");
    setNewDate("");
    setNewLoc("");
    setNewPriority("Active");
    setShowAddModal(false);
  };

  return (
    <div className="flex-grow flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col px-6 md:px-12 pt-8 md:pt-12 pb-2 z-10 relative">
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2 font-sans">
              Education Module
            </p>
            <h1 className="text-2xl md:text-[2.75rem] font-headline font-semibold text-on-background leading-tight">
              PTA &amp; Programs Hub
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 font-sans shrink-0">
            <button
              onClick={() => {
                setModalType("Event");
                setShowAddModal(true);
              }}
              className="flex-1 md:flex-none bg-surface-container-lowest text-on-surface border border-outline-variant/30 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="whitespace-nowrap">Schedule Meeting</span>
            </button>
            <button
              onClick={() => {
                setModalType("Program");
                setShowAddModal(true);
              }}
              className="flex-1 md:flex-none bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(0,104,87,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="whitespace-nowrap">Launch Program</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="flex-grow px-6 md:px-12 pb-24 md:pb-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* Active Statistics Card */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans mb-4">
            <div className="bg-surface-container-lowest rounded-xl p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
              <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">
                Running Programs
              </p>
              <div className="text-4xl font-headline font-bold text-on-surface">{programs.length} Active</div>
              <p className="text-xs text-on-surface-variant mt-2">Continuous impact assessment</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
              <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">
                Meetings Held (YTD)
              </p>
              <div className="text-4xl font-headline font-bold text-on-surface">{events.filter(e => e.status === "Completed").length + 24}</div>
              <p className="text-xs text-on-surface-variant mt-2">Parent-Teacher linkages complete</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
              <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">
                Communication Follow-ups
              </p>
              <div className="text-4xl font-headline font-bold text-primary">4 Pending</div>
              <p className="text-xs text-on-surface-variant mt-2">Requires organizer action</p>
            </div>
          </div>

          {/* Column Left: Long Running Programs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">workspace_premium</span>
                Long-Running Programs
              </h3>
              <div className="space-y-4">
                {programs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/education/pta/program/${p.id}`}
                    className="p-4 bg-surface rounded-lg border border-surface-container hover:bg-surface-container-low transition-colors block group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2 font-sans">
                      <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">{p.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.statusClass}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{p.description}</p>
                    <div className="flex justify-between text-xs text-slate-500 font-sans mt-2 pt-2 border-t border-surface-container">
                      <span>Duration: {p.duration}</span>
                      <span className="font-semibold text-primary">{p.participants}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column Right: Events & PTA Meetings */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">diversity_3</span>
                Events &amp; PTA Meetings
              </h3>
              <div className="space-y-4">
                {events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/education/pta/event/${e.id}`}
                    className="p-4 bg-surface rounded-lg border border-surface-container hover:bg-surface-container-low transition-colors block group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2 font-sans">
                      <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">{e.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${e.statusClass}`}>
                        {e.status}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{e.description}</p>
                    <div className="flex justify-between text-xs text-slate-500 font-sans mt-2 pt-2 border-t border-surface-container">
                      <span>{e.date}</span>
                      <span className="font-medium">{e.location}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Launch New {modalType}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Title / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === "Program" ? "Vocational Training Camp" : "PTA Special Assembly"}`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Explain goals, agendas, or outlines."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {modalType === "Program" ? "Planned Duration (e.g. 6 Months)" : "Schedule Date & Time"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === "Program" ? "4 Months" : "Nov 12, 2026 • 10:00 AM"}`}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {modalType === "Program" ? "Expected Participants (e.g. 150 Enrolled)" : "Location / Venue"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === "Program" ? "80 Enrolled" : "Classroom 4A"}`}
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
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
                  Launch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
