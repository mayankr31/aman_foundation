"use client";

import Link from "next/link";
import { useState } from "react";

export default function SchoolsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [schools, setSchools] = useState([
    {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAd0x1ztc9iuj8nay2xC1_MH-xTSmAKr8IhFrASNZRkSKkt-Y4BunC5I9iqvTLQ0_8lmU0zaYnPjqddtwFcC75fjZRBUU-N_7DG60EY9HluYt_nZMGUi1MCuGMs9ZtR2iM2AGFyw2MvZhg-RlW1as3xPOOXef7qU9OwfisCQeoCv_6chJeBZbBMdmknEG_LLtMl_EWluwSEWTOAEkWm2p31lCjaolK7bQHfqtZzT6CLsbLoare9Nu918oPHFj07H0LgIShvW4giB6YL",
      name: "Oakridge Academy",
      location: "North District",
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      enrolled: "1,240",
      programs: 4,
      goal: 85,
    },
    {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz5AwPFuwFIR2gamqHGmS3Z3IdTDQwW83VVeH6b9NJQeyhwstun166F-NBJdmvRxVedIL-KvP2kSfrxII7pBp79OmeBVj_J6PnuiUawZodfc0uJXAvWrakkcwnw4Hqf3XMp1L_FWf3gbWbnqajq_B2L9R61bXpsmng6PGHQ1DhYHPRtNj0FIVW9oXuywykoMFb8kYgru_HD_DkySGwo1b-jcWzvibQ5MZ6R3bzcPgSiBKeu0Rk1ETZRc61Hdu6z3xj1KNhL2dgFdP5",
      name: "Riverside Public",
      location: "East Valley",
      status: "Review",
      statusClass: "bg-surface-container-high text-on-surface-variant",
      enrolled: "850",
      programs: 2,
      goal: 42,
    },
    {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3JsQ8gLDGjXcAskdAgUZD_gbTWPDpCHJ32DnFoopdp-_p5I_tgEYtvw4dOCafH7MyasL1dS3wak_92AIaWlwMwG3sj4MjB1WuLlaXIrD_Pgmeuj-7QDOpOBBGV61QzLmn-ToK-R2LhxD-uDv5RiRqzcVeF6dzd8NDuP0UxUs4_6vkZrksOHYi1xW4AxQWl2kD1120kSJ72va_hR5sAs4V-2ir50bTZl6Oc9Rb9HATjyWanXkUOJDd6GDhhJaAsICMPa-8RFXRUFJx",
      name: "Summit Prep",
      location: "West Highlands",
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      enrolled: "2,100",
      programs: 7,
      goal: 94,
    },
  ]);

  // Form states
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newEnrolled, setNewEnrolled] = useState("");
  const [newPrograms, setNewPrograms] = useState("");
  const [newGoal, setNewGoal] = useState(60);

  const handleAddSchool = (e) => {
    e.preventDefault();
    if (!newSchoolName || !newLocation || !newEnrolled || !newPrograms) return;

    const newSchool = {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAd0x1ztc9iuj8nay2xC1_MH-xTSmAKr8IhFrASNZRkSKkt-Y4BunC5I9iqvTLQ0_8lmU0zaYnPjqddtwFcC75fjZRBUU-N_7DG60EY9HluYt_nZMGUi1MCuGMs9ZtR2iM2AGFyw2MvZhg-RlW1as3xPOOXef7qU9OwfisCQeoCv_6chJeBZbBMdmknEG_LLtMl_EWluwSEWTOAEkWm2p31lCjaolK7bQHfqtZzT6CLsbLoare9Nu918oPHFj07H0LgIShvW4giB6YL",
      name: newSchoolName,
      location: newLocation,
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      enrolled: parseInt(newEnrolled).toLocaleString(),
      programs: parseInt(newPrograms),
      goal: parseInt(newGoal),
    };

    setSchools([newSchool, ...schools]);
    setNewSchoolName("");
    setNewLocation("");
    setNewEnrolled("");
    setNewPrograms("");
    setNewGoal(60);
    setShowAddModal(false);
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 flex flex-col gap-10 max-w-[1600px] mx-auto w-full">
      {/* Editorial Header */}
      <Link
        href="/education"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to Education Hub
        </span>
      </Link>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-[2.75rem] leading-none tracking-[-0.02em] text-on-surface mb-3">
            Education Module
          </h2>
          <p className="font-body text-lg text-on-surface-variant max-w-2xl">
            Monitoring school profiles, program participation, and geographic impact across targeted regions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto mt-4 xl:mt-0">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 transition-shadow"
              placeholder="Search schools..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="whitespace-nowrap">Export Data</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_24px_-10px_rgba(0,104,87,0.4)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="whitespace-nowrap">Add School</span>
            </button>
          </div>
        </div>
      </div>
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Map View (Hero Card) */}
        <div className="xl:col-span-8 bg-surface-container-low rounded-[1rem] relative overflow-hidden h-[500px] flex group">
          <img
            alt="Geographic mapping of schools"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhgWm2vbsWbyDUbD4mgsvy1AZrwUyaiSKySgBqDHHlYkuLQwP-vjNxO27FlcDq4xFb_i7bwUmlloXU3F1Ap--g8q8PUL4Mj9e9hiR3WG80ydnAUMQsc_qxkQfGSO972p9-bEXnAjs_4VE08f6AZ3NY1XyUJ4GBG1GjcSfHzAS6ZOyR4MlYzQAnkAEPLdjNmFGDt2uKxIyztLZVPJepz6xt_K_oPjuInIri-dGYQB8FF-GH1KrrO_74MMPX4I5S8WHSniXDxxpbP2ZO"
          />
          {/* Glassmorphism Stats Overlay */}
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-[340px] bg-surface-container-lowest/85 backdrop-blur-[12px] p-6 rounded-[1rem] shadow-[0_8px_24px_-10px_rgba(0,104,87,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg text-on-surface tracking-tight">Regional Impact</h3>
              <span className="material-symbols-outlined text-primary">public</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                  Total Schools
                </p>
                <p className="font-headline text-2xl text-on-surface">{schools.length + 121}</p>
              </div>
              <div>
                <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                  Active Students
                </p>
                <p className="font-headline text-2xl text-primary">45.2k</p>
              </div>
            </div>
          </div>
        </div>
        {/* Aggregated Metrics Side Panel */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Primary Metric Card */}
          <div className="bg-primary-container p-8 rounded-[1rem] flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-on-primary-container">trending_up</span>
                <h3 className="font-label text-xs uppercase tracking-[0.05em] text-on-primary-container/80">
                  Overall Impact Score
                </h3>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="font-headline text-5xl tracking-[-0.02em] text-on-primary-container">87</p>
                <p className="font-body text-sm text-on-primary-container/80">/ 100</p>
              </div>
            </div>
            <div className="mt-8 space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-1 text-on-primary-container">
                  <span>Program Attendance</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="h-1.5 w-full bg-on-primary-container/20 rounded-full overflow-hidden">
                  <div className="h-full bg-on-primary-container w-[92%] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-on-primary-container">
                  <span>Resource Allocation</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="h-1.5 w-full bg-on-primary-container/20 rounded-full overflow-hidden">
                  <div className="h-full bg-on-primary-container w-[78%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Alert/Action Card */}
          <div className="bg-surface-container-low p-6 rounded-[1rem]">
            <h3 className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4">
              Needs Attention
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[20px]">warning</span>
              </div>
              <div>
                <p className="font-body text-sm text-on-surface font-medium">
                  3 Schools require immediate resource restocking.
                </p>
                <a
                  className="font-label text-xs uppercase tracking-widest text-primary mt-2 inline-block hover:underline"
                  href="#"
                >
                  Review Inventory
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* School Profile Cards Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline text-2xl tracking-tight text-on-surface">Featured Profiles</h3>
          <button className="text-primary font-label text-sm uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer">
            View All Directory{" "}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((s, index) => (
            <Link
              key={index}
              href={`/education/schools/${encodeURIComponent(s.name.replace(/\s+/g, '-'))}`}
              className="bg-surface-container-lowest p-6 rounded-[1rem] hover:shadow-[0_8px_24px_-10px_rgba(0,104,87,0.08)] transition-all duration-300 flex flex-col group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0">
                    <img alt={s.name} className="w-full h-full object-cover" src={s.img} />
                  </div>
                  <div>
                    <h4 className="font-headline text-lg text-on-surface leading-tight group-hover:text-primary transition-colors">
                      {s.name}
                    </h4>
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>{" "}
                      {s.location}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-label text-[0.65rem] uppercase tracking-widest ${
                    s.status === "Active"
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-surface-variant">
                <div>
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                    Enrolled
                  </p>
                  <p className="font-headline text-xl text-on-surface">{s.enrolled}</p>
                </div>
                <div>
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                    Programs
                  </p>
                  <p className="font-headline text-xl text-on-surface">{s.programs}</p>
                </div>
              </div>
              <div className="mt-auto">
                <div className="flex justify-between font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                  <span>Impact Goal</span>
                  <span className={s.goal > 50 ? "text-primary" : "text-secondary"}>
                    {s.goal}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.goal > 50
                        ? "bg-primary shadow-[0_0_4px_rgba(0,104,87,0.4)]"
                        : "bg-secondary"
                    }`}
                    style={{ width: `${s.goal}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          ))}
          {filteredSchools.length === 0 && (
            <p className="text-center col-span-full py-12 text-sm text-on-surface-variant">
              No partner schools match your search query.
            </p>
          )}
        </div>
      </div>

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add New Partner School</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSchool} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  School Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oakridge Academy"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  District / Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North District"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Enrolled Students
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1200"
                  value={newEnrolled}
                  onChange={(e) => setNewEnrolled(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Active Programs
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4"
                  value={newPrograms}
                  onChange={(e) => setNewPrograms(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Impact Goal Achieved (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
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
                  Add School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
