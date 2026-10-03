"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function ProgramsModule() {
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.roleName && user.roleName !== "ADMIN") {
      router.replace("/");
    }
  }, [user, router]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [managers, setManagers] = useState([]);

  const fetchManagersData = useCallback(async () => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch("/api/program-managers", { headers });
    const json = await res.json();
    return { managers: json.success ? json.data : null };
  }, [token]);

  useEffect(() => {
    let active = true;
    fetchManagersData()
      .then(({ managers: m }) => {
        if (!active) return;
        if (m) setManagers(m);
      })
      .catch((err) => console.error("Failed to load program managers:", err));
    return () => {
      active = false;
    };
  }, [fetchManagersData]);

  const departments = ["All", ...new Set(managers.map((m) => m.department).filter(Boolean))];

  const filteredManagers = useMemo(
    () =>
      managers.filter(
        (m) =>
          ((m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
          (selectedDepartment === "All" || m.department === selectedDepartment)
      ),
    [managers, searchQuery, selectedDepartment]
  );

  const totals = useMemo(
    () =>
      managers.reduce(
        (acc, m) => ({
          schools: acc.schools + (m.schools || 0),
          centres: acc.centres + (m.centres || 0),
          programs: acc.programs + (m.programs || 0),
        }),
        { schools: 0, centres: 0, programs: 0 }
      ),
    [managers]
  );

  const handleExport = async () => {
    const rows = filteredManagers.map((m) => ({
      "Name": m.name || m.username || "",
      "Username": m.username || "",
      "Email": m.email || "",
      "Mobile": m.mobile || "",
      "Department": m.department || "",
      "Status": m.status || "",
      "Managed Schools": m.schools ?? 0,
      "Managed Centres": m.centres ?? 0,
      "Managed Livelihood Programs": m.programs ?? 0,
      "Joined Date": m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
    }));

    const imported = await import("xlsx");
    const XLSX = imported.default || imported;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Program Managers");
    XLSX.writeFile(workbook, `program_managers_export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredManagers.length / ITEMS_PER_PAGE);
  const paginatedManagers = filteredManagers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/education"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Education Hub
        </span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[2.75rem] font-headline font-black text-on-surface tracking-[-0.02em] leading-none mb-3">
          Program Managers
        </h2>
        <p className="text-sm font-medium text-on-surface-variant max-w-2xl leading-relaxed">
          Overview of all program managers, their assignments, and the fellows they supervise across every operating region.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-4 w-full mb-10 shrink-0">
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 transition-shadow"
            placeholder="Search program managers..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            type="text"
          />
        </div>

        {/* Department Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-auto pl-4 pr-10 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm transition-shadow appearance-none cursor-pointer text-on-surface font-sans font-medium"
          >
            {departments.map((d) => (
              <option key={d} value={d} className="bg-surface-container text-on-surface">
                {d === "All" ? "All Departments" : d}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
            expand_more
          </span>
        </div>

        <button
          onClick={handleExport}
          className="bg-surface-container text-on-surface px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-surface-container-high transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 font-sans">
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed/20 rounded-full blur-2xl group-hover:bg-primary-fixed/30 transition-colors"></div>
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Total Program Managers
          </p>
          <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">
            {managers.length}
          </h3>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Managed Schools
          </p>
          <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">
            {totals.schools}
          </h3>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Managed Centres
          </p>
          <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">
            {totals.centres}
          </h3>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
          <p className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
            Managed Livelihood Programs
          </p>
          <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight">
            {totals.programs}
          </h3>
        </div>
      </div>

      {/* List View */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-surface-container-highest">
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-container-highest text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-semibold">
              <th className="px-8 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Schools</th>
              <th className="px-6 py-4">Centres</th>
              <th className="px-6 py-4">Programs</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedManagers.map((m) => (
              <tr
                key={m.id}
                className="border-b border-surface-container-highest hover:bg-surface-container-low transition-colors"
              >
                <td className="px-8 py-4 font-semibold text-on-surface">{m.name || m.username}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.email}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.department || "Unassigned"}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.schools}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.centres}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.programs}</td>
                <td className="px-8 py-4 text-right">
                  <Link
                    href={`/education/program-managers/${m.id}`}
                    className="text-primary hover:text-primary-container text-sm font-semibold transition-colors cursor-pointer"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2 font-sans">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Prev
          </button>
          <span className="text-sm text-on-surface-variant font-semibold px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {filteredManagers.length === 0 && (
        <p className="text-center py-12 text-xs text-slate-400 font-sans">
          No program managers match your search.
        </p>
      )}
    </div>
  );
}
