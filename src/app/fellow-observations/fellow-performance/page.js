"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import FellowPerformanceForm from "@/components/FellowPerformanceForm";

const RATING_COLUMNS = [
  { key: "lessonPlan", label: "Lesson Plan" },
  { key: "culture", label: "Culture" },
  { key: "lessonFlow", label: "Lesson Flow" },
  { key: "content", label: "Content" },
  { key: "communityEngagement", label: "Community Engagement" },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FellowPerformancePage() {
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [fellows, setFellows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManage = user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER";

  useEffect(() => {
    if (user && !canManage) {
      router.replace("/profile");
    }
  }, [user, canManage, router]);

  const loadData = useCallback(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/fellow-performances", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/fellows", { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([perfRes, fellowRes]) => Promise.all([perfRes.json(), fellowRes.json()]))
      .then(([perfJson, fellowJson]) => {
        if (perfJson.success) {
          setRecords(perfJson.data || []);
        } else {
          toastError(perfJson.error || "Failed to load fellow performance records");
        }
        if (fellowJson.success) {
          setFellows(fellowJson.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load fellow performances:", err);
        toastError("An error occurred while loading fellow performance records");
      })
      .finally(() => setLoading(false));
  }, [token, toastError]);

  useEffect(() => {
    if (!isInitializing && token && canManage) {
      loadData();
    }
  }, [isInitializing, token, canManage, loadData]);

  const openAddForm = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleSaved = async () => {
    closeForm();
    await loadData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/fellow-performances/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        toastSuccess("Fellow performance deleted successfully!");
        setDeleteTarget(null);
        await loadData();
      } else {
        toastError(json.error || "Failed to delete fellow performance");
      }
    } catch (err) {
      console.error("Delete fellow performance error:", err);
      toastError("An error occurred while deleting the record");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

  const filteredRecords = records
    .filter((record) => {
      const name = record.fellow?.name || "";
      if (searchQuery && !name.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        return false;
      }
      if (dateFrom || dateTo) {
        const recordDate = new Date(record.date);
        if (dateFrom && recordDate < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && recordDate > new Date(`${dateTo}T23:59:59`)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const hasFilters = searchQuery || dateFrom || dateTo;

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[2.5rem] font-headline font-black text-on-surface tracking-[-0.02em] leading-none mb-3">
            Fellow Performance Tracking
          </h2>
          <p className="text-sm font-medium text-on-surface-variant max-w-3xl leading-relaxed">
            Classroom observation scores and development notes for each fellow, listed by date.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Fellow Performance
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6 font-sans">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            Search by Fellow Name
          </label>
          <div className="relative">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fellow..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors text-xs font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="w-full min-w-0 bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-surface-container-highest">
        <div className="overflow-x-auto">
          <table className="text-left border-collapse font-sans text-sm min-w-max w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-highest text-on-surface-variant text-[0.7rem] uppercase tracking-[0.05em] font-semibold">
                <th className="px-4 py-3 border-r border-surface-container-highest">Date</th>
                <th className="px-4 py-3 border-r border-surface-container-highest min-w-[160px]">
                  Fellow Name
                </th>
                <th className="px-4 py-3 border-r border-surface-container-highest">Class Group</th>
                <th className="px-4 py-3 border-r border-surface-container-highest">Subject</th>
                {RATING_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-center border-r border-surface-container-highest"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-center border-r border-surface-container-highest">
                  Overall Score
                </th>
                <th className="px-4 py-3 border-r border-surface-container-highest min-w-[160px]">
                  Strength
                </th>
                <th className="px-4 py-3 border-r border-surface-container-highest min-w-[160px]">
                  AOD
                </th>
                <th className="px-4 py-3 border-r border-surface-container-highest min-w-[160px]">
                  Trend
                </th>
                <th className="px-4 py-3 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-surface-container-highest hover:bg-surface-container-low transition-colors align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-on-surface">
                    {record.fellow?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{record.classGroup || "—"}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{record.subject || "—"}</td>
                  {RATING_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-3 text-center text-on-surface">
                      {record[col.key] ?? "—"}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {record.overallScore ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[220px]">
                    {record.strength || "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[220px]">
                    {record.aod || "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[220px]">
                    {record.trend || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      <button
                        onClick={() => openEditForm(record)}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(record)}
                        className="text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <p className="text-center py-12 text-sm text-on-surface-variant font-sans">
            {records.length === 0
              ? "No fellow performance records found."
              : "No records match your filters."}
          </p>
        )}
      </div>

      {showForm && (
        <FellowPerformanceForm
          performance={editingRecord}
          fellows={fellows}
          token={token}
          onClose={closeForm}
          onSave={handleSaved}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Fellow Performance"
        message="Are you sure you want to delete this fellow performance record? This action is permanent and cannot be undone."
      />
    </div>
  );
}
