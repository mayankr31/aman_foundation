"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import AttendanceModal from "@/components/AttendanceModal";
import AttendanceTimer from "@/components/AttendanceTimer";
import { getISTDateKey } from "@/lib/time";
import KpiCard from "@/components/dashboard/KpiCard";
import SectionCard from "@/components/dashboard/SectionCard";
import TeamToday from "@/components/dashboard/TeamToday";
import { getDashboardKpiConfig, getDashboardSections } from "@/lib/dashboardSections";

export default function Dashboard() {
  const { user, token, can } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState({ source: "default", kpiKeys: null, linkKeys: null });
  const [error, setError] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);

  const role = user?.roleName;
  const isLoading = !kpis && !error;

  const fetchTodayAttendance = useCallback(async () => {
    if (!token || !user) return null;

    try {
      const res = await fetch("/api/attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;

      const json = await res.json();
      const today = getISTDateKey();
      return (
        (json.data || []).find(
          (entry) => entry.userId === user.id && entry.logdate === today
        ) || null
      );
    } catch (err) {
      console.error("Failed to load today's attendance:", err);
      return null;
    }
  }, [token, user]);

  const loadTodayAttendance = useCallback(async () => {
    const log = await fetchTodayAttendance();
    setTodayAttendance(log);
  }, [fetchTodayAttendance]);

  useEffect(() => {
    if (!role || role === "ADMIN") return;
    let cancelled = false;

    fetchTodayAttendance().then((log) => {
      if (!cancelled) setTodayAttendance(log);
    });

    // Refresh on the next IST day so yesterday's timer/log does not linger.
    const interval = setInterval(() => {
      fetchTodayAttendance().then((log) => {
        if (!cancelled) setTodayAttendance(log);
      });
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role, fetchTodayAttendance]);

  const attendanceLabel = !todayAttendance?.intimelog
    ? "Check In"
    : !todayAttendance?.outtimelog
      ? "Check Out"
      : "Shift Completed";
  const attendanceIcon = !todayAttendance?.intimelog
    ? "login"
    : !todayAttendance?.outtimelog
      ? "logout"
      : "check_circle";

  const attendanceButtonClass = !todayAttendance?.intimelog
    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-emerald-700/30"
    : !todayAttendance?.outtimelog
      ? "bg-red-600 hover:bg-red-700 shadow-red-600/20 hover:shadow-red-700/30"
      : "bg-slate-600 hover:bg-slate-700 shadow-slate-600/20 hover:shadow-slate-700/30";

  const closeAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    loadTodayAttendance();
  };

  useEffect(() => {
    if (!token || !role) return;

    let cancelled = false;

    fetch("/api/dashboard/kpis", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setKpis(json.data.kpis);
          setError(null);
        } else {
          setError(json.error || "Failed to load dashboard data");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      });

    fetch("/api/dashboard/config", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        setDashboardConfig(json.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Dashboard config load error:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  const kpiConfig = role ? getDashboardKpiConfig(role, dashboardConfig.kpiKeys) : [];
  const sections = role ? getDashboardSections(role, can, dashboardConfig.linkKeys) : [];

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-on-surface">
            Dashboard
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            {user?.name ? `Welcome back, ${user.name}` : "Overview of your programs and impact"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {role && role !== "ADMIN" && todayAttendance?.intimelog && (
            <AttendanceTimer log={todayAttendance} compact />
          )}
          {role && role !== "ADMIN" && can("self-attendance", "WRITE") && (
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className={`px-4 py-2 rounded-full text-white text-sm font-semibold shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all flex items-center gap-2 cursor-pointer ${attendanceButtonClass}`}
            >
              <span className="material-symbols-outlined text-lg">{attendanceIcon}</span>
              {attendanceLabel}
            </button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10 h-[132px] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error-container/30 border border-error/20 rounded-xl p-6 text-sm text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          {error}
        </div>
      ) : kpiConfig.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiConfig.map((kpi) => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={kpis?.[kpi.key]}
              icon={kpi.icon}
              tone={kpi.tone}
            />
          ))}
        </div>
      )}

      <TeamToday />

      {/* Quick Links */}
      {!error && sections.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} kpis={kpis} />
            ))}
          </div>
        </div>
      )}

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={closeAttendanceModal}
        onStatusChange={setTodayAttendance}
      />
    </div>
  );
}
