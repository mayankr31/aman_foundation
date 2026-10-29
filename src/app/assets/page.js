"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { formatDate } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";
import {
  ASSET_STATUSES,
  ASSET_STATUS_CLASSES,
  formatAssetStatus,
  getActiveAssetAssignment,
  getAssetStatus,
  getLatestAssetAssignment,
} from "@/lib/assetConstants";
import {
  AssetAssignModal,
  AssetFormModal,
  AssetHistoryModal,
  AssetReturnModal,
} from "@/components/assets/AssetModals";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export default function AssetsPage() {
  const { token, user, can } = useAuth();
  const canWrite = can("assets", "WRITE");
  const isUnrestricted = user?.roleName === "ADMIN" || user?.roleName === "HR";
  const canSeeTeam = canWrite || PROGRAM_ROLES.includes(user?.roleName);

  const [scope, setScope] = useState("mine");
  const [assets, setAssets] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assignAsset, setAssignAsset] = useState(null);
  const [returnAsset, setReturnAsset] = useState(null);
  const [historyAsset, setHistoryAsset] = useState(null);
  const initialScopeSet = useRef(false);

  useEffect(() => {
    if (!user || initialScopeSet.current) return;
    initialScopeSet.current = true;
    setScope(isUnrestricted ? "all" : canWrite ? "team" : "mine");
  }, [user, isUnrestricted, canWrite]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ scope });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/assets?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load assets");
        if (!cancelled) setAssets(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, scope, search, statusFilter]);

  useEffect(() => {
    if (!token || !canWrite) return;
    let cancelled = false;
    fetch("/api/assets/assignable", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setAssignableUsers(json.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, canWrite]);

  const stats = useMemo(() => {
    const assigned = assets.filter((asset) => getActiveAssetAssignment(asset)).length;
    const returned = assets.length - assigned;
    const employees = new Set(
      assets
        .map((asset) => getActiveAssetAssignment(asset)?.userId)
        .filter(Boolean)
    ).size;
    return { total: assets.length, assigned, returned, employees };
  }, [assets]);

  const { pageItems, currentPage, setCurrentPage } = usePagination(assets, 10);

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/assets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assets");
      setAssets(data.data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = () => refresh();

  const openCreate = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const openEdit = (asset) => {
    setEditingAsset(asset);
    setFormOpen(true);
  };

  const tabs = [
    { key: "mine", label: "My Assets" },
    ...(canSeeTeam && !isUnrestricted ? [{ key: "team", label: "Team Assets" }] : []),
    ...(isUnrestricted ? [{ key: "all", label: "All Assets" }] : []),
  ];

  return (
    <div className="p-4 sm:p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full space-y-6">
      <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 font-sans">Company Property</p>
          <h1 className="page-title text-on-surface">Asset Management</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Company assets assigned to employees, with reporting-line controls and full history.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-container transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Assign Asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: scope === "mine" ? "My Assets" : "Total Logged", value: stats.total, icon: "inventory_2", tone: "text-slate-700 bg-slate-100" },
          { label: "Currently Assigned", value: stats.assigned, icon: "assignment_ind", tone: "text-emerald-700 bg-emerald-100" },
          { label: "Returned", value: stats.returned, icon: "assignment_return", tone: "text-slate-700 bg-slate-100" },
          { label: "Employees Covered", value: stats.employees, icon: "group", tone: "text-blue-700 bg-blue-100" },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
            </div>
            <span className={`material-symbols-outlined rounded-xl p-2 sm:p-2.5 text-[20px] ${card.tone}`}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setScope(tab.key);
                setStatusFilter("");
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                scope === tab.key
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset ID, name, serial..."
            className="px-4 py-2 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-on-surface focus:outline-none focus:border-primary w-full sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-on-surface"
          >
            <option value="">All statuses</option>
            {ASSET_STATUSES.filter((status) => scope !== "mine" || status === "ASSIGNED").map((status) => (
              <option key={status} value={status}>{formatAssetStatus(status)}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
            <p className="text-sm text-slate-500 mt-2">
              {scope === "mine" ? "No assets are currently assigned to you." : "No assets found for this view."}
            </p>
            {canWrite && (
              <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold">
                Assign the first asset
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="mobile-card-table w-full min-w-[980px] table-fixed text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="w-[14%] py-3 px-4">Asset ID</th>
                  <th className="w-[20%] py-3 px-4">Asset</th>
                  <th className="w-[18%] py-3 px-4">Assigned To</th>
                  <th className="w-[15%] py-3 px-4">Assigned By</th>
                  <th className="w-[11%] py-3 px-4">Assigned On</th>
                  <th className="w-[10%] py-3 px-4">Status</th>
                  <th className="w-[12%] py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((asset) => {
                  const current = getActiveAssetAssignment(asset);
                  const latest = getLatestAssetAssignment(asset);
                  const display = current || latest;
                  const status = getAssetStatus(asset);
                  return (
                    <tr key={asset.id} className="border-b border-slate-100 dark:border-slate-800 last:border-none hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors align-top">
                      <td data-label="Asset ID" className="py-4 px-4 font-mono text-xs font-bold text-on-surface break-words">
                        {asset.assetCode}
                      </td>
                      <td data-label="Asset" className="py-4 px-4">
                        <p className="font-bold text-on-surface text-[13px] break-words">{asset.name}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 break-words">
                          {asset.category || "Uncategorised"}
                          {asset.serialNumber ? ` · ${asset.serialNumber}` : ""}
                        </p>
                      </td>
                      <td data-label="Assigned To" className="py-4 px-4">
                        {display?.user ? (
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-on-surface break-words">{display.user.name}</p>
                            <p className="text-[10px] text-on-surface-variant break-words">
                              {formatRoleLabel(display.user.role?.name)}
                              {display.user.employeeId ? ` · ${display.user.employeeId}` : ""}
                              {!current ? " · Returned" : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td data-label="Assigned By" className="py-4 px-4 text-xs text-on-surface-variant break-words">
                        {display?.assignedBy?.name || "—"}
                      </td>
                      <td data-label="Assigned On" className="py-4 px-4 text-xs text-on-surface-variant">
                        {display ? formatDate(display.assignedAt) : "—"}
                      </td>
                      <td data-label="Status" className="py-4 px-4">
                        <span className={`inline-flex text-[9px] font-bold uppercase px-2 py-1 rounded-full ${ASSET_STATUS_CLASSES[status] || ""}`}>
                          {formatAssetStatus(status)}
                        </span>
                      </td>
                      <td data-label="Actions" className="py-4 px-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {!canWrite && (
                            <span className="text-[10px] font-semibold text-slate-400">View only</span>
                          )}
                          {canWrite && (
                            <>
                              <button
                                onClick={() => setHistoryAsset(asset)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                History
                              </button>
                              <button
                                onClick={() => openEdit(asset)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              {current ? (
                                <button
                                  onClick={() => setReturnAsset(asset)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold hover:bg-amber-100"
                                >
                                  Return
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssignAsset(asset)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100"
                                >
                                  Assign
                                </button>
                              )}
                              {current && (
                                <button
                                  onClick={() => setAssignAsset(asset)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100"
                                >
                                  Reassign
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination currentPage={currentPage} totalItems={assets.length} itemsPerPage={10} onPageChange={setCurrentPage} />
        </div>
      </div>

      <AssetFormModal
        open={formOpen}
        asset={editingAsset}
        assignableUsers={assignableUsers}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        token={token}
      />
      <AssetAssignModal
        open={Boolean(assignAsset)}
        asset={assignAsset}
        assignableUsers={assignableUsers}
        onClose={() => setAssignAsset(null)}
        onSaved={handleSaved}
        token={token}
      />
      <AssetReturnModal
        open={Boolean(returnAsset)}
        asset={returnAsset}
        onClose={() => setReturnAsset(null)}
        onSaved={handleSaved}
        token={token}
      />
      <AssetHistoryModal
        open={Boolean(historyAsset)}
        asset={historyAsset}
        onClose={() => setHistoryAsset(null)}
      />
    </div>
  );
}
