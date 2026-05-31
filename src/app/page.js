"use client";

import { useState } from "react";

export default function Dashboard() {
  const [activeYear, setActiveYear] = useState(2024);

  // Mock data for years
  const metrics = {
    2024: {
      beneficiaries: "12,450",
      beneficiariesGrowth: "+14%",
      activeFellows: "342",
      activeFellowsPercent: 85,
      schoolsReached: "128",
      livelihoodPrograms: "4,820",
      chartHeights: [30, 45, 60, 75, 90],
      chartValues: ["1,500", "2,250", "3,000", "3,750", "4,500"],
    },
    2023: {
      beneficiaries: "10,920",
      beneficiariesGrowth: "+9%",
      activeFellows: "298",
      activeFellowsPercent: 78,
      schoolsReached: "112",
      livelihoodPrograms: "4,110",
      chartHeights: [25, 40, 50, 65, 80],
      chartValues: ["1,200", "1,900", "2,400", "3,100", "3,800"],
    },
  };

  const data = metrics[activeYear];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.75rem] font-bold tracking-[-0.02em] text-on-surface leading-tight">
            YTD Impact Snapshot
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">Data updated: Today, 09:41 AM</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Report
          </button>
          <button className="px-5 py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-medium shadow-[0_8px_24px_rgba(0,104,87,0.2)] hover:shadow-[0_4px_12px_rgba(0,104,87,0.3)] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            New Entry
          </button>
        </div>
      </div>

      {/* Key Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] flex flex-col justify-between pt-8 pl-8">
          <div>
            <span className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant block mb-2">
              Total Beneficiaries
            </span>
            <div className="text-4xl font-bold text-on-surface tracking-tight">
              {data.beneficiaries}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center bg-primary-fixed/20 text-on-primary-fixed px-2 py-0.5 rounded text-xs font-medium">
              <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>{" "}
              {data.beneficiariesGrowth}
            </span>
            <span className="text-xs text-on-surface-variant">vs last quarter</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] flex flex-col justify-between pt-8 pl-8">
          <div>
            <span className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant block mb-2">
              Active Fellows
            </span>
            <div className="text-4xl font-bold text-on-surface tracking-tight">
              {data.activeFellows}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-full bg-surface-container-highest rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full shadow-[0_0_8px_rgba(0,104,87,0.5)] transition-all duration-500"
                style={{ width: `${data.activeFellowsPercent}%` }}
              ></div>
            </div>
            <span className="text-xs text-on-surface-variant whitespace-nowrap">
              {data.activeFellowsPercent}% deployed
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] flex flex-col justify-between pt-8 pl-8">
          <div>
            <span className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant block mb-2">
              Schools Reached
            </span>
            <div className="text-4xl font-bold text-on-surface tracking-tight">
              {data.schoolsReached}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center bg-surface-container text-on-surface px-2 py-0.5 rounded text-xs font-medium">
              Target: 150
            </span>
          </div>
        </div>

        {/* Metric 4 (Highlight/Accent) */}
        <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 shadow-[0_12px_32px_rgba(0,104,87,0.25)] flex flex-col justify-between pt-8 pl-8 text-on-primary">
          <div>
            <span className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-primary/80 block mb-2">
              Livelihood Programs
            </span>
            <div className="text-4xl font-bold tracking-tight">{data.livelihoodPrograms}</div>
            <span className="text-sm text-on-primary/90 mt-1 block">Families Supported</span>
          </div>
          <div className="mt-4">
            <button className="text-xs font-medium text-primary-fixed hover:text-white transition-colors flex items-center gap-1">
              View Livelihood Details{" "}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Impact Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Education Chart Area */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(25,28,29,0.04)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-on-surface tracking-tight">
              Education Enrollment Growth
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveYear(2023)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  activeYear === 2023
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                2023
              </button>
              <button
                onClick={() => setActiveYear(2024)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  activeYear === 2024
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                2024
              </button>
            </div>
          </div>
          {/* Chart Area */}
          <div className="h-64 flex items-end justify-between gap-2 border-b border-surface-container-highest pb-2 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant pointer-events-none">
              <span>5k</span>
              <span>4k</span>
              <span>3k</span>
              <span>2k</span>
              <span>1k</span>
              <span>0</span>
            </div>
            <div className="w-8 ml-8"></div> {/* spacer */}
            {/* Bars */}
            {data.chartHeights.map((height, i) => {
              const barClasses = [
                "bg-primary/20 hover:bg-primary/30",
                "bg-primary/40 hover:bg-primary/50",
                "bg-primary/60 hover:bg-primary/70",
                "bg-primary/80 hover:bg-primary/90",
                "bg-primary shadow-[0_0_8px_rgba(0,104,87,0.3)]"
              ];
              return (
                <div
                  key={i}
                  className={`w-full max-w-[40px] rounded-t-sm transition-colors relative group ${barClasses[i]}`}
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-xs py-1 px-2 rounded shadow-md hidden group-hover:block z-10">
                    {data.chartValues[i]}
                  </div>
                </div>
              );
            })}
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between items-center mt-3 ml-10 text-[11px] text-on-surface-variant font-medium">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(25,28,29,0.04)] p-8 flex flex-col">
          <h3 className="text-lg font-bold text-on-surface tracking-tight mb-6">Program Highlights</h3>
          <div className="space-y-6 flex-1">
            {/* Item 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed-dim/20 flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">agriculture</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">Goat Rearing Phase 2</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Distribution of 500 livestock to identified families in Ward 4 completed ahead of
                  schedule.
                </p>
                <span className="text-[10px] text-on-surface-variant/70 mt-2 block uppercase tracking-wider">
                  2 days ago
                </span>
              </div>
            </div>
            {/* Item 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">New Fellow Cohort</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  45 new fellows onboarded and assigned to 12 target schools in the northern district.
                </p>
                <span className="text-[10px] text-on-surface-variant/70 mt-2 block uppercase tracking-wider">
                  5 days ago
                </span>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-2.5 text-sm font-medium text-primary hover:bg-surface-container rounded-lg transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
