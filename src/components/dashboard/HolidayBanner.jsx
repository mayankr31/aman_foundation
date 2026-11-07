"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

export default function HolidayBanner() {
  const { token } = useAuth();
  const [holiday, setHoliday] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/holidays/today", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success) setHoliday(json.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!holiday) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 sm:px-5">
      <span className="material-symbols-outlined text-sky-600 shrink-0">celebration</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-sky-900">
          Today is a holiday: {holiday.name}
        </p>
        <p className="text-xs text-sky-800 mt-0.5">
          {holiday.type === "RESTRICTED"
            ? "Restricted holiday"
            : holiday.type === "OPTIONAL"
              ? "Optional holiday"
              : "Public holiday"}
          {holiday.description ? ` · ${holiday.description}` : ""}
        </p>
      </div>
    </div>
  );
}
