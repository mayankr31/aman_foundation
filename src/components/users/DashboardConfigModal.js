"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, LayoutDashboard, RotateCcw, Check } from "lucide-react";
import { formatRoleLabel } from "@/lib/roles";

function DashboardConfigModalContent({ onClose, scope, entity, token }) {
  const [kpiKeys, setKpiKeys] = useState([]);
  const [linkKeys, setLinkKeys] = useState([]);
  const [options, setOptions] = useState({ kpis: [], sections: [], config: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const entityId = entity?.id;
  const optionsEndpoint =
    scope === "role"
      ? `/api/roles/${entityId}/dashboard/options`
      : `/api/users/${entityId}/dashboard/options`;
  const configEndpoint =
    scope === "role"
      ? `/api/roles/${entityId}/dashboard`
      : `/api/users/${entityId}/dashboard`;

  const availableKpiKeys = useMemo(
    () => options.kpis.map((kpi) => kpi.key),
    [options.kpis]
  );

  useEffect(() => {
    if (!entityId || !token) return;
    let cancelled = false;

    fetch(optionsEndpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) throw new Error(json.error || "Failed to load dashboard settings");

        const data = json.data || { kpis: [], sections: [], defaults: {}, config: null };
        setOptions(data);

        const knownKpiKeys = (data.kpis || []).map((kpi) => kpi.key);
        const knownLinkKeys = (data.sections || []).flatMap((section) =>
          section.links.map((link) => link.key)
        );
        const allowedKpiKeys = (data.kpis || [])
          .filter((kpi) => kpi.allowed !== false)
          .map((kpi) => kpi.key);
        const allowedLinkKeys = (data.sections || []).flatMap((section) =>
          section.links
            .filter((link) => link.allowed !== false)
            .map((link) => link.key)
        );

        const saved = data.config;
        // Saved selections persist exactly as chosen. Without a saved config,
        // start from the role defaults and leave unavailable items unmarked.
        const desiredKpiKeys =
          saved && Array.isArray(saved.kpiKeys)
            ? saved.kpiKeys.filter((key) => knownKpiKeys.includes(key))
            : (data.defaults?.kpiKeys || []).filter((key) => allowedKpiKeys.includes(key));
        const desiredLinkKeys =
          saved && Array.isArray(saved.linkKeys)
            ? saved.linkKeys.filter((key) => knownLinkKeys.includes(key))
            : (data.defaults?.linkKeys || []).filter((key) => allowedLinkKeys.includes(key));

        setKpiKeys(desiredKpiKeys);
        setLinkKeys(desiredLinkKeys);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityId, token, optionsEndpoint]);

  const toggle = (list, setList, key) => {
    setList(list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);
  };

  const toggleGroup = (section) => {
    const keys = section.links.map((link) => link.key);
    if (!keys.length) return;
    const allSelected = keys.every((key) => linkKeys.includes(key));
    setLinkKeys((prev) =>
      allSelected ? prev.filter((key) => !keys.includes(key)) : [...new Set([...prev, ...keys])]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(configEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ kpiKeys, linkKeys }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save dashboard settings");
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(configEndpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reset dashboard settings");
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    scope === "role"
      ? formatRoleLabel(entity?.name)
      : entity?.name || entity?.username || "this user";

  const hasItems = options.kpis.length > 0 || options.sections.length > 0;

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white dark:bg-[#151e2d] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LayoutDashboard size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Dashboard for {displayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Every KPI and quick-link card is listed. Checked items appear on the dashboard;
                unchecked items are hidden.
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs p-3">
                  {error}
                </div>
              )}

              {!hasItems ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-600 dark:text-gray-300">
                    Nothing to configure
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    This {scope} does not have access to any dashboard KPIs or quick links yet.
                  </p>
                </div>
              ) : (
                <>
                  {options.kpis.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          KPI Cards
                        </h4>
                        <div className="flex gap-2 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setKpiKeys(availableKpiKeys)}
                            className="text-primary hover:underline"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setKpiKeys([])}
                            className="text-slate-400 hover:underline"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {options.kpis.map((kpi) => {
                          const checked = kpiKeys.includes(kpi.key);
                          return (
                            <button
                              type="button"
                              key={kpi.key}
                              onClick={() => toggle(kpiKeys, setKpiKeys, kpi.key)}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                checked
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  checked ? "bg-primary border-primary text-white" : "border-slate-300"
                                }`}
                              >
                                {checked && <Check size={11} strokeWidth={3} />}
                              </span>
                              <span className="truncate">{kpi.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {options.sections.length > 0 && (
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Quick Links
                      </h4>
                      {options.sections.map((section) => {
                        const allSelected =
                          section.links.length > 0 &&
                          section.links.every((link) => linkKeys.includes(link.key));
                        return (
                          <div
                            key={section.id}
                            className="rounded-2xl border border-slate-200 dark:border-white/10 p-3"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-xs font-bold text-slate-800 dark:text-white">
                                {section.title}
                              </p>
                              {section.links.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(section)}
                                  className="text-[10px] font-bold text-primary hover:underline"
                                >
                                  {allSelected ? "Clear" : "Select all"}
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {section.links.map((link) => {
                                const checked = linkKeys.includes(link.key);
                                return (
                                  <button
                                    type="button"
                                    key={link.key}
                                    onClick={() => toggle(linkKeys, setLinkKeys, link.key)}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-semibold transition-colors ${
                                      checked
                                        ? "border-primary/30 bg-primary/10 text-primary"
                                        : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                    }`}
                                  >
                                    <span
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                        checked
                                          ? "bg-primary border-primary text-white"
                                          : "border-slate-300"
                                      }`}
                                    >
                                      {checked && <Check size={11} strokeWidth={3} />}
                                    </span>
                                    <span className="truncate">{link.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Role settings apply to everyone with that role. User settings override the role
                    settings. Resetting a user returns them to the role defaults.
                  </p>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
          >
            <RotateCcw size={13} /> Reset to default
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || !hasItems}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardConfigModal(props) {
  if (!props.isOpen) return null;
  return <DashboardConfigModalContent {...props} />;
}
