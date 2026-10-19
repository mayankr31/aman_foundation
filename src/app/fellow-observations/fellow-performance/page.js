"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import FellowPerformanceForm from "@/components/FellowPerformanceForm";
import RatingCategoriesModal from "@/components/RatingCategoriesModal";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/date";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export default function FellowPerformancePage() {
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [fellows, setFellows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exporting, setExporting] = useState(false);

  const canManage = user?.roleName === "ADMIN" || PROGRAM_ROLES.includes(user?.roleName);

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
          if (Array.isArray(perfJson.categories)) {
            setCategories(perfJson.categories);
          }
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
  const { pageItems: pagedRecords, currentPage, setCurrentPage } = usePagination(filteredRecords, 10);

  const handleExport = async () => {
    if (!filteredRecords.length) {
      alert("No records to export.");
      return;
    }
    setExporting(true);
    try {
      const headers = ["Date", "Fellow Name", "Class Group", "Subject"];
      categories.forEach((category) => headers.push(category.label));
      headers.push("Overall Score", "Strength", "AOD", "Trend");

      const data = filteredRecords.map((record) => {
        const values = [
          formatDate(record.date),
          record.fellow?.name || "",
          record.classGroup || "",
          record.subject || "",
        ];
        categories.forEach((category) => {
          values.push(record.ratings?.[category.key] ?? record[category.key] ?? "");
        });
        values.push(
          record.overallScore ?? "",
          record.strength || "",
          record.aod || "",
          record.trend || ""
        );
        return values;
      });

      const imported = await import("xlsx");
      const XLSX = imported.default || imported;
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      worksheet["!cols"] = headers.map((h) => ({
        wch: h === "Fellow Name" || h === "Strength" || h === "AOD" || h === "Trend" ? 24 : 14,
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fellow Performance");
      XLSX.writeFile(workbook, `fellow_performance_export_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error("Failed to export fellow performance records:", err);
      alert("Failed to export fellow performance records. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
          <h2 className="page-title text-on-surface mb-3">
            Fellow Performance Tracking
          </h2>
          <p className="text-sm font-medium text-on-surface-variant max-w-3xl leading-relaxed">
            Classroom observation scores and development notes for each fellow, listed by date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exporting ? "Exporting..." : "Export"}
          </button>
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Manage Ratings
          </button>
          <button
            onClick={openAddForm}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Fellow Performance
          </button>
        </div>
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

      <div className="md:hidden space-y-3">
        {pagedRecords.map((record) => (
          <div key={record.id} className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-ambient">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-on-surface break-words">{record.fellow?.name || "—"}</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {formatDate(record.date)} · {record.classGroup || "—"} · {record.subject || "—"}
                </p>
              </div>
              <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {record.overallScore ?? "—"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-3 text-xs">
              <div className="flex gap-2">
                <span className="font-semibold text-on-surface-variant w-20 shrink-0">Strength</span>
                <span className="text-on-surface break-words">{record.strength || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-on-surface-variant w-20 shrink-0">AOD</span>
                <span className="text-on-surface break-words">{record.aod || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-on-surface-variant w-20 shrink-0">Trend</span>
                <span className="text-on-surface break-words">{record.trend || "—"}</span>
              </div>
            </div>

            {categories.length > 0 && (
              <details className="mt-3 rounded-lg border border-surface-container-high bg-surface-container-low/30">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-primary">
                  View rating scores
                </summary>
                <div className="grid grid-cols-2 gap-2 p-3 pt-1">
                  {categories.map((col) => (
                    <div key={col.key} className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant break-words">{col.label}</p>
                      <p className="text-sm font-semibold text-on-surface">{record.ratings?.[col.key] ?? record[col.key] ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="mt-3 pt-3 border-t border-surface-container-high flex flex-wrap items-center gap-3">
              <button
                onClick={() => openEditForm(record)}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(record)}
                className="text-xs font-semibold text-error hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {pagedRecords.length === 0 && (
          <p className="text-center py-8 text-xs text-on-surface-variant">No records match your filters.</p>
        )}
      </div>

      <div className="w-full min-w-0 bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-surface-container-highest">
        <div className="hidden md:block overflow-x-auto">
          <table className="text-left border-collapse font-sans text-sm min-w-max w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-highest text-on-surface-variant text-[0.7rem] uppercase tracking-[0.05em] font-semibold">
                <th className="px-4 py-3 border-r border-surface-container-highest">Date</th>
                <th className="px-4 py-3 border-r border-surface-container-highest min-w-[160px]">
                  Fellow Name
                </th>
                <th className="px-4 py-3 border-r border-surface-container-highest">Class Group</th>
                <th className="px-4 py-3 border-r border-surface-container-highest">Subject</th>
                {categories.map((col) => (
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
              {pagedRecords.map((record) => (
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
                  <td className="px-4 py-3 text-on-surface-variant break-words">{record.classGroup || "—"}</td>
                  <td className="px-4 py-3 text-on-surface-variant break-words">{record.subject || "—"}</td>
                  {categories.map((col) => (
                    <td key={col.key} className="px-3 py-3 text-center text-on-surface">
                      {record.ratings?.[col.key] ?? record[col.key] ?? "—"}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {record.overallScore ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[220px] whitespace-normal break-words align-top">
                    {record.strength || "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[220px] whitespace-normal break-words align-top">
                    {record.aod || "—"}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[220px] whitespace-normal break-words align-top">
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
        <Pagination currentPage={currentPage} totalItems={filteredRecords.length} itemsPerPage={10} onPageChange={setCurrentPage} />

        {filteredRecords.length === 0 && (
          <p className="hidden md:block text-center py-12 text-sm text-on-surface-variant font-sans">
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
          categories={categories}
          token={token}
          onClose={closeForm}
          onSave={handleSaved}
        />
      )}

      {showCategoriesModal && (
        <RatingCategoriesModal
          categories={categories}
          token={token}
          onClose={() => setShowCategoriesModal(false)}
          onChanged={loadData}
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
