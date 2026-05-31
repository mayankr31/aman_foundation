"use client";

import Link from "next/link";
import { useState } from "react";

export default function FellowsModule() {
  const [viewMode, setViewMode] = useState("Grid"); // "Grid" or "List"
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [fellows, setFellows] = useState([
    {
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7gMo5puf1sV4uTm3qk1tT-zVJzNDhR17iH7pqq5iCccFjIOCE8W3EHYIp9rK3D066Q9ZkVjeLVtNwSBF9m1-hvbOUGfnjJRGIchuJ3Eh6rp7nQKBpqZJzMPBwV1Qz0kmOpVSOMreor-iUVKwSv67qJNrwuROO0mgJdvBeUHMDI7zmdq1qTUV0QVFCkkSQdtuaqu2lruZIChfw5S3KIqkr12xKbUERZvogsBdHSPGMGD5RG1KZ_J33Im7k3p4NaNTFC6WFYrzLKONE",
      name: "Aisha Rahman",
      cohort: "Cohort '23",
      location: "Karachi South",
      progress: 85,
      milestones: [
        { done: true, text: "Completed Advanced Phonics Module" },
        { done: false, text: "Pending: Classroom Observation #3" },
      ],
      lastUpdated: "2d ago",
    },
    {
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyU2sk7MSF4O2N4v8tJyIJNfFFC-6k-MyJtM5UWnT68i4JIYVkOBu1pyvnRVdCmTIJDnx-PfGfOEnCJQ0R8CExOGEexqyfB1z4fmKGD0ZZpppomizo-LBDvgJ8cSyY7UCjxoCUf783rsdV_XGiKoyguceMlyb-QzZCf9Gl9MgF3zpl4Q4Y7qPKZ5wjhJdmNIwaFQ7oS2PR9wLYxjBEnkfftf-mWeb4t8u9qmDaop-LQNHejgvZkDUN_y3R2yStAL7Yvw-mXwMoaQdf",
      name: "Fatima Tariq",
      cohort: "Cohort '24",
      location: "Lahore Central",
      progress: 42,
      milestones: [
        { done: true, text: "Initial Assessment Setup" },
        { done: false, text: "Action Required: Submit Lesson Plan" },
      ],
      lastUpdated: "5h ago",
    },
    {
      initials: "BK",
      name: "Bilal Khan",
      cohort: "Cohort '23",
      location: "Multan East",
      progress: 95,
      milestones: [
        { done: true, text: "Final Impact Report Submitted" },
        { done: true, text: "Community Engagement Workshop" },
      ],
      lastUpdated: "1w ago",
    },
  ]);

  // Form states
  const [newFellowName, setNewFellowName] = useState("");
  const [newCohort, setNewCohort] = useState("Cohort '24");
  const [newLocation, setNewLocation] = useState("");
  const [newProgress, setNewProgress] = useState(50);

  const handleAddFellow = (e) => {
    e.preventDefault();
    if (!newFellowName || !newLocation) return;

    const initials = newFellowName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const newFellow = {
      initials,
      name: newFellowName,
      cohort: newCohort,
      location: newLocation,
      progress: parseInt(newProgress),
      milestones: [
        { done: true, text: "Initial Assessment & Placement Completed" },
        { done: false, text: "Pending: Cohort Orientation Session" },
      ],
      lastUpdated: "Just now",
    };

    setFellows([newFellow, ...fellows]);
    setNewFellowName("");
    setNewLocation("");
    setNewProgress(50);
    setShowAddModal(false);
  };

  const filteredFellows = fellows.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
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

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-[2.75rem] font-headline font-black text-on-surface tracking-[-0.02em] leading-none mb-3">
            Fellows Progress Tracking
          </h2>
          <p className="text-sm font-medium text-on-surface-variant max-w-2xl leading-relaxed">
            Monitor cohort advancement, individual literacy goals, and milestone achievements across all active educational districts.
          </p>
        </div>
        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 transition-shadow"
              placeholder="Search fellows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-surface-container-low rounded-full p-1 flex border border-surface-container-highest">
              <button
                onClick={() => setViewMode("Grid")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === "Grid"
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                Grid
              </button>
              <button
                onClick={() => setViewMode("List")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === "List"
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
                List
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap cursor-pointer hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Fellow
            </button>
            <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-[0_4px_12px_rgba(0,104,87,0.2)] transition-all flex items-center gap-2 whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 font-sans">
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed/20 rounded-full blur-2xl group-hover:bg-primary-fixed/30 transition-colors"></div>
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Total Active Fellows
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">
              {fellows.length + 245}
            </h3>
            <span className="text-sm font-medium text-primary flex items-center bg-primary-fixed/30 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-container/10 rounded-full blur-2xl group-hover:bg-secondary-container/20 transition-colors"></div>
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Avg. Cohort Progress
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">68%</h3>
            <span className="text-sm font-medium text-on-surface-variant font-sans">Overall Literacy</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl group-hover:bg-primary-container/20 transition-colors"></div>
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Milestones Achieved
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">1,402</h3>
            <span className="text-sm font-medium text-primary flex items-center bg-primary-fixed/30 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> This Qtr
            </span>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "Grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFellows.map((f, i) => (
            <article
              key={i}
              className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden flex flex-col pt-8 pl-8 pr-6 pb-6 border border-surface-container-lowest hover:border-outline-variant/30 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  {f.avatar ? (
                    <img
                      alt="Fellow Profile"
                      className="w-14 h-14 rounded-full object-cover shadow-sm"
                      src={f.avatar}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xl font-bold font-headline shadow-sm">
                      {f.initials}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-on-surface leading-tight mb-1">{f.name}</h3>
                    <div className="flex items-center gap-2 font-sans">
                      <span className="text-[0.75rem] uppercase tracking-[0.05em] text-primary font-semibold bg-primary-container/10 px-2 py-0.5 rounded">
                        {f.cohort}
                      </span>
                      <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
                      <span className="text-xs text-on-surface-variant">{f.location}</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options"
                  className="text-on-surface-variant hover:text-primary transition-colors p-1"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>

              <div className="mb-6 flex-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-on-surface">Improve Literacy Goal</span>
                  <span
                    className={`text-sm font-bold ${
                      f.progress > 50 ? "text-primary" : "text-secondary-container"
                    }`}
                  >
                    {f.progress}%
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full relative ${
                      f.progress > 50 ? "bg-gradient-to-r from-primary to-primary-container" : "bg-secondary-container"
                    }`}
                    style={{ width: `${f.progress}%` }}
                  >
                    {f.progress > 50 && (
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[1px]"></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6 font-sans">
                <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                  Recent Milestones
                </p>
                <ul className="space-y-3">
                  {f.milestones.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          m.done
                            ? "bg-primary-fixed"
                            : m.text.includes("Action Required")
                            ? "bg-secondary-container/20 text-secondary-container"
                            : "bg-surface-container-high"
                        }`}
                      >
                        <span
                          className={`text-[12px] ${m.done ? "material-symbols-outlined text-on-primary-fixed icon-filled" : "material-symbols-outlined text-on-surface-variant"}`}
                        >
                          {m.done ? "check" : m.text.includes("Action Required") ? "warning" : "schedule"}
                        </span>
                      </div>
                      <span
                        className={`text-sm leading-snug ${
                          m.done ? "text-on-surface" : "text-on-surface-variant"
                        }`}
                      >
                        {m.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-4 border-t border-surface-container-low flex justify-between items-center font-sans">
                <span className="text-xs text-on-surface-variant">Last updated: {f.lastUpdated}</span>
                <Link
                  className="text-sm font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-1 group"
                  href={`/education/fellows/${encodeURIComponent(f.name.replace(/\s+/g, '-'))}`}
                >
                  View Profile
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "List" && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-surface-container-highest">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-highest text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-semibold">
                <th className="px-8 py-4">Name</th>
                <th className="px-6 py-4">Cohort</th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">Literacy Goal</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFellows.map((f, i) => (
                <tr
                  key={i}
                  className="border-b border-surface-container-highest hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-8 py-4 font-semibold text-on-surface">{f.name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{f.cohort}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{f.location}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        f.progress > 70
                          ? "bg-primary-fixed text-on-primary-fixed"
                          : "bg-secondary-container/20 text-secondary"
                      }`}
                    >
                      {f.progress}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{f.lastUpdated}</td>
                  <td className="px-8 py-4 text-right">
                    <Link
                      href={`/education/fellows/${encodeURIComponent(f.name.replace(/\s+/g, '-'))}`}
                      className="text-primary hover:text-primary-container text-sm font-semibold transition-colors cursor-pointer"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination / Load More (Simple representation) */}
      <div className="mt-10 flex justify-center">
        <button className="px-6 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors">
          Load More Fellows
        </button>
      </div>

      {filteredFellows.length === 0 && (
        <p className="text-center py-12 text-xs text-slate-400 font-sans">No fellows match your search.</p>
      )}

      {/* Add Fellow Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Register New Educational Fellow</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddFellow} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Fellow Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Ahmed"
                  value={newFellowName}
                  onChange={(e) => setNewFellowName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Cohort
                </label>
                <select
                  value={newCohort}
                  onChange={(e) => setNewCohort(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900"
                >
                  <option value="Cohort '23">Cohort '23</option>
                  <option value="Cohort '24">Cohort '24</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  District / Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Multan East"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Baseline Literacy Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={newProgress}
                  onChange={(e) => setNewProgress(e.target.value)}
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
                  Register Fellow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
