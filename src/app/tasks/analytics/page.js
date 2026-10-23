"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  Completed: "#10b981",
  Blocked: "#ef4444",
  Cancelled: "#94a3b8",
};

const PRIORITY_COLORS = {
  Low: "#94a3b8",
  Medium: "#3b82f6",
  High: "#f59e0b",
  Urgent: "#ef4444",
};

function DonutChart({ data, colors }) {
  const [active, setActive] = useState(null);
  const entries = Object.entries(data || {}).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = entries.map(([label, value]) => {
    const length = total ? (value / total) * circumference : 0;
    const segment = { label, value, length, offset };
    offset += length;
    return segment;
  });

  if (!entries.length) {
    return <p className="text-xs text-slate-500 text-center py-8">No priority data yet.</p>;
  }

  const activeEntry = active ? entries.find(([label]) => label === active) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="18" />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={colors[segment.label] || "#64748b"}
              strokeWidth={active === segment.label ? "22" : "18"}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setActive(segment.label)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {activeEntry ? activeEntry[1] : total}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            {activeEntry ? activeEntry[0] : "Total"}
          </span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2">
        {entries.map(([label, value]) => {
          const percent = total ? Math.round((value / total) * 100) : 0;
          return (
            <button
              key={label}
              type="button"
              onMouseEnter={() => setActive(label)}
              onMouseLeave={() => setActive(null)}
              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                active === label ? "bg-slate-100 dark:bg-slate-800" : ""
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[label] || "#64748b" }} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex-1">{label}</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{value}</span>
              <span className="text-[10px] text-slate-500 w-9 text-right">{percent}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrendChart({ trend }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [visible, setVisible] = useState({ assigned: true, completed: true });
  const width = 600;
  const height = 180;
  const paddingX = 18;
  const paddingY = 20;
  const max = Math.max(1, ...trend.map((item) => Math.max(item.assigned, item.completed)));
  const xFor = (index) => paddingX + (index / Math.max(1, trend.length - 1)) * (width - paddingX * 2);
  const yFor = (value) => height - paddingY - (value / max) * (height - paddingY * 2);
  const lineFor = (key) =>
    trend.map((item, index) => `${xFor(index)},${yFor(item[key])}`).join(" ");
  const active = activeIndex != null ? trend[activeIndex] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {[
          { key: "assigned", label: "Assigned", color: "#3b82f6" },
          { key: "completed", label: "Completed", color: "#10b981" },
        ].map((series) => (
          <button
            key={series.key}
            type="button"
            onClick={() => setVisible((prev) => ({ ...prev, [series.key]: !prev[series.key] }))}
            className={`flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2 py-1 transition-opacity ${
              visible[series.key] ? "text-slate-600 dark:text-slate-300" : "text-slate-300 opacity-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </button>
        ))}
        {active && (
          <span className="ml-auto text-[10px] font-bold text-slate-500">
            {active.date}: {active.assigned} assigned · {active.completed} completed
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={paddingX}
            x2={width - paddingX}
            y1={height - paddingY - fraction * (height - paddingY * 2)}
            y2={height - paddingY - fraction * (height - paddingY * 2)}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="1"
          />
        ))}
        {visible.assigned && <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={lineFor("assigned")} />}
        {visible.completed && <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={lineFor("completed")} />}
        {trend.map((item, index) => (
          <g key={item.date}>
            <rect
              x={xFor(index) - (width / trend.length) / 2}
              y={0}
              width={width / trend.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex((current) => (current === index ? null : index))}
            />
            {activeIndex === index && (
              <line x1={xFor(index)} x2={xFor(index)} y1={paddingY} y2={height - paddingY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            )}
            {visible.assigned && (
              <circle cx={xFor(index)} cy={yFor(item.assigned)} r={activeIndex === index ? 4 : 2} fill="#3b82f6" />
            )}
            {visible.completed && (
              <circle cx={xFor(index)} cy={yFor(item.completed)} r={activeIndex === index ? 4 : 2} fill="#10b981" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function CalendarHeatmap({ calendar }) {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const values = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    values.push({ day, key, value: calendar[key] || 0 });
  }
  const max = Math.max(1, ...values.map((item) => item.value));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMonthDate(new Date(year, month - 1, 1))}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {monthDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setMonthDate(new Date(year, month + 1, 1))}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-[9px] font-bold uppercase tracking-wider text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square rounded-lg bg-transparent" />
        ))}
        {values.map((item) => {
          const intensity = item.value === 0 ? 0.04 : 0.15 + (item.value / max) * 0.75;
          return (
            <div
              key={item.key}
              title={`${item.day} ${monthDate.toLocaleString("default", { month: "short" })} ${year}: ${item.value} deadline${item.value === 1 ? "" : "s"}`}
              className={`aspect-square rounded-lg p-1 flex flex-col justify-between border transition-transform hover:scale-[1.04] ${
                item.key === todayKey
                  ? "border-emerald-500 ring-1 ring-emerald-500/40"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: `rgba(26, 122, 94, ${intensity})` }}
            >
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 leading-none">{item.day}</span>
              {item.value > 0 && (
                <span className="self-end text-[9px] font-black text-white bg-emerald-700/80 rounded px-1 leading-tight">
                  {item.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-slate-500">
        <span>Less</span>
        {[0.04, 0.2, 0.4, 0.6, 0.9].map((alpha) => (
          <span key={alpha} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(26, 122, 94, ${alpha})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function TaskAnalyticsPage() {
  const { token, user, can } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!can("task-analytics") && user?.roleName !== "ADMIN") {
    return (
      <div className="p-10 text-center">
        <p className="text-sm font-bold text-rose-600">Task analytics is available to administrators only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="page-title text-on-surface">Task Analytics</h1>
        <p className="text-sm text-on-surface-variant mt-2">Organisation-wide task volume, completion and deadline trends.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading analytics...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">{error}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: "Total", value: data.counts.total, icon: "checklist", color: "text-slate-700 bg-slate-100" },
              { label: "Completed", value: data.counts.completed, icon: "task_alt", color: "text-emerald-700 bg-emerald-100" },
              { label: "Pending", value: data.counts.pending, icon: "pending_actions", color: "text-amber-700 bg-amber-100" },
              { label: "Overdue", value: data.counts.overdue, icon: "warning", color: "text-rose-700 bg-rose-100" },
              { label: "Due Today", value: data.counts.dueToday, icon: "today", color: "text-blue-700 bg-blue-100" },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <span className={`material-symbols-outlined rounded-xl p-2 ${card.color}`}>{card.icon}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Assigned vs Completed</h2>
              <TrendChart trend={data.trend} />
            </section>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Deadline Calendar</h2>
              <CalendarHeatmap calendar={data.calendar} />
            </section>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Tasks by Priority</h2>
              <DonutChart data={data.byPriority} colors={PRIORITY_COLORS} />
            </section>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Tasks by Status</h2>
              <DonutChart data={data.byStatus} colors={STATUS_COLORS} />
            </section>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">By Assignee</h2>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden space-y-3">
              {data.assignees.map((row) => (
                <div key={row.id || row.name} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words">{row.name}</p>
                      <p className="text-[10px] text-slate-500">{row.role?.replaceAll("_", " ") || "—"}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 shrink-0">{row.completionRate}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{row.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Done</p>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{row.completed}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-rose-600">Overdue</p>
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{row.overdue}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                    <div className="h-full bg-emerald-500" style={{ width: `${row.completionRate}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3">Completed</th>
                    <th className="py-2 px-3">Overdue</th>
                    <th className="py-2 pl-3">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assignees.map((row) => (
                    <tr key={row.id || row.name} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                      <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100">{row.name}</td>
                      <td className="py-3 px-3 text-slate-500">{row.role?.replaceAll("_", " ") || "—"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{row.total}</td>
                      <td className="py-3 px-3 text-emerald-600 font-semibold">{row.completed}</td>
                      <td className="py-3 px-3 text-rose-600 font-semibold">{row.overdue}</td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${row.completionRate}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{row.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
