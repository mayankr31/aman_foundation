"use client";

import { useEffect, useState } from "react";
import KpiCard from "@/components/dashboard/KpiCard";
import { getDashboardKpiConfig } from "@/lib/dashboardSections";
import { useAuth } from "@/lib/useAuth";

/**
 * Hub-page KPI strip.
 * Shows the KPIs belonging to `group` ("education" or "livelihood") using the
 * same registry, role labels and admin-configured selection as the dashboard.
 */
export default function HubKpiStrip({ group }) {
  const { user, token } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [kpiKeys, setKpiKeys] = useState(null);
  const [error, setError] = useState(null);

  const role = user?.roleName;

  useEffect(() => {
    if (!token || !role) return;
    let cancelled = false;

    const authHeaders = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/dashboard/kpis", { headers: authHeaders }).then((res) => res.json()),
      fetch("/api/dashboard/config", { headers: authHeaders }).then((res) => res.json()),
    ])
      .then(([kpiJson, configJson]) => {
        if (cancelled) return;
        if (!kpiJson.success) throw new Error(kpiJson.error || "Failed to load KPIs");

        setKpis(kpiJson.data?.kpis || {});
        if (configJson.success) setKpiKeys(configJson.data?.kpiKeys ?? null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Hub KPI load error:", err);
        setError("Failed to load KPIs");
      });

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  const config = role ? getDashboardKpiConfig(role, kpiKeys) : [];
  const visible = config.filter((kpi) => kpi.group === group);
  const isLoading = !kpis && !error;

  // Nothing configured for this hub: keep the page clean.
  if (!isLoading && !error && visible.length === 0) return null;

  return (
    <section className="mb-10">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 h-[132px] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error-container/30 border border-error/20 rounded-xl p-4 text-sm text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {visible.map((kpi) => (
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
    </section>
  );
}
