"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { formatDate } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";
import Avatar from "@/components/ui/Avatar";

function Initial({ name, avatar, tone = "teal" }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const classes =
    tone === "amber"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
  return (
    <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 ${classes}`}>
      <Avatar src={avatar} name={name} fallback={initial} />
    </div>
  );
}

export default function TeamToday() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/dashboard/team-today", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading || !data || !data.hasTeam) return null;

  const birthdays = data.birthdays || [];
  const onLeave = data.onLeave || [];

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Team Today</h2>
          <p className="text-xs text-on-surface-variant mt-1">{formatDate(data?.date || new Date())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-ambient p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">cake</span>
              <h3 className="font-bold text-on-surface">Birthdays Today</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              {birthdays.length}
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-on-surface-variant py-3">Loading...</p>
          ) : birthdays.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-3">No birthdays today.</p>
          ) : (
            <div className="space-y-2">
              {birthdays.map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100/70 dark:border-amber-900/20 px-3 py-2.5">
                  <Initial name={person.name} avatar={person.avatar} tone="amber" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface truncate">{person.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {formatRoleLabel(person.role)}
                      {person.department ? ` · ${person.department}` : ""}
                    </p>
                  </div>
                  <span className="text-lg" aria-hidden="true">🎂</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-ambient p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">event_busy</span>
              <h3 className="font-bold text-on-surface">On Leave Today</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              {onLeave.length}
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-on-surface-variant py-3">Loading...</p>
          ) : onLeave.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-3">No team members are on leave today.</p>
          ) : (
            <div className="space-y-2">
              {onLeave.map((leave) => (
                <div key={leave.id} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-3 py-2.5">
                  <Initial name={leave.user?.name} avatar={leave.user?.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface truncate">{leave.user?.name || "Employee"}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {formatRoleLabel(leave.user?.role)}
                      {leave.leaveTypes?.length ? ` · ${leave.leaveTypes.join(", ")}` : ""}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300" aria-hidden="true">beach_access</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
