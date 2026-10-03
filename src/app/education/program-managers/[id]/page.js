"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

export default function ProgramManagerProfileDetail() {
  const { id } = useParams();
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assignment management state
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageType, setManageType] = useState(null); // "schools" | "centres" | "programs"
  const [manageSearch, setManageSearch] = useState("");
  const [allSchools, setAllSchools] = useState([]);
  const [allCentres, setAllCentres] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);

  useEffect(() => {
    if (user?.roleName && user.roleName !== "ADMIN") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    async function loadManagerDetail() {
      try {
        const res = await fetch(`/api/program-managers/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setManager(json.data);
        }
      } catch (err) {
        console.error("Failed to load program manager detail:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!isInitializing && token) {
      loadManagerDetail();
    }
  }, [id, token, isInitializing]);

  const reloadManager = async () => {
    try {
      const res = await fetch(`/api/program-managers/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        setManager(json.data);
      }
    } catch (err) {
      console.error("Failed to reload program manager detail:", err);
    }
  };

  const openManage = async (type) => {
    setManageType(type);
    setManageSearch("");
    setShowManageModal(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      if (type === "schools" && allSchools.length === 0) {
        const res = await fetch("/api/schools", { headers });
        const json = await res.json();
        if (json.success) setAllSchools(json.data);
      } else if (type === "centres" && allCentres.length === 0) {
        const res = await fetch("/api/after-school-centres", { headers });
        const json = await res.json();
        if (json.success) setAllCentres(json.data);
      } else if (type === "programs" && allPrograms.length === 0) {
        const res = await fetch("/api/livelihood/programs", { headers });
        const json = await res.json();
        if (json.success) setAllPrograms(json.data.programs || []);
      }
    } catch (err) {
      console.error("Failed to load assignment candidates:", err);
      toast.error("Failed to load list");
    }
  };

  const handleToggleAssignment = async (entityId, isAssigned) => {
    if (isAssigned && !confirm("Remove this assignment?")) return;

    const endpoint =
      manageType === "schools"
        ? `/api/schools/${entityId}/program-managers`
        : manageType === "centres"
        ? `/api/after-school-centres/${entityId}/program-managers`
        : `/api/livelihood/programs/${entityId}/program-managers`;

    try {
      const res = await fetch(endpoint, {
        method: isAssigned ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId: manager.id })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isAssigned ? "Assignment removed" : "Assignment added");
        await reloadManager();
      } else {
        toast.error(json.error || "Failed to update assignment");
      }
    } catch (err) {
      console.error("Toggle assignment error:", err);
      toast.error("An error occurred");
    }
  };

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!manager) {
    return <div className="p-8 text-center text-on-surface-variant font-medium">Program manager not found</div>;
  }

  const initials = (manager.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  const memberSince = manager.createdAt
    ? new Date(manager.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "—";

  const assignedSchoolIds = new Set((manager.schools || []).map((s) => s.id));
  const assignedCentreIds = new Set((manager.centres || []).map((c) => c.id));
  const assignedProgramIds = new Set((manager.programs || []).map((p) => p.id));

  const manageConfig = {
    schools: {
      title: "Manage Schools",
      icon: "school",
      items: allSchools,
      assignedIds: assignedSchoolIds,
      empty: "No schools found.",
    },
    centres: {
      title: "Manage After School Centres",
      icon: "cottage",
      items: allCentres,
      assignedIds: assignedCentreIds,
      empty: "No after school centres found.",
    },
    programs: {
      title: "Manage Livelihood Programs",
      icon: "agriculture",
      items: allPrograms,
      assignedIds: assignedProgramIds,
      empty: "No livelihood programs found.",
    },
  };
  const activeConfig = manageType ? manageConfig[manageType] : null;
  const filteredCandidates = activeConfig
    ? activeConfig.items.filter((it) => (it.name || "").toLowerCase().includes(manageSearch.toLowerCase()))
    : [];

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/education/program-managers"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Program Managers
        </span>
      </Link>

      {/* Hero Section */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md">
            {manager.avatar ? (
              <img alt="Manager avatar" className="w-full h-full object-cover" src={manager.avatar} />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-3xl font-bold font-headline">
                {initials}
              </div>
            )}
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                {manager.name || manager.username}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                PROGRAM MANAGER
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex flex-wrap items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">mail</span>
              {manager.email}
              {manager.mobile && (
                <>
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                  <span className="material-symbols-outlined text-sm text-primary">phone</span>
                  {manager.mobile}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div>
                <span className="font-bold text-on-surface">Department:</span> {manager.department || "Unassigned"}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Gender:</span> {manager.gender || "—"}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Date of Birth:</span>{" "}
                {manager.dob
                  ? new Date(manager.dob).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Address:</span> {manager.address || "—"}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Member Since:</span> {memberSince}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Assignments */}
      <div className="mb-8">
        <h3 className="font-headline font-bold text-xl text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">assignment_ind</span>
          Assignments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Schools */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Schools
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {manager.schools.length}
                </span>
                <button
                  onClick={() => openManage("schools")}
                  title="Manage schools"
                  className="bg-primary/10 text-primary p-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
            </div>
            {manager.schools.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No schools assigned.</p>
            ) : (
              <ul className="space-y-2">
                {manager.schools.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/education/schools/${s.id}`}
                      className="flex items-center justify-between gap-2 text-sm text-on-surface hover:text-primary transition-colors group"
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary">
                        chevron_right
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* After School Centres */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">cottage</span>
                After School Centres
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {manager.centres.length}
                </span>
                <button
                  onClick={() => openManage("centres")}
                  title="Manage after school centres"
                  className="bg-primary/10 text-primary p-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
            </div>
            {manager.centres.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No centres assigned.</p>
            ) : (
              <ul className="space-y-2">
                {manager.centres.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/education/after-school-centres/${c.id}`}
                      className="flex items-center justify-between gap-2 text-sm text-on-surface hover:text-primary transition-colors group"
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary">
                        chevron_right
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Livelihood Programs */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">agriculture</span>
                Livelihood Programs
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {manager.programs.length}
                </span>
                <button
                  onClick={() => openManage("programs")}
                  title="Manage livelihood programs"
                  className="bg-primary/10 text-primary p-1.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
            </div>
            {manager.programs.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No programs assigned.</p>
            ) : (
              <ul className="space-y-2">
                {manager.programs.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/livelihood/programs/${p.id}`}
                      className="flex items-center justify-between gap-2 text-sm text-on-surface hover:text-primary transition-colors group"
                    >
                      <span className="truncate">
                        {p.name}
                        <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-400">
                          {p.category === "FARM" ? "Farm" : "Non-Farm"}
                        </span>
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary">
                        chevron_right
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Fellows */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">badge</span>
            Assigned Fellows
          </h3>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {manager.fellows.length}
          </span>
        </div>
        {manager.fellows.length === 0 ? (
          <p className="text-sm text-on-surface-variant italic">No fellows assigned.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
            {manager.fellows.map((f) => (
              <Link
                key={f.id}
                href={`/education/fellows/${f.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container-low transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                  {f.avatar ? (
                    <img alt="avatar" className="w-full h-full object-cover" src={f.avatar} />
                  ) : (
                    (f.name || "?")[0].toUpperCase()
                  )}
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{f.name}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{f.email || "—"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Manage Assignments Modal */}
      {showManageModal && activeConfig && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{activeConfig.icon}</span>
                {activeConfig.title}
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-on-surface-variant mb-4">
                Assign or remove {manager.name || "this Program Manager"} for the entries below.
              </p>
              <input
                type="text"
                placeholder="Search..."
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCandidates.length === 0 && (
                  <p className="text-sm text-on-surface-variant text-center py-4">{activeConfig.empty}</p>
                )}
                {filteredCandidates.map((item) => {
                  const isAssigned = activeConfig.assignedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      <div className="leading-tight min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">{item.name}</p>
                        {manageType === "programs" ? (
                          <p className="text-[11px] uppercase tracking-wider text-slate-400">
                            {item.category === "FARM" ? "Farm" : "Non-Farm"}
                          </p>
                        ) : (
                          item.location && <p className="text-xs text-on-surface-variant truncate">{item.location}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleAssignment(item.id, isAssigned)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border-none shrink-0 ${
                          isAssigned
                            ? "bg-error-container text-on-error-container hover:bg-error/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {isAssigned ? "Remove" : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
