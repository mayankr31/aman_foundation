"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { getISTDateKey } from "@/lib/time";

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

const STATUS_BADGE = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Blocked: "bg-rose-100 text-rose-800",
  Cancelled: "bg-slate-200 text-slate-600",
};

const STATUS_DOT = {
  Pending: "bg-amber-500",
  "In Progress": "bg-blue-500",
  Completed: "bg-emerald-500",
  Blocked: "bg-rose-500",
  Cancelled: "bg-slate-400",
};

function isIncompleteStatus(status) {
  return status !== "Completed" && status !== "Cancelled";
}

const PRIORITY_BADGE = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-100 text-blue-800",
  High: "bg-amber-100 text-amber-800",
  Urgent: "bg-rose-100 text-rose-800",
};

function DonutChart({ data, colors, emptyLabel = "No data yet." }) {
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
    return <p className="text-xs text-slate-500 text-center py-8">{emptyLabel}</p>;
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

function TodayBarChart({ counts, date }) {
  const total = counts?.total || 0;
  const completed = counts?.completed || 0;
  const pending = counts?.pending || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const width = 600;
  const height = 200;
  const paddingX = 48;
  const paddingTop = 28;
  const baseline = height - 42;
  const chartHeight = baseline - paddingTop;
  const max = Math.max(1, total, completed);
  const barWidth = 96;
  const gap = 64;
  const center = width / 2;
  const bars = [
    { label: "Assigned", value: total, color: "#3b82f6", x: center - gap / 2 - barWidth },
    { label: "Completed", value: completed, color: "#10b981", x: center + gap / 2 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Today · {formatDayLabel(date)}
        </p>
        <span className="text-[10px] font-bold text-amber-700">{pending} pending</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" role="img" aria-label="Assigned vs completed tasks for today">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = baseline - fraction * chartHeight;
          return (
            <line
              key={fraction}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
            />
          );
        })}
        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={baseline}
          y2={baseline}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-700"
          strokeWidth="1.5"
        />
        {bars.map((bar) => {
          const barHeight = (bar.value / max) * chartHeight;
          const y = baseline - barHeight;
          return (
            <g key={bar.label}>
              <rect
                x={bar.x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, bar.value > 0 ? 2 : 0)}
                rx="6"
                fill={bar.color}
              />
              <text
                x={bar.x + barWidth / 2}
                y={Math.max(y - 8, paddingTop - 4)}
                textAnchor="middle"
                className="fill-slate-800 dark:fill-white"
                fontSize="16"
                fontWeight="700"
              >
                {bar.value}
              </text>
              <text
                x={bar.x + barWidth / 2}
                y={baseline + 24}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize="12"
                fontWeight="600"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-slate-500">
        {total ? `${completionRate}% of today's tasks are completed.` : "No tasks planned or due today."}
      </p>
    </div>
  );
}

function TodayTaskList({ tasks = [] }) {
  if (!tasks.length) {
    return <p className="text-[11px] text-slate-500">No tasks</p>;
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-1.5 min-w-0">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[task.status] || "bg-slate-400"}`} />
          <p className={`min-w-0 flex-1 text-[11px] leading-snug break-words ${
            task.status === "Completed"
              ? "line-through text-slate-400"
              : "text-slate-700 dark:text-slate-200"
          }`}>
            {task.title}
          </p>
          <span className={`shrink-0 text-[8px] font-bold uppercase px-1 py-0.5 rounded ${STATUS_BADGE[task.status] || "bg-slate-100 text-slate-700"}`}>
            {task.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatDayLabel(dateKey) {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T12:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function CalendarHeatmap({ calendar, showingToday = false }) {
  const { token } = useAuth();
  const now = new Date();
  const todayKey = getISTDateKey(now);
  const [monthDate, setMonthDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayTasks, setDayTasks] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState("");

  useEffect(() => {
    if (!showingToday) return;
    const current = new Date();
    setMonthDate(new Date(current.getFullYear(), current.getMonth(), 1));
  }, [showingToday]);

  const openDay = async (dateKey) => {
    if (!token) return;
    setSelectedDate(dateKey);
    setDayTasks([]);
    setDayError("");
    setDayLoading(true);
    try {
      const res = await fetch(`/api/tasks/analytics?deadline=${encodeURIComponent(dateKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load tasks");
      setDayTasks(json.data?.tasks || []);
    } catch (err) {
      setDayError(err.message || "Failed to load tasks");
    } finally {
      setDayLoading(false);
    }
  };

  const closeDay = () => {
    setSelectedDate(null);
    setDayTasks([]);
    setDayError("");
  };

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const values = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = calendar?.[key];
    const total = typeof entry === "number" ? entry : entry?.total || 0;
    const incomplete = typeof entry === "number" ? 0 : entry?.incomplete || 0;
    values.push({ day, key, total, incomplete });
  }
  const max = Math.max(1, ...values.map((item) => item.total));
  const dayIncompleteCount = dayTasks.filter((task) => isIncompleteStatus(task.status)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
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
          const intensity = item.total === 0 ? 0.04 : 0.15 + (item.total / max) * 0.75;
          const hasIncomplete = item.incomplete > 0;
          const color = hasIncomplete ? "217, 119, 6" : "26, 122, 94";
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => item.total > 0 && openDay(item.key)}
              disabled={item.total === 0}
              title={`${item.day} ${monthDate.toLocaleString("default", { month: "short" })} ${year}: ${item.total} deadline${item.total === 1 ? "" : "s"}${hasIncomplete ? ` · ${item.incomplete} incomplete` : ""}`}
              className={`aspect-square rounded-lg p-1 flex flex-col justify-between border transition-transform text-left ${
                item.total > 0 ? "cursor-pointer hover:scale-[1.04]" : "cursor-default"
              } ${
                item.key === todayKey
                  ? "border-emerald-500 ring-1 ring-emerald-500/40"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: `rgba(${color}, ${intensity})` }}
            >
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 leading-none">{item.day}</span>
              {item.total > 0 && (
                <span className={`self-end text-[9px] font-black text-white rounded px-1 leading-tight ${hasIncomplete ? "bg-amber-600/80" : "bg-emerald-700/80"}`}>
                  {item.total}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700/80" />
            Completed only
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-600/80" />
            Incomplete
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0.04, 0.2, 0.4, 0.6, 0.9].map((alpha) => (
            <span key={alpha} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(26, 122, 94, ${alpha})` }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {showingToday && !values.some((item) => item.total > 0) && (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          No tasks have a deadline today.
        </p>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Tasks due</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDayLabel(selectedDate)}
                  {dayTasks.length > 0
                    ? ` · ${dayTasks.length - dayIncompleteCount} completed, ${dayIncompleteCount} incomplete`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDay}
                className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>

            {dayLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading tasks...</p>
            ) : dayError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {dayError}
              </p>
            ) : dayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No tasks have a deadline on this date.</p>
            ) : (
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-xl border p-3 ${
                      isIncompleteStatus(task.status)
                        ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-900/10"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">
                      {task.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_BADGE[task.status] || "bg-slate-100 text-slate-700"}`}>
                        {task.status}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${PRIORITY_BADGE[task.priority] || "bg-slate-100 text-slate-700"}`}>
                        {task.priority}
                      </span>
                      {task.assignee?.name && (
                        <span className="text-[10px] text-slate-500">
                          {task.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Task analytics panel for the dashboard.
 * Uses the same reporting-line scoped API (`/api/tasks/analytics`) so results
 * are identical to the previous standalone analytics page.
 */
export default function TaskAnalytics() {
  const { token, user, can } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("today");
  const showingToday = range === "today";

  const allowed = can("task-analytics") || user?.roleName === "ADMIN";

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
    if (!allowed) return;
    load();
  }, [allowed, load]);

  if (!allowed) return null;

  return (
    <section id="task-analytics" className="space-y-4 scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Task Analytics</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {user?.roleName === "ADMIN"
              ? "Organisation-wide task volume, completion and deadline trends."
              : "Your tasks, your team's tasks and tasks you assigned."}
          </p>
        </div>
        <div className="inline-flex shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setRange("today")}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              showingToday
                ? "bg-primary text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              !showingToday
                ? "bg-primary text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All time
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading analytics...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">{error}</div>
      ) : data ? (
        <>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {showingToday ? `Today · ${formatDayLabel(data.today?.date)}` : "All time"}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {(showingToday
                ? [
                    { label: "Total", value: data.today?.counts?.total ?? 0, icon: "checklist", color: "text-slate-700 bg-slate-100" },
                    { label: "Completed", value: data.today?.counts?.completed ?? 0, icon: "task_alt", color: "text-emerald-700 bg-emerald-100" },
                    { label: "Pending", value: data.today?.counts?.pending ?? 0, icon: "pending_actions", color: "text-amber-700 bg-amber-100" },
                    { label: "Overdue", value: data.today?.counts?.overdue ?? 0, icon: "warning", color: "text-rose-700 bg-rose-100" },
                    { label: "Due Today", value: data.counts.dueToday, icon: "today", color: "text-blue-700 bg-blue-100" },
                  ]
                : [
                    { label: "Total", value: data.counts.total, icon: "checklist", color: "text-slate-700 bg-slate-100" },
                    { label: "Completed", value: data.counts.completed, icon: "task_alt", color: "text-emerald-700 bg-emerald-100" },
                    { label: "Pending", value: data.counts.pending, icon: "pending_actions", color: "text-amber-700 bg-amber-100" },
                    { label: "Overdue", value: data.counts.overdue, icon: "warning", color: "text-rose-700 bg-rose-100" },
                    { label: "Due Today", value: data.counts.dueToday, icon: "today", color: "text-blue-700 bg-blue-100" },
                  ]
              ).map((card) => (
                <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between last:col-span-2 lg:last:col-span-1">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                  </div>
                  <span className={`material-symbols-outlined rounded-xl p-2 ${card.color}`}>{card.icon}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Assigned vs Completed</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                  {showingToday ? `Today · ${formatDayLabel(data.today?.date)}` : "All time · last 30 days"}
                </span>
              </div>
              {showingToday ? (
                <TodayBarChart counts={data.today?.counts} date={data.today?.date} />
              ) : (
                <TrendChart trend={data.trend} />
              )}
            </section>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Deadline Calendar</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                  {showingToday ? "Today" : "All time"}
                </span>
              </div>
              <CalendarHeatmap
                calendar={showingToday ? data.today?.calendar : data.calendar}
                showingToday={showingToday}
              />
            </section>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tasks by Priority</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                  {showingToday ? `Today · ${formatDayLabel(data.today?.date)}` : "All time"}
                </span>
              </div>
              <DonutChart
                data={showingToday ? data.today?.byPriority : data.byPriority}
                colors={PRIORITY_COLORS}
                emptyLabel={showingToday ? "No tasks today." : "No priority data yet."}
              />
            </section>
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tasks by Status</h3>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                  {showingToday ? `Today · ${formatDayLabel(data.today?.date)}` : "All time"}
                </span>
              </div>
              <DonutChart
                data={showingToday ? data.today?.byStatus : data.byStatus}
                colors={STATUS_COLORS}
                emptyLabel={showingToday ? "No tasks today." : "No status data yet."}
              />
            </section>
          </div>

          {!showingToday && (
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">By Assignee</h3>
              <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                All time
              </span>
            </div>

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
                  </tr>
                </thead>
                <tbody>
                  {data.assignees.map((row) => (
                    <tr key={row.id || row.name} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                      <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100">{row.name}</td>
                      <td className="py-3 px-3 text-slate-500">{row.role?.replaceAll("_", " ") || "—"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{row.total}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${row.completionRate}%` }} />
                          </div>
                          <span className="text-emerald-600 font-semibold">{row.completed} / {row.total}</span>
                          <span className="text-[10px] font-bold text-slate-500">{row.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-rose-600 font-semibold">{row.overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          )}

          {showingToday && (
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">By Assignee</h3>
              <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
                {formatDayLabel(data.today?.date)}
              </span>
            </div>

            {!data.today?.assignees?.length ? (
              <p className="py-8 text-center text-sm text-slate-500">No tasks planned or due today.</p>
            ) : (
              <>
                {/* Mobile / tablet cards */}
                <div className="lg:hidden space-y-3">
                  {data.today.assignees.map((row) => (
                    <div key={row.id || row.name} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words">{row.name}</p>
                          <p className="text-[10px] text-slate-500">{row.role?.replaceAll("_", " ") || "—"}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 shrink-0">{row.completionRate}%</span>
                      </div>
                      <div className="mt-3">
                        <TodayTaskList tasks={row.tasks} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Tasks</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{row.total}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Completed</p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{row.completed} / {row.total}</p>
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
                        <th className="py-2 px-3">Today&apos;s Tasks</th>
                        <th className="py-2 px-3">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.today.assignees.map((row) => (
                        <tr key={row.id || row.name} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                          <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-100">{row.name}</td>
                          <td className="py-3 px-3 text-slate-500">{row.role?.replaceAll("_", " ") || "—"}</td>
                          <td className="py-3 px-3 max-w-md">
                            <TodayTaskList tasks={row.tasks} />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${row.completionRate}%` }} />
                              </div>
                              <span className="text-emerald-600 font-semibold">{row.completed} / {row.total}</span>
                              <span className="text-[10px] font-bold text-slate-500">{row.completionRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
          )}
        </>
      ) : null}
    </section>
  );
}
