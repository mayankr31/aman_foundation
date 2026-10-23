"use client";

import { useEffect, useState } from "react";
import { formatDuration, getISTDateKey, msUntilNextISTMidnight } from "@/lib/time";

function legacyCheckInDate(log) {
  if (!log?.intimelog) return null;
  const parts = String(log.intimelog).trim().split(/\s+/);
  const [timePart, modifierRaw] = parts;
  const [h, m, s] = String(timePart).split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const modifier = (modifierRaw || "").toUpperCase();
  let hours = h;
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, m, s || 0, 0);
  return date;
}

export default function AttendanceTimer({ log, compact = false }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!log || log.outtimelog) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    let midnightTimer = null;
    const scheduleMidnight = () => {
      midnightTimer = setTimeout(() => {
        setNow(Date.now());
        scheduleMidnight();
      }, msUntilNextISTMidnight());
    };
    scheduleMidnight();
    return () => {
      clearInterval(interval);
      if (midnightTimer) clearTimeout(midnightTimer);
    };
  }, [log]);

  if (!log || !log.intimelog) return null;

  const checkInAt = log.checkInAt ? new Date(log.checkInAt) : legacyCheckInDate(log);
  const isComplete = !!log.outtimelog;

  let seconds = 0;
  if (isComplete) {
    seconds = Number(log.workSeconds) || 0;
    if (!seconds && checkInAt && log.checkOutAt) {
      seconds = Math.max(0, Math.floor((new Date(log.checkOutAt).getTime() - checkInAt.getTime()) / 1000));
    }
  } else if (checkInAt) {
    // Do not carry a running timer into the next IST day.
    if (getISTDateKey(checkInAt) !== getISTDateKey(new Date(now))) {
      seconds = 0;
    } else {
      seconds = Math.max(0, Math.floor((now - checkInAt.getTime()) / 1000));
    }
  }

  const label = isComplete ? "Worked" : "Working";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tabular-nums ${
          isComplete
            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40"
        }`}
        title={`${label} time`}
      >
        <span className={`material-symbols-outlined text-[16px] ${isComplete ? "" : "animate-pulse"}`}>
          {isComplete ? "verified" : "timer"}
        </span>
        {formatDuration(seconds)}
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
        isComplete
          ? "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
          : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40"
      }`}
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{label} Time</p>
        <p className={`text-xl font-bold tabular-nums ${isComplete ? "text-slate-700 dark:text-slate-200" : "text-emerald-700 dark:text-emerald-400"}`}>
          {formatDuration(seconds)}
        </p>
      </div>
      <span className={`material-symbols-outlined ${isComplete ? "text-slate-400" : "text-emerald-600 animate-pulse"}`}>
        {isComplete ? "task_alt" : "timer"}
      </span>
    </div>
  );
}
