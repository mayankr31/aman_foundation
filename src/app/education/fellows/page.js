"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function FellowsModule() {
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.roleName === "FELLOW") {
      router.replace("/profile");
    }
  }, [user, router]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [fellows, setFellows] = useState([]);

  // Form states
  const [newFellowName, setNewFellowName] = useState("");
  const [newCohort, setNewCohort] = useState("Cohort '24");
  const [newLocation, setNewLocation] = useState("");
  const [newProgress, setNewProgress] = useState(50);

  useEffect(() => {
    async function loadFellows() {
      try {
        const res = await fetch("/api/fellows", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setFellows(json.data);
        }
      } catch (err) {
        console.error("Failed to load fellows:", err);
      }
    }
    loadFellows();
  }, [token]);

  const handleAddFellow = async (e) => {
    e.preventDefault();
    if (!newFellowName || !newLocation) return;

    try {
      const res = await fetch("/api/fellows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newFellowName,
          cohort: newCohort,
          address: newLocation,
          progress: parseInt(newProgress)
        })
      });
      const json = await res.json();
      if (json.success) {
        const loadRes = await fetch("/api/fellows", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const loadJson = await loadRes.json();
        if (loadJson.success) {
          setFellows(loadJson.data);
        } else {
          const initials = newFellowName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
          const manualFellow = {
            id: json.data.id,
            initials,
            name: newFellowName,
            cohort: newCohort,
            location: newLocation,
            progress: parseInt(newProgress),
            milestones: [
              { done: true, text: "Initial Assessment & Placement Completed" },
              { done: false, text: "Pending: Cohort Orientation Session" }
            ],
            lastUpdated: "Just now"
          };
          setFellows([manualFellow, ...fellows]);
        }
        setNewFellowName("");
        setNewLocation("");
        setNewProgress(50);
        setShowAddModal(false);
      } else {
        alert(json.error || "Failed to add fellow");
      }
    } catch (err) {
      console.error("Failed to add fellow:", err);
    }
  };

  const cohorts = ["All", ...new Set(fellows.map((f) => f.cohort))];
  const districts = ["All", ...new Set(fellows.map((f) => f.location || f.address))];

  const filteredFellows = fellows.filter(
    (f) =>
      (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.location && f.location.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (selectedCohort === "All" || f.cohort === selectedCohort) &&
      (selectedDistrict === "All" || f.location === selectedDistrict)
  );

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredFellows.length / ITEMS_PER_PAGE);
  const paginatedFellows = filteredFellows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCohort, selectedDistrict]);

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

      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-[2.75rem] font-headline font-black text-on-surface tracking-[-0.02em] leading-none mb-3">
          Fellows Progress Tracking
        </h2>
        <p className="text-sm font-medium text-on-surface-variant max-w-2xl leading-relaxed">
          Monitor cohort advancement, individual literacy goals, and milestone achievements across all active educational districts near Kalgachia, Assam.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-4 w-full mb-10 shrink-0">
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

        {/* Cohort Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-full sm:w-auto pl-4 pr-10 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm transition-shadow appearance-none cursor-pointer text-on-surface font-sans font-medium"
          >
            {cohorts.map((c) => (
              <option key={c} value={c} className="bg-surface-container text-on-surface">
                {c === "All" ? "All Cohorts" : c}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
            expand_more
          </span>
        </div>

        {/* District Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full sm:w-auto pl-4 pr-10 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm transition-shadow appearance-none cursor-pointer text-on-surface font-sans font-medium"
          >
            {districts.map((d) => (
              <option key={d} value={d} className="bg-surface-container text-on-surface">
                {d === "All" ? "All Districts" : d}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
            expand_more
          </span>
        </div>


        <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-[0_4px_12px_rgba(0,104,87,0.2)] transition-all flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
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

      {/* List View */}
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
              {paginatedFellows.map((f, i) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2 font-sans">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

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
                  placeholder="e.g. Balikuri, Kalgachia"
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
