"use client";

import Link from "next/link";
import { useState } from "react";

export default function GoatRearing() {
  const [timeframe, setTimeframe] = useState("1 Year");

  // Trajectory data
  const trajectoryHeights = {
    "6 Months": [40, 50, 60, 45, 55],
    "1 Year": [30, 45, 60, 75, 90],
  };

  const heights = trajectoryHeights[timeframe];

  return (
    <div className="p-8 flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <Link
        href="/livelihood"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to Livelihood Hub
        </span>
      </Link>
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[2.75rem] font-headline tracking-[-0.02em] leading-tight text-on-surface mb-2">
            Goat Rearing Distribution &amp; Health
          </h2>
          <p className="text-on-surface-variant font-body text-sm max-w-2xl">
            Monitoring livelihood impact through livestock distribution metrics, health tracking, and return on investment for rural beneficiaries.
          </p>
        </div>
        <button className="gradient-primary text-on-primary px-6 py-3 rounded-full font-label text-xs uppercase tracking-[0.05em] flex items-center gap-2 hover:opacity-90 transition-opacity ambient-shadow">
          <span className="material-symbols-outlined text-sm">download</span>
          Export Data
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metrics Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Metric Card 1 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block">
              Total Beneficiaries
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold text-primary">1,248</span>
              <span className="text-sm font-medium text-primary-fixed-dim bg-primary-fixed/20 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">trending_up</span> +12%
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 pt-4 border-t border-surface-container">
              Across 32 active villages
            </p>
          </div>

          {/* Metric Card 2 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 ambient-shadow">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block">
              Active Livestock
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold text-on-surface">3,740</span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Adults</span>
                <span className="font-medium text-on-surface">2,100</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "60%" }}></div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-on-surface-variant">Kids</span>
                <span className="font-medium text-on-surface">1,640</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                <div className="bg-primary-container h-1.5 rounded-full" style={{ width: "40%" }}></div>
              </div>
            </div>
          </div>

          {/* Metric Card 3 */}
          <div className="bg-primary rounded-lg p-6 pt-8 pl-8 ambient-shadow text-on-primary">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-primary/80 mb-4 block">
              Avg. Household ROI
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold">145%</span>
            </div>
            <p className="text-xs text-on-primary/70 mt-4 font-body leading-relaxed">
              Estimated return over 24 months based on initial capital investment and organic herd growth.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Chart Section */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 ambient-shadow flex-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline text-lg font-medium text-on-surface">Outcome Trajectory</h3>
              <div className="flex gap-2">
                <span
                  onClick={() => setTimeframe("6 Months")}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    timeframe === "6 Months"
                      ? "bg-surface-container-high text-on-surface"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  6 Months
                </span>
                <span
                  onClick={() => setTimeframe("1 Year")}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    timeframe === "1 Year"
                      ? "bg-surface-container-high text-on-surface"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  1 Year
                </span>
              </div>
            </div>

            {/* Simulated Chart Bars */}
            <div className="w-full h-64 relative flex items-end justify-between px-4">
              <div
                className="w-12 bg-primary-container/20 rounded-t-sm relative group transition-all duration-500"
                style={{ height: `${heights[0]}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-inverse-surface text-inverse-on-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Q1
                </div>
              </div>
              <div
                className="w-12 bg-primary-container/40 rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[1]}%` }}
              ></div>
              <div
                className="w-12 bg-primary-container/60 rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[2]}%` }}
              ></div>
              <div
                className="w-12 bg-primary/80 rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[3]}%` }}
              ></div>
              <div
                className="w-12 gradient-primary rounded-t-sm shadow-[0_0_12px_rgba(0,104,87,0.4)] transition-all duration-500"
                style={{ height: `${heights[4]}%` }}
              ></div>

              {/* Connecting Line */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <path
                  d="M 40 180 Q 150 150 250 120 T 450 60 T 650 20"
                  fill="none"
                  opacity="0.6"
                  stroke="#fc820c"
                  strokeDasharray="6,4"
                  strokeWidth="3"
                ></path>
              </svg>
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant mt-4 px-4 border-t border-surface-container pt-4">
              <span>Bartari</span>
              <span>Digjani</span>
              <span>Sawpur</span>
              <span>Balikuri</span>
              <span>Gunialguri</span>
            </div>
          </div>

          {/* Livestock Health Logs */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 ambient-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-lg font-medium text-on-surface">Recent Livestock Health Logs</h3>
              <button className="text-primary text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="flex flex-col gap-4">
              {/* Log Item 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-container transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm">pets</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-on-surface">Tag #GR-4092</p>
                    <p className="text-xs text-on-surface-variant">Beneficiary: Fatima Bi</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-surface-container sm:border-none">
                  <span className="text-xs text-on-surface-variant">Checked: Today</span>
                  <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                    Healthy
                  </span>
                </div>
              </div>
              {/* Log Item 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-container transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-sm">medical_services</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-on-surface">Tag #GR-4105</p>
                    <p className="text-xs text-on-surface-variant">Beneficiary: Rahim Khan</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-surface-container sm:border-none">
                  <span className="text-xs text-on-surface-variant">Checked: Yesterday</span>
                  <span className="bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                    Needs Check
                  </span>
                </div>
              </div>
              {/* Log Item 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-container transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm">pets</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-on-surface">Tag #GR-3988</p>
                    <p className="text-xs text-on-surface-variant">Beneficiary: Amina Begum</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-surface-container sm:border-none">
                  <span className="text-xs text-on-surface-variant">Checked: 2d ago</span>
                  <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                    Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
