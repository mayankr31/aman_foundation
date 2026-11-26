"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { useLivelihoodTypes } from "@/lib/useLivelihoodTypes";
import LivelihoodTypesModal from "@/components/LivelihoodTypesModal";
import EditProgramModal from "@/components/EditProgramModal";
import AddProgramModal from "@/components/livelihood/AddProgramModal";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";

const TONE = {
  FARM: {
    tag: "bg-emerald-100 text-emerald-700",
    stat: "text-emerald-600",
  },
  NON_FARM: {
    tag: "bg-amber-100 text-amber-700",
    stat: "text-amber-600",
  },
  MIXED: {
    tag: "bg-primary/10 text-primary",
    stat: "text-primary",
  },
};

function ComponentChips({ components, getTypeConfig }) {
  if (!components || components.length === 0) return null;
  const shown = components.slice(0, 3);
  const extra = components.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((component) => {
        const config = getTypeConfig(component.typeKey);
        return (
          <span
            key={component.typeKey}
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant"
          >
            {config?.label || component.typeKey}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
          +{extra}
        </span>
      )}
    </div>
  );
}

export default function ProgramsIndex({ category, title, description, addLabel, typeCategory }) {
  const { token, canDeleteRecords, can } = useAuth();
  const toast = useToast();
  const { getTypeConfig, refresh: refreshTypes } = useLivelihoodTypes(token);
  const [programs, setPrograms] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [editProgram, setEditProgram] = useState(null);

  const { pageItems: pagedPrograms, currentPage, setCurrentPage } = usePagination(programs, 9, {
    pageParam: "page",
  });

  const tone = TONE[category] || TONE.MIXED;
  const canEditPrograms =
    canDeleteRecords || can("livelihood-farm", "WRITE") || can("livelihood-non-farm", "WRITE");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/livelihood/programs?category=${category}`, { headers });
        const json = await res.json();
        if (json.success) setPrograms(json.data.programs || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      }
      setLoading(false);
    }
    load();
  }, [token, category, refreshTrigger]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/${deleteId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setDeleteId(null);
        setDeleteName("");
        setRefreshTrigger((p) => p + 1);
        toast.success("Program deleted");
      } else {
        toast.error(json.error || "Failed to delete program");
      }
    } catch (err) {
      console.error("Delete program error:", err);
      toast.error("Failed to delete program");
    }
  };

  let totalParticipants = 0;
  let totalTarget = 0;
  let totalComponents = 0;
  programs.forEach((p) => {
    totalParticipants += p._count?.assignments || 0;
    totalComponents += p.components?.length || 0;
    (p.components || []).forEach((c) => {
      totalTarget += c.target || 0;
    });
  });

  return (
    <div className="p-4 sm:p-6 md:p-10 flex-1 max-w-7xl mx-auto w-full pb-24">
      <Link
        href="/livelihood"
        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-4 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Livelihood Hub</span>
      </Link>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="page-title text-on-surface">{title}</h2>
            <p className="page-description mt-2">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {typeCategory && (
              <button
                onClick={() => setShowTypesModal(true)}
                className="text-primary hover:bg-primary/10 px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer border border-primary/20 bg-transparent"
              >
                <span className="material-symbols-outlined text-sm">category</span>Manage Types
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-lg shadow-primary/30 active:scale-95 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-sm">add_box</span>
              {addLabel || "Add Program"}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">
              Active Programs
            </span>
            <span className={`stat-value ${tone.stat}`}>{programs.length}</span>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">
              Total Participants
            </span>
            <span className="stat-value text-on-surface">{totalParticipants}</span>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">
              {category === "MIXED" ? "Activities" : "Total Target"}
            </span>
            <span className="stat-value text-on-surface">
              {category === "MIXED"
                ? totalComponents.toLocaleString("en-IN")
                : totalTarget.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface mb-6">{title} Overview</h3>
          {loading ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Loading...</p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8 italic">
              No programs yet. Click &ldquo;{addLabel || "Add Program"}&rdquo; to create one.
            </p>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-list-page-param="page"
              data-list-detail-prefix="/livelihood/programs/"
            >
              {pagedPrograms.map((prog) => {
                const components = prog.components || [];
                const single = components.length === 1 ? components[0] : null;
                const singleConfig = single ? getTypeConfig(single.typeKey) : null;
                return (
                  <div
                    key={prog.id}
                    className="p-5 border border-surface-container-high rounded-xl bg-surface-container-low/20 space-y-4 hover:bg-surface-container-low transition-colors relative group"
                  >
                    {canEditPrograms && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditProgram(prog);
                          }}
                          className="p-1.5 rounded-full hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                          title="Edit program"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteId(prog.id);
                              setDeleteName(prog.name);
                            }}
                            className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                            title="Delete program"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/livelihood/programs/${prog.id}`}
                      data-list-item-key={prog.id}
                      className="no-underline text-left block"
                    >
                      <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${tone.tag}`}>
                        {components.length > 1
                          ? prog.category === "MIXED"
                            ? "Integrated"
                            : "Combined"
                          : singleConfig?.label || prog.type || "Program"}
                      </span>
                      <h4 className="font-bold text-base text-on-surface mt-2">{prog.name}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {prog.description || "—"}
                      </p>
                      <div className="mt-3">
                        <ComponentChips components={components} getTypeConfig={getTypeConfig} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-surface-container-high pt-4 mt-3 text-xs font-semibold">
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            {components.length > 1 ? "Activities" : "Target"}
                          </p>
                          <p className="text-on-surface font-bold mt-0.5">
                            {components.length > 1
                              ? `${components.length} types`
                              : single?.target
                                ? `${single.target} ${singleConfig?.programTargetUnit || "units"}`
                                : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            Participants
                          </p>
                          <p className="text-primary font-bold mt-0.5">
                            {prog._count?.assignments || 0} Families
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalItems={programs.length}
            itemsPerPage={9}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {showAddModal && (
        <AddProgramModal
          category={category}
          onClose={() => setShowAddModal(false)}
          onCreated={() => setRefreshTrigger((p) => p + 1)}
        />
      )}

      {deleteId && (
        <div
          className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
          onClick={() => {
            setDeleteId(null);
            setDeleteName("");
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-4 sm:p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-on-surface">Delete Program</h3>
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to delete <strong>{deleteName}</strong>? This will permanently
              remove all associated participant assignments and events.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteName("");
                }}
                className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editProgram && (
        <EditProgramModal
          program={editProgram}
          onClose={() => setEditProgram(null)}
          onSaved={() => setRefreshTrigger((p) => p + 1)}
        />
      )}

      {showTypesModal && typeCategory && (
        <LivelihoodTypesModal
          category={typeCategory}
          token={token}
          onClose={() => setShowTypesModal(false)}
          onChanged={refreshTypes}
        />
      )}
    </div>
  );
}
