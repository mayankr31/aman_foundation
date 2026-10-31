"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import AddBeneficiaryModal from "@/components/AddBeneficiaryModal";

export default function BeneficiaryMasterDirectory() {
  const router = useRouter();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("All Tiers");
  const [programFilter, setProgramFilter] = useState("All Programs");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [migratedFilter, setMigratedFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [livelihoodPrograms, setLivelihoodPrograms] = useState([]);

  const mapBeneficiaries = (data) =>
    data.map((b) => ({
      id: b.id,
      enrolmentId: b.enrolmentId,
      name: b.name,
      photoUrl: b.photoUrl || null,
      location:
        b.address ||
        [b.village, b.block, b.district, b.state].map((s) => (s || "").trim()).filter(Boolean).join(", ") ||
        "—",
      householdSize: b.householdSize || 4,
      income: b.primaryIncomeType || "—",
      tier: b.tier,
      programs:
        (b.livelihoodDetails || []).map((d) => d.program?.name).filter(Boolean).length > 0
          ? (b.livelihoodDetails || []).map((d) => d.program?.name).filter(Boolean)
          : (b.schemeEnrollments || []).map((se) => se.scheme?.name).filter(Boolean),
      resilienceScore: b.resilienceIndex ?? null,
      isMigrated: b.isMigrated,
    }));

  const refreshBeneficiaries = async () => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch("/api/beneficiaries", { headers });
    const json = await res.json();
    if (json.success) {
      setBeneficiaries(mapBeneficiaries(json.data));
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [res, progRes] = await Promise.all([
          fetch("/api/beneficiaries", { headers }),
          fetch("/api/livelihood/programs", { headers }),
        ]);
        const json = await res.json();
        const progJson = await progRes.json();

        if (progJson.success) {
          setLivelihoodPrograms(progJson.data.programs || []);
        }

        if (json.success) {
          setBeneficiaries(mapBeneficiaries(json.data));
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    }
    loadData();
  }, [token]);

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("All Tiers");
    setProgramFilter("All Programs");
    setLocationFilter("All Locations");
    setMigratedFilter("All");
    setCurrentPage(1);
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.enrolmentId && b.enrolmentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.id && b.id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === "All Tiers" || b.tier === tierFilter;

    const matchesProgram =
      programFilter === "All Programs" || b.programs.includes(programFilter);

    const matchesLocation =
      locationFilter === "All Locations" || b.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesMigrated =
      migratedFilter === "All" ||
      (migratedFilter === "Migrated" && b.isMigrated === true) ||
      (migratedFilter === "Not Migrated" && !b.isMigrated);

    return matchesSearch && matchesTier && matchesProgram && matchesLocation && matchesMigrated;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBeneficiaries = filteredBeneficiaries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/livelihood"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Livelihood Hub
        </span>
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <span className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
            Livelihood Database
          </span>
          <h2 className="page-title text-on-surface">
            Beneficiaries Master Registry
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl text-sm">
            Central master registry connecting all livelihood programs in Kalgachia, Assam. Monitor socio-economic growth, documents, and resilience indexes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 font-sans">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 focus:outline-none text-on-surface"
              placeholder="Search master database..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              type="text"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full hover:shadow-[0_8px_24px_rgba(0,104,87,0.2)] transition-all font-semibold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Beneficiary
          </button>
        </div>
      </div>

      {/* Filters Bento Box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-sans">
        <div className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
              Total Beneficiaries
            </span>
            <span className="text-3xl font-black text-on-surface tracking-tighter">{beneficiaries.length}</span>
            <span className="text-xs text-on-surface-variant font-medium mt-1">Unified profiles logged</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
              Filter Registry
            </span>
            <button
              onClick={clearFilters}
              className="text-primary text-xs font-semibold hover:underline cursor-pointer font-sans"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
              className="w-full min-w-0 bg-surface-container border-none rounded-full text-sm py-2 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
            >
              <option value="All Locations">All Locations</option>
              <option value="Bartari">Bartari</option>
              <option value="Digjani">Digjani</option>
              <option value="Sawpur">Sawpur</option>
              <option value="Balikuri">Balikuri</option>
              <option value="Moinbari">Moinbari</option>
              <option value="Gunialguri">Gunialguri</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setCurrentPage(1); }}
              className="w-full min-w-0 bg-surface-container border-none rounded-full text-sm py-2 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
            >
              <option value="All Tiers">All Tiers</option>
              <option value="Tier 1">Tier 1 (Critical)</option>
              <option value="Tier 2">Tier 2 (Progressing)</option>
              <option value="Tier 3">Tier 3 (Stable)</option>
            </select>

            <select
              value={programFilter}
              onChange={(e) => { setProgramFilter(e.target.value); setCurrentPage(1); }}
              className="w-full min-w-0 bg-surface-container border-none rounded-full text-sm py-2 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
            >
              <option value="All Programs">All Programs</option>
              {livelihoodPrograms.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            <select
              value={migratedFilter}
              onChange={(e) => { setMigratedFilter(e.target.value); setCurrentPage(1); }}
              className="w-full min-w-0 bg-surface-container border-none rounded-full text-sm py-2 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
            >
              <option value="All">All Status</option>
              <option value="Not Migrated">Not Migrated</option>
              <option value="Migrated">Migrated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden pt-4 pb-2 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
        <div className="w-full overflow-x-auto">
          <table className="mobile-card-table w-full text-left border-collapse min-w-[800px] table-fixed font-sans">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-on-surface-variant font-bold border-b border-surface-container">
                <th className="w-[22%] px-6 py-4">Beneficiary Name</th>
                <th className="w-[20%] px-6 py-4">District / Location</th>
                <th className="w-[14%] px-6 py-4">Social Economic Tier</th>
                <th className="w-[22%] px-6 py-4">Program Linkage</th>
                <th className="w-[12%] px-6 py-4">Resilience Index (KYR)</th>
                <th className="w-[10%] px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {paginatedBeneficiaries.map((b, index) => (
                <tr
                  key={b.id}
                  onClick={() => router.push(`/beneficiaries/${encodeURIComponent(b.id)}`)}
                  className={`hover:bg-surface-container-low/50 transition-colors cursor-pointer ${
                    index > 0 ? "border-t border-surface-container-low" : ""
                  }`}
                >
                  <td data-label="" className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        <Avatar src={b.photoUrl} name={b.name} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-on-surface break-words">{b.name}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5 break-words">ID: {b.enrolmentId}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="District / Location" className="px-6 py-5">
                    <div className="text-on-surface font-semibold break-words">{b.location}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5 break-words">{b.income}</div>
                  </td>
                  <td data-label="Social Economic Tier" className="px-6 py-5">
                    <span className="text-xs text-on-surface font-bold">{b.tier}</span>
                  </td>
                  <td data-label="Program Linkage" className="px-6 py-5">
                    {b.programs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {b.programs.map((p, i) => (
                          <span key={i} className="bg-primary-fixed/20 text-on-primary-fixed text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td data-label="Resilience Index (KYR)" className="px-6 py-5">
                    {b.resilienceScore != null ? (
                      <div
                        className="flex items-center gap-2 font-bold"
                        title="Composite of the latest Adaptive, Absorptive and Transformative capacity surveys"
                      >
                        <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
                        <span>{b.resilienceScore} / 100</span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 text-on-surface-variant"
                        title="Requires Adaptive, Absorptive and Transformative capacity surveys"
                      >
                        <span className="material-symbols-outlined text-sm">pending</span>
                        <span className="text-xs font-semibold">Not calculated</span>
                      </div>
                    )}
                  </td>
                  <td data-label="Actions" className="px-6 py-5 text-right">
                    <Link
                      href={`/beneficiaries/${encodeURIComponent(b.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full text-xs font-bold transition-all inline-block hover:underline cursor-pointer"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredBeneficiaries.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 text-xs font-sans">
                    No beneficiary records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={safePage} totalItems={filteredBeneficiaries.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {/* Add Beneficiary Modal */}
      {showAddModal && (
        <AddBeneficiaryModal
          onClose={() => setShowAddModal(false)}
          onCreated={refreshBeneficiaries}
        />
      )}
    </div>
  );
}
