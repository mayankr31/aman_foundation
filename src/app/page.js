"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import AttendanceModal from "@/components/AttendanceModal";
import KpiCard from "@/components/dashboard/KpiCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { getDashboardKpiConfig, getDashboardSections } from "@/lib/dashboardSections";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const role = user?.roleName;
  const isLoading = !kpis && !error;

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

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  const kpiConfig = role ? getDashboardKpiConfig(role) : [];
  const sections = role ? getDashboardSections(role) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.75rem] font-bold tracking-[-0.02em] text-on-surface leading-tight">
            Dashboard
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            {user?.name ? `Welcome back, ${user.name}` : "Overview of your programs and impact"}
          </p>
        </div>
        <div className="flex gap-3">
          {role && role !== "ADMIN" && (
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold shadow-[0_8px_24px_rgba(5,150,105,0.2)] hover:shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">co_present</span>
              Daily Attendance
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
      ) : (
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
        onClose={() => setIsAttendanceModalOpen(false)}
      />
    </div>
  );
}
