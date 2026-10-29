"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

const CATEGORIES = [
  {
    key: "schools",
    label: "Schools",
    icon: "school",
    empty: "No schools assigned.",
    link: (id) => `/education/schools/${id}`,
  },
  {
    key: "centres",
    label: "After School Centres",
    icon: "cottage",
    empty: "No after school centres assigned.",
    link: (id) => `/education/after-school-centres/${id}`,
  },
  {
    key: "programs",
    label: "Livelihood Programs",
    icon: "agriculture",
    empty: "No livelihood programs assigned.",
    link: (id) => `/livelihood/programs/${id}`,
  },
];

function normalizeList(list) {
  return (list || [])
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      name: item.name || "Unnamed",
      category: item.category || null,
    }));
}

function signatureOf(schools, centres, programs) {
  return [
    schools.map((item) => `${item.id}:${item.name}`).join(","),
    centres.map((item) => `${item.id}:${item.name}`).join(","),
    programs.map((item) => `${item.id}:${item.name}`).join(","),
  ].join("|");
}

export default function AssignmentsSection({
  title = "Assignments",
  isFellow = false,
  fellowId = null,
  userId = null,
  schools = [],
  centres = [],
  programs = [],
  canEdit = false,
  canEditLivelihoodPrograms = canEdit,
  onChanged,
  className = "",
}) {
  const { token } = useAuth();
  const toast = useToast();

  const normalizedSchools = useMemo(() => normalizeList(schools), [schools]);
  const normalizedCentres = useMemo(() => normalizeList(centres), [centres]);
  const normalizedPrograms = useMemo(() => normalizeList(programs), [programs]);
  const signature = signatureOf(normalizedSchools, normalizedCentres, normalizedPrograms);

  const [assigned, setAssigned] = useState({
    schools: normalizedSchools,
    centres: normalizedCentres,
    programs: normalizedPrograms,
  });
  const [syncedSignature, setSyncedSignature] = useState(signature);

  // Adjust local state when the parent supplies refreshed assignment data.
  if (signature !== syncedSignature) {
    setSyncedSignature(signature);
    setAssigned({
      schools: normalizedSchools,
      centres: normalizedCentres,
      programs: normalizedPrograms,
    });
  }

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("schools");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState({ schools: [], centres: [], programs: [] });
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [busyKey, setBusyKey] = useState("");

  const targetId = isFellow ? fellowId : userId;
  const canOpenEditor = canEdit && Boolean(targetId);

  useEffect(() => {
    if (!open || optionsLoaded || !token) return;

    let cancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [schoolsRes, centresRes, programsRes] = await Promise.all([
          fetch("/api/schools", { headers }),
          fetch("/api/after-school-centres", { headers }),
          fetch("/api/livelihood/programs", { headers }),
        ]);

        const [schoolsJson, centresJson, programsJson] = await Promise.all([
          schoolsRes.json(),
          centresRes.json(),
          programsRes.json(),
        ]);

        if (cancelled) return;

        const programData = programsJson?.data?.programs || programsJson?.data || [];
        setOptions({
          schools: normalizeList(schoolsJson?.success ? schoolsJson.data : []),
          centres: normalizeList(centresJson?.success ? centresJson.data : []),
          programs: normalizeList(Array.isArray(programData) ? programData : []),
        });
        setOptionsLoaded(true);
      } catch (err) {
        console.error("Failed to load assignment options:", err);
        if (!cancelled) toast.error("Could not load assignment options");
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, optionsLoaded, token]);

  const handleOpen = () => {
    setOpen(true);
    setSearch("");
    setActiveCategory("schools");
  };

  const endpointFor = (category, entityId) => {
    const base = {
      schools: `/api/schools/${entityId}`,
      centres: `/api/after-school-centres/${entityId}`,
      programs: `/api/livelihood/programs/${entityId}`,
    }[category];

    return isFellow ? `${base}/fellows` : `${base}/program-managers`;
  };

  const handleToggle = async (category, entity) => {
    if (!canOpenEditor || !token) return;
    if (category === "programs" && !canEditLivelihoodPrograms) {
      toast.error("Only an admin can change livelihood program assignments");
      return;
    }
    const key = `${category}:${entity.id}`;
    if (busyKey === key) return;

    const isAssigned = assigned[category].some((item) => item.id === entity.id);
    setBusyKey(key);

    try {
      const res = await fetch(endpointFor(category, entity.id), {
        method: isAssigned ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          isFellow ? { fellowId: targetId } : { userId: targetId }
        ),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        toast.error(json.error || `Failed to ${isAssigned ? "remove" : "assign"}`);
        return;
      }

      setAssigned((prev) => ({
        ...prev,
        [category]: isAssigned
          ? prev[category].filter((item) => item.id !== entity.id)
          : [...prev[category], { id: entity.id, name: entity.name, category: entity.category || null }],
      }));
      toast.success(isAssigned ? "Assignment removed" : "Assignment added");
      onChanged?.();
    } catch (err) {
      console.error("Failed to update assignment:", err);
      toast.error("An error occurred while updating the assignment");
    } finally {
      setBusyKey("");
    }
  };

  const activeConfig = CATEGORIES.find((item) => item.key === activeCategory) || CATEGORIES[0];
  const assignedIds = new Set(assigned[activeCategory].map((item) => item.id));
  const mergedOptions = [
    ...options[activeCategory],
    ...assigned[activeCategory].filter(
      (item) => !options[activeCategory].some((option) => option.id === item.id)
    ),
  ].filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">assignment_ind</span>
          {title}
        </h3>
        {canOpenEditor && (
          <button
            type="button"
            onClick={handleOpen}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Assignments
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {CATEGORIES.map((category) => {
          const items = assigned[category.key];
          return (
            <div
              key={category.key}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 min-w-0"
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary shrink-0">{category.icon}</span>
                  <span className="truncate">{category.label}</span>
                </h4>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
                  {items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">{category.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={category.link(item.id)}
                        className="flex items-center justify-between gap-2 text-sm text-on-surface hover:text-primary transition-colors group"
                      >
                        <span className="truncate">
                          {item.name}
                          {category.key === "programs" && item.category && (
                            <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-400">
                              {item.category === "FARM" ? "Farm" : "Non-Farm"}
                            </span>
                          )}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary shrink-0">
                          chevron_right
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-container-lowest rounded-t-2xl sm:rounded-xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col font-sans">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-surface-container">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-on-surface">Edit Assignments</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Assign or remove schools, centres, and livelihood programs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                aria-label="Close assignment editor"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex border-b border-surface-container overflow-x-auto no-scrollbar px-2">
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.key;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.key);
                      setSearch("");
                    }}
                    className={`px-4 py-3 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {category.label} ({assigned[category.key].length})
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeConfig.label.toLowerCase()}...`}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface"
              />

              {activeCategory === "programs" && !canEditLivelihoodPrograms && (
                <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Only an admin can change livelihood program assignments.
                </p>
              )}

              {loadingOptions ? (
                <div className="py-10 text-center text-sm text-on-surface-variant">Loading options...</div>
              ) : mergedOptions.length === 0 ? (
                <div className="py-10 text-center text-sm text-on-surface-variant">
                  No {activeConfig.label.toLowerCase()} found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                  {mergedOptions.map((entity) => {
                    const isAssigned = assignedIds.has(entity.id);
                    const isBusy = busyKey === `${activeCategory}:${entity.id}`;
                    const categoryLocked =
                      activeCategory === "programs" && !canEditLivelihoodPrograms;
                    return (
                      <div
                        key={entity.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          isAssigned
                            ? "border-primary/30 bg-primary/5"
                            : "border-outline-variant hover:bg-surface-container"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{entity.name}</p>
                          {activeCategory === "programs" && entity.category && (
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                              {entity.category === "FARM" ? "Farm" : "Non-Farm"}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isBusy || categoryLocked}
                          title={categoryLocked ? "Only an admin can change livelihood program assignments" : undefined}
                          onClick={() => handleToggle(activeCategory, entity)}
                          className={`w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
                            isAssigned
                              ? "bg-error-container text-on-error-container hover:bg-error/20"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {categoryLocked ? "Admin only" : isBusy ? "Saving..." : isAssigned ? "Remove" : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 sm:px-6 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
