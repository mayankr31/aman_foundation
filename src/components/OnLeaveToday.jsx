"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

export default function OnLeaveToday({ className = "" }) {
  const { token } = useAuth();
  const [state, setState] = useState({ loading: true, data: [], hasTeam: false });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    fetch("/api/leaves/today", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        setState({
          loading: false,
          data: json.data || [],
          hasTeam: !!json.meta?.hasTeam,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, data: [], hasTeam: false });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.loading || !state.hasTeam) return null;

  return (
    <div className={`rounded-xl border border-amber-100 bg-amber-50/70 dark:bg-amber-900/10 dark:border-amber-900/20 px-4 py-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-amber-600 text-[20px]">event_busy</span>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
            On Leave Today
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {state.data.length}
          </span>
        </div>
        {state.data.length === 0 ? (
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            No team members are on leave today.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 min-w-0">
            {state.data.map((leave) => (
              <span
                key={leave.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-slate-900/50 border border-amber-100 dark:border-amber-900/30 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                title={leave.leaveTypes?.join(", ") || "Leave"}
              >
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                  {(leave.user?.name || "?").charAt(0).toUpperCase()}
                </span>
                <span className="truncate max-w-[180px]">{leave.user?.name || "Employee"}</span>
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  {leave.leaveTypes?.length ? `· ${leave.leaveTypes.join(", ")}` : ""}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
