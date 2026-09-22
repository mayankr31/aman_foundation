"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PMReflectionForm from "@/components/PMReflectionForm";
import PMReflectionViewer from "@/components/PMReflectionViewer";
import {
  COMPETENCY_CATEGORIES,
  CATEGORY_COUNT,
  MATRIX_CELLS,
} from "@/data/pmReflectionConstants";

const LEVEL_STYLES = {
  Novice: "bg-red-100 text-red-700",
  Beginner: "bg-amber-100 text-amber-700",
  Proficient: "bg-emerald-100 text-emerald-700",
  Advanced: "bg-blue-100 text-blue-700",
};

const LEVEL_ABBR = {
  Novice: "N",
  Beginner: "B",
  Proficient: "P",
  Advanced: "A",
};

const MATRIX_HEADERS = MATRIX_CELLS.map((cell) => ({
  key: cell.key,
  label: cell.key.replace("_", "/"),
  full: cell.label,
}));

export default function FellowPmReflectionPage() {
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formFellowId, setFormFellowId] = useState(null);
  const [editingReflection, setEditingReflection] = useState(null);

  const [historyFellow, setHistoryFellow] = useState(null);
  const [historyReflections, setHistoryReflections] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [viewingReflection, setViewingReflection] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManage = user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER";

  useEffect(() => {
    if (user && !canManage) {
      router.replace("/education/fellows");
    }
  }, [user, canManage, router]);

  const loadRows = useCallback(() => {
    if (!token) return;
    fetch("/api/pm-reflections", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRows(json.data || []);
        } else {
          toastError(json.error || "Failed to load PM reflections");
        }
      })
      .catch((err) => {
        console.error("Failed to load PM reflections:", err);
        toastError("An error occurred while loading PM reflections");
      })
      .finally(() => setLoading(false));
  }, [token, toastError]);

  useEffect(() => {
    if (!isInitializing && token && canManage) {
      loadRows();
    }
  }, [isInitializing, token, canManage, loadRows]);

  const openAddForm = (fellowId) => {
    setFormFellowId(fellowId);
    setEditingReflection(null);
  };

  const openEditForm = (fellowId, reflection) => {
    setFormFellowId(fellowId);
    setEditingReflection(reflection);
  };

  const closeForm = () => {
    setFormFellowId(null);
    setEditingReflection(null);
  };

  const loadHistory = useCallback(
    async (fellowId) => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/fellows/${fellowId}/pm-reflections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setHistoryReflections(json.data || []);
        } else {
          toastError(json.error || "Failed to load reflection history");
        }
      } catch (err) {
        console.error("Failed to load reflection history:", err);
        toastError("An error occurred while loading history");
      } finally {
        setHistoryLoading(false);
      }
    },
    [token, toastError]
  );

  const handleSaved = async () => {
    closeForm();
    await loadRows();
    if (historyFellow) {
      await loadHistory(historyFellow.id);
    }
  };

  const openHistory = (fellow) => {
    setHistoryFellow(fellow);
    setHistoryReflections([]);
    loadHistory(fellow.id);
  };

  const closeHistory = () => {
    setHistoryFellow(null);
    setHistoryReflections([]);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { fellowId, reflectionId } = deleteTarget;
    try {
      const res = await fetch(`/api/fellows/${fellowId}/pm-reflections/${reflectionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        toastSuccess("PM reflection deleted successfully!");
        setDeleteTarget(null);
        await loadRows();
        if (historyFellow) {
          await loadHistory(historyFellow.id);
        }
      } else {
        toastError(json.error || "Failed to delete PM reflection");
      }
    } catch (err) {
      console.error("Delete PM reflection error:", err);
      toastError("An error occurred while deleting the reflection");
    }
  };

  const renderLevel = (reflection, key) => {
    const level = reflection?.responses?.[key];
    if (!level) {
      return <span className="text-on-surface-variant/40 text-[11px]">—</span>;
    }
    return (
      <span
        title={level}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
          LEVEL_STYLES[level] || "bg-surface-container text-on-surface-variant"
        }`}
      >
        {LEVEL_ABBR[level] || level.charAt(0)}
      </span>
    );
  };

  const renderMatrix = (reflection, key) => (
    <span
      title={key.replace("_", ", ")}
      className="inline-block w-6 h-6 rounded-full border border-black/10 shadow-sm"
      style={{ backgroundColor: reflection?.matrix?.[key] || "#d1d5db" }}
    ></span>
  );

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      <Link
        href="/education/fellows"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Fellows
        </span>
      </Link>

      <div className="mb-6">
        <h2 className="text-[2.75rem] font-headline font-black text-on-surface tracking-[-0.02em] leading-none mb-3">
          PM Reflection
        </h2>
        <p className="text-sm font-medium text-on-surface-variant max-w-3xl leading-relaxed">
          Latest Leadership Development Journey Conversation reflection for each fellow. Use the
          actions to edit the latest reflection, add a new dated reflection, or review the full
          history.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 font-sans text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wide">Rating legend:</span>
        {Object.entries(LEVEL_ABBR).map(([level, abbr]) => (
          <span key={level} className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                LEVEL_STYLES[level] || ""
              }`}
            >
              {abbr}
            </span>
            {level}
          </span>
        ))}
      </div>

      <div className="w-full min-w-0 bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-surface-container-highest">
        <div className="overflow-x-auto">
          <table className="text-left border-collapse font-sans text-sm min-w-max">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-highest text-on-surface-variant text-[0.7rem] uppercase tracking-[0.05em] font-semibold">
                <th
                  rowSpan={2}
                  className="px-5 py-3 sticky left-0 z-20 bg-surface-container-low border-r border-surface-container-highest min-w-[180px]"
                >
                  Fellow
                </th>
                {COMPETENCY_CATEGORIES.map((category) => (
                  <th
                    key={category.key}
                    colSpan={CATEGORY_COUNT}
                    className="px-3 py-3 text-center border-r border-surface-container-highest"
                  >
                    {category.label}
                  </th>
                ))}
                <th
                  colSpan={MATRIX_HEADERS.length}
                  className="px-3 py-3 text-center border-r border-surface-container-highest"
                >
                  Skill / Will Competency
                </th>
                <th
                  rowSpan={2}
                  className="px-5 py-3 border-r border-surface-container-highest min-w-[200px]"
                >
                  Notes
                </th>
                <th rowSpan={2} className="px-5 py-3 text-right min-w-[220px]">
                  Actions
                </th>
              </tr>
              <tr className="bg-surface-container-low border-b border-surface-container-highest text-on-surface-variant text-[0.65rem] uppercase tracking-[0.05em] font-semibold">
                {COMPETENCY_CATEGORIES.map((category) =>
                  Array.from({ length: CATEGORY_COUNT }, (_, i) => (
                    <th
                      key={`${category.prefix}${i + 1}`}
                      className="px-2 py-2 text-center w-10 border-r border-surface-container-highest"
                    >
                      {category.prefix}
                      {i + 1}
                    </th>
                  ))
                )}
                {MATRIX_HEADERS.map((header) => (
                  <th
                    key={header.key}
                    title={header.full}
                    className="px-2 py-2 text-center w-12 border-r border-surface-container-highest"
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const reflection = row.latestReflection;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-surface-container-highest hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-5 py-3 sticky left-0 z-10 bg-surface-container-lowest font-semibold text-on-surface border-r border-surface-container-highest">
                      <div className="leading-tight">{row.name}</div>
                      {row.cohort && (
                        <div className="text-[11px] font-normal text-on-surface-variant">
                          {row.cohort}
                        </div>
                      )}
                    </td>
                    {COMPETENCY_CATEGORIES.map((category) =>
                      Array.from({ length: CATEGORY_COUNT }, (_, i) => {
                        const key = `${category.prefix}${i + 1}`;
                        return (
                          <td
                            key={key}
                            className="px-2 py-3 text-center border-r border-surface-container-highest"
                          >
                            {renderLevel(reflection, key)}
                          </td>
                        );
                      })
                    )}
                    {MATRIX_HEADERS.map((header) => (
                      <td
                        key={header.key}
                        className="px-2 py-3 text-center border-r border-surface-container-highest"
                      >
                        {renderMatrix(reflection, header.key)}
                      </td>
                    ))}
                    <td className="px-5 py-3 border-r border-surface-container-highest align-top">
                      {reflection?.notes ? (
                        <p
                          title={reflection.notes}
                          className="text-xs text-on-surface-variant line-clamp-2 max-w-[240px]"
                        >
                          {reflection.notes}
                        </p>
                      ) : (
                        <span className="text-on-surface-variant/40 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <button
                          onClick={() => openEditForm(row.id, reflection)}
                          disabled={!reflection}
                          className="text-xs font-semibold text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline cursor-pointer"
                        >
                          Edit latest
                        </button>
                        <button
                          onClick={() => openAddForm(row.id)}
                          className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          Add new
                        </button>
                        <button
                          onClick={() => openHistory(row)}
                          disabled={!reflection}
                          className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="text-center py-12 text-sm text-on-surface-variant font-sans">
            No fellows found.
          </p>
        )}
      </div>

      {formFellowId && (
        <PMReflectionForm
          fellowId={formFellowId}
          reflection={editingReflection}
          token={token}
          onClose={closeForm}
          onSave={handleSaved}
        />
      )}

      {viewingReflection && (
        <PMReflectionViewer
          reflection={viewingReflection}
          onClose={() => setViewingReflection(null)}
        />
      )}

      {historyFellow && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center p-4 pt-12 overflow-y-auto"
          onClick={closeHistory}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-5 font-sans max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  Reflection History
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{historyFellow.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openAddForm(historyFellow.id);
                  }}
                  className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add new
                </button>
                <button
                  onClick={closeHistory}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {historyLoading ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : historyReflections.length === 0 ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                No reflections recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {historyReflections.map((reflection) => {
                  const matrixColors = reflection.matrix || {};
                  return (
                    <div
                      key={reflection.id}
                      className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 flex justify-between items-start gap-4"
                    >
                      <button
                        onClick={() => setViewingReflection(reflection)}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <p className="font-semibold text-on-surface text-sm">
                          {new Date(reflection.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {MATRIX_HEADERS.map((header) => (
                            <span
                              key={header.key}
                              title={header.full}
                              className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: matrixColors[header.key] || "#d1d5db" }}
                            ></span>
                          ))}
                        </div>
                        {reflection.author?.name && (
                          <p className="text-xs text-on-surface-variant mt-2">
                            Reviewed by {reflection.author.name}
                          </p>
                        )}
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            closeHistory();
                            openEditForm(historyFellow.id, reflection);
                          }}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              fellowId: historyFellow.id,
                              reflectionId: reflection.id,
                            })
                          }
                          className="text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete reflection"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete PM Reflection"
        message="Are you sure you want to delete this PM reflection? This action is permanent and cannot be undone."
      />
    </div>
  );
}
