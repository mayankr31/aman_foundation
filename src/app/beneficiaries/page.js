"use client";

import Link from "next/link";
import { useState } from "react";

export default function BeneficiaryMasterDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("All Tiers");
  const [programFilter, setProgramFilter] = useState("All Programs");

  const [beneficiaries, setBeneficiaries] = useState([
    {
      id: "BEN-482-A",
      name: "Amina Patel",
      location: "Wardha, Maharashtra",
      householdSize: 5,
      income: "Agriculture",
      tier: "Tier 2",
      tierPercent: 65,
      programs: ["Goat Rearing", "Sugarcane"],
      resilienceScore: 82,
    },
    {
      id: "BEN-104-B",
      name: "Rajesh Gond",
      location: "Yavatmal, Maharashtra",
      householdSize: 4,
      income: "Livestock",
      tier: "Tier 1",
      tierPercent: 40,
      programs: ["Goat Rearing"],
      resilienceScore: 58,
    },
    {
      id: "BEN-902-C",
      name: "Savitri Bai",
      location: "Amravati, Maharashtra",
      householdSize: 6,
      income: "Agriculture",
      tier: "Tier 3",
      tierPercent: 90,
      programs: ["Sugarcane"],
      resilienceScore: 92,
    },
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("All Tiers");
    setProgramFilter("All Programs");
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = tierFilter === "All Tiers" || b.tier === tierFilter;

    const matchesProgram =
      programFilter === "All Programs" || b.programs.includes(programFilter);

    return matchesSearch && matchesTier && matchesProgram;
  });

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/livelihood"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Livelihood Hub
        </span>
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <span className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
            Livelihood Database
          </span>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-on-surface tracking-tight leading-tight font-headline">
            Beneficiaries Master Registry
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl text-sm">
            Central master registry connecting all livelihood programs. Monitor socio-economic growth, documents, and resilience indexes.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 font-sans">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 focus:outline-none text-on-surface"
              placeholder="Search master database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full hover:shadow-[0_8px_24px_rgba(0,104,87,0.2)] transition-all font-medium text-sm flex-shrink-0">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Master
          </button>
        </div>
      </div>

      {/* Filters Bento Box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-sans">
        <div className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
              Total Beneficiaries
            </span>
            <span className="text-3xl font-black text-on-surface tracking-tighter">{beneficiaries.length + 8420}</span>
            <span className="text-xs text-on-surface-variant font-medium mt-1">Unified profiles logged</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-6 flex flex-wrap gap-4 items-center shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mr-2">
            Filter Registry
          </span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
          >
            <option value="All Tiers">All Tiers</option>
            <option value="Tier 1">Tier 1 (Critical)</option>
            <option value="Tier 2">Tier 2 (Progressing)</option>
            <option value="Tier 3">Tier 3 (Stable)</option>
          </select>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
          >
            <option value="All Programs">All Sub-Programs</option>
            <option value="Goat Rearing">Goat Rearing</option>
            <option value="Sugarcane">Sugarcane Cultivation</option>
          </select>
          <button
            onClick={clearFilters}
            className="text-primary text-sm font-medium hover:underline ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden pt-4 pb-2 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] font-sans">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-on-surface-variant font-bold border-b border-surface-container">
                <th className="px-6 py-4">Beneficiary Name</th>
                <th className="px-6 py-4">District / Location</th>
                <th className="px-6 py-4">Socio-Economic Progress</th>
                <th className="px-6 py-4">Program Linkage</th>
                <th className="px-6 py-4">Resilience Index (KYOR)</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {filteredBeneficiaries.map((b, index) => (
                <tr
                  key={b.id}
                  className={`hover:bg-surface-container-low/50 transition-colors ${
                    index > 0 ? "border-t border-surface-container-low" : ""
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {b.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{b.name}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">ID: {b.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-on-surface font-semibold">{b.location}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">{b.income}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden max-w-[100px]">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${b.tierPercent}%` }}></div>
                      </div>
                      <span className="text-xs text-on-surface font-bold">{b.tier}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {b.programs.map((p, i) => (
                        <span key={i} className="bg-primary-fixed/20 text-on-primary-fixed text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
                      <span>{b.resilienceScore} / 100</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link
                      href={`/beneficiaries/${encodeURIComponent(b.name.replace(/\s+/g, '-'))}`}
                      className="text-primary hover:bg-primary/5 px-4 py-1.5 rounded-full text-xs font-bold transition-all inline-block hover:underline"
                    >
                      View File
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredBeneficiaries.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 text-xs font-sans">
                    No beneficiary records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
