"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/lib/useAuth";
import ResilienceSurveyForm from "@/components/ResilienceSurveyForm";

const emptyAddForm = {
  name: "",
  gender: "",
  dob: "",
  mobNumber: "",
  caste: "",
  religion: "",
  state: "",
  district: "",
  block: "",
  ward: "",
  village: "",
  primaryIncomeType: "Agriculture",
  annualIncome: "",
  monthlyIncome: "",
  householdSize: "4",
  emergencyContact: "",
  tier: "Tier 2",
  aadhar: "",
  panCard: "",
  rationCard: "",
  bankName: "",
  bankAccountNo: "",
  bankIfsc: "",
  programId: "",
};

export default function BeneficiaryMasterDirectory() {
  const toast = useToast();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("All Tiers");
  const [programFilter, setProgramFilter] = useState("All Programs");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [migratedFilter, setMigratedFilter] = useState("All");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState("details");
  const [addForm, setAddForm] = useState(emptyAddForm);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [livelihoodPrograms, setLivelihoodPrograms] = useState([]);

  const mapBeneficiaries = (data) =>
    data.map((b) => ({
      id: b.id,
      enrolmentId: b.enrolmentId,
      name: b.name,
      photoUrl: b.photoUrl || null,
      location: b.address || "Bartari, Kalgachia, Assam",
      householdSize: b.householdSize || 4,
      income: b.primaryIncomeType || "Agriculture",
      tier: b.tier,
      programs:
        (b.livelihoodDetails || []).map((d) => d.program?.name).filter(Boolean).length > 0
          ? (b.livelihoodDetails || []).map((d) => d.program?.name).filter(Boolean)
          : (b.schemeEnrollments || []).map((se) => se.scheme.name),
      resilienceScore: b.resilienceScore,
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
  };

  const farmPrograms = livelihoodPrograms.filter((p) => p.category === "FARM");
  const nonFarmPrograms = livelihoodPrograms.filter((p) => p.category === "NON_FARM");

  const updateAddField = (key, value) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddStep("details");
    setAddForm(emptyAddForm);
  };

  const handleAddNext = (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!addForm.programId) {
      toast.error("Please select a livelihood program.");
      return;
    }
    setAddStep("kyor");
  };

  const handleCreateBeneficiary = async ({ responses, scores }) => {
    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const enrolmentId = `BEN-${randomNum}-${randomLetter}`;

      const composedAddress =
        [addForm.village, addForm.ward, addForm.block, addForm.district, addForm.state]
          .map((s) => (s || "").trim())
          .filter(Boolean)
          .join(", ") || null;

      const res = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          enrolmentId,
          name: addForm.name.trim(),
          gender: addForm.gender || null,
          dob: addForm.dob || null,
          mobNumber: addForm.mobNumber || null,
          emergencyContact: addForm.emergencyContact || null,
          caste: addForm.caste || null,
          religion: addForm.religion || null,
          address: composedAddress,
          state: addForm.state || null,
          district: addForm.district || null,
          block: addForm.block || null,
          ward: addForm.ward || null,
          village: addForm.village || null,
          householdSize: addForm.householdSize ? parseInt(addForm.householdSize) : 4,
          primaryIncomeType: addForm.primaryIncomeType || null,
          annualIncome: addForm.annualIncome !== "" ? parseFloat(addForm.annualIncome) : null,
          monthlyIncome: addForm.monthlyIncome !== "" ? parseFloat(addForm.monthlyIncome) : null,
          tier: addForm.tier,
          aadhar: addForm.aadhar || null,
          panCard: addForm.panCard || null,
          rationCard: addForm.rationCard || null,
          bankName: addForm.bankName || null,
          bankAccountNo: addForm.bankAccountNo || null,
          bankIfsc: addForm.bankIfsc || null,
          programId: addForm.programId,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Failed to register beneficiary");
        return;
      }

      const newId = json.data.id;

      // Save the KYOR survey for the newly created beneficiary
      const surveyRes = await fetch(`/api/beneficiaries/${newId}/resilience-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ responses, scores }),
      });
      const surveyJson = await surveyRes.json();

      if (surveyJson.success) {
        toast.success(`Registered new beneficiary: ${addForm.name.trim()}`);
      } else {
        toast.error("Beneficiary created, but KYOR form could not be saved.");
      }

      await refreshBeneficiaries();
      closeAddModal();
    } catch (err) {
      console.error("Failed to add beneficiary:", err);
      toast.error("Failed to add beneficiary. Please try again.");
    }
  };

  const kyorPrefill = {
    "B.3": addForm.state,
    "B.4": addForm.district,
    "B.5": addForm.block,
    "B.6": addForm.ward,
    "B.7": addForm.village,
    "B.8": addForm.name,
    "B.9": addForm.gender,
    "B.10": addForm.householdSize,
    "B.14": addForm.primaryIncomeType,
    "B.16_Min": addForm.monthlyIncome,
    "B.16_Max": addForm.monthlyIncome,
    "B.18": addForm.caste,
  };
  const kyorHidden = ["B.3", "B.4", "B.5", "B.6", "B.7", "B.8", "B.9", "B.10", "B.14", "B.16", "B.18"];

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

  const inputClass =
    "px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs";
  const labelClass =
    "text-xs font-semibold text-on-surface-variant uppercase tracking-wider";

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/livelihood"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
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
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-on-surface tracking-tight leading-tight font-headline">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-full hover:shadow-[0_8px_24px_rgba(0,104,87,0.2)] transition-all font-semibold text-sm cursor-pointer"
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
            <span className="text-3xl font-black text-on-surface tracking-tighter">{beneficiaries.length + 8420}</span>
            <span className="text-xs text-on-surface-variant font-medium mt-1">Unified profiles logged</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-6 flex flex-wrap gap-4 items-center shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mr-2">
            Filter Registry
          </span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
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
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
          >
            <option value="All Tiers">All Tiers</option>
            <option value="Tier 1">Tier 1 (Critical)</option>
            <option value="Tier 2">Tier 2 (Progressing)</option>
            <option value="Tier 3">Tier 3 (Stable)</option>
          </select>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
          >
            <option value="All Programs">All Programs</option>
            {livelihoodPrograms.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <select
            value={migratedFilter}
            onChange={(e) => setMigratedFilter(e.target.value)}
            className="bg-surface-container border-none rounded-full text-sm py-1.5 pl-4 pr-8 text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer focus:outline-none dark:bg-slate-900"
          >
            <option value="All">All Status</option>
            <option value="Not Migrated">Not Migrated</option>
            <option value="Migrated">Migrated</option>
          </select>

          <button
            onClick={clearFilters}
            className="text-primary text-sm font-medium hover:underline ml-auto cursor-pointer font-sans"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden pt-4 pb-2 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] font-sans">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-on-surface-variant font-bold border-b border-surface-container">
                <th className="px-6 py-4">Beneficiary Name</th>
                <th className="px-6 py-4">District / Location</th>
                <th className="px-6 py-4">Social Economic Tier</th>
                <th className="px-6 py-4">Program Linkage</th>
                <th className="px-6 py-4">Resilience Index (KYOR)</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {filteredBeneficiaries.map((b, index) => (
                <tr
                  key={b.id}
                  className={`hover:bg-surface-container-low/50 transition-colors ${
                    index > 0 ? "border-t border-surface-container-low" : ""
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {b.photoUrl ? (
                          <img src={b.photoUrl} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          b.name.split(" ").map((n) => n[0]).join("")
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{b.name}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">ID: {b.enrolmentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-on-surface font-semibold">{b.location}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">{b.income}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-on-surface font-bold">{b.tier}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {b.programs.map((p, i) => (
                        <span key={i} className="bg-primary-fixed/20 text-on-primary-fixed text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
                      <span>{b.resilienceScore} / 100</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link
                      href={`/beneficiaries/${encodeURIComponent(b.id)}`}
                      className="text-primary hover:bg-primary/5 px-4 py-1.5 rounded-full text-xs font-bold transition-all inline-block hover:underline cursor-pointer"
                    >
                      View File
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
      </div>

      {/* Add Beneficiary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-surface-container pb-4">
              <div>
                <h3 className="text-xl font-bold">Add New Beneficiary</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {addStep === "details"
                    ? "Step 1 of 2 — Basic details, documents and program assignment."
                    : "Step 2 of 2 — Fill the KYOR form for this household."}
                </p>
              </div>
              <button
                onClick={closeAddModal}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <span className={addStep === "details" ? "text-primary" : "text-on-surface-variant"}>
                1. Basic Details
              </span>
              <span className="flex-1 h-px bg-surface-container-highest" />
              <span className={addStep === "kyor" ? "text-primary" : "text-on-surface-variant"}>
                2. KYOR Form
              </span>
            </div>

            {addStep === "details" && (
              <form onSubmit={handleAddNext} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Joynal Abedin"
                      className={inputClass}
                      value={addForm.name}
                      onChange={(e) => updateAddField("name", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Date of Birth</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={addForm.dob}
                      onChange={(e) => updateAddField("dob", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Gender</label>
                    <select
                      className={inputClass}
                      value={addForm.gender}
                      onChange={(e) => updateAddField("gender", e.target.value)}
                    >
                      <option value="">— Select —</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Don't want to respond">Don&apos;t want to respond</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 99887 71122"
                      className={inputClass}
                      value={addForm.mobNumber}
                      onChange={(e) => updateAddField("mobNumber", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Emergency Contact Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 99887 71100"
                      className={inputClass}
                      value={addForm.emergencyContact}
                      onChange={(e) => updateAddField("emergencyContact", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Caste</label>
                    <input
                      type="text"
                      placeholder="e.g. General, SC, ST"
                      className={inputClass}
                      value={addForm.caste}
                      onChange={(e) => updateAddField("caste", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Religion</label>
                    <input
                      type="text"
                      placeholder="e.g. Islam, Hinduism"
                      className={inputClass}
                      value={addForm.religion}
                      onChange={(e) => updateAddField("religion", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      placeholder="e.g. Assam"
                      className={inputClass}
                      value={addForm.state}
                      onChange={(e) => updateAddField("state", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>District</label>
                    <input
                      type="text"
                      placeholder="e.g. Barpeta"
                      className={inputClass}
                      value={addForm.district}
                      onChange={(e) => updateAddField("district", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Block</label>
                    <input
                      type="text"
                      placeholder="e.g. Kalgachia"
                      className={inputClass}
                      value={addForm.block}
                      onChange={(e) => updateAddField("block", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Ward / GP</label>
                    <input
                      type="text"
                      placeholder="e.g. Ward 2"
                      className={inputClass}
                      value={addForm.ward}
                      onChange={(e) => updateAddField("ward", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className={labelClass}>Village</label>
                    <input
                      type="text"
                      placeholder="e.g. Bartari"
                      className={inputClass}
                      value={addForm.village}
                      onChange={(e) => updateAddField("village", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Primary Income Category</label>
                    <select
                      className={inputClass}
                      value={addForm.primaryIncomeType}
                      onChange={(e) => updateAddField("primaryIncomeType", e.target.value)}
                    >
                      <option value="Agriculture">Agriculture</option>
                      <option value="Livestock">Livestock</option>
                      <option value="Daily Wage">Daily Wage</option>
                      <option value="Small Business">Small Business</option>
                      <option value="Remittance">Remittance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Socio-Economic Tier</label>
                    <select
                      className={inputClass}
                      value={addForm.tier}
                      onChange={(e) => updateAddField("tier", e.target.value)}
                    >
                      <option value="Tier 1">Tier 1 (Critical)</option>
                      <option value="Tier 2">Tier 2 (Progressing)</option>
                      <option value="Tier 3">Tier 3 (Stable)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Annual Income (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      className={inputClass}
                      value={addForm.annualIncome}
                      onChange={(e) => updateAddField("annualIncome", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Monthly Income (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 3750"
                      className={inputClass}
                      value={addForm.monthlyIncome}
                      onChange={(e) => updateAddField("monthlyIncome", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Household Size</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      className={inputClass}
                      value={addForm.householdSize}
                      onChange={(e) => updateAddField("householdSize", e.target.value)}
                    />
                  </div>
                </div>

                {/* Identity proofs */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Identity Proofs</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Aadhar Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        className={inputClass}
                        value={addForm.aadhar}
                        onChange={(e) => updateAddField("aadhar", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>PAN Card</label>
                      <input
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        className={inputClass}
                        value={addForm.panCard}
                        onChange={(e) => updateAddField("panCard", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Ration Card</label>
                      <input
                        type="text"
                        placeholder="e.g. SFY-AS-4029"
                        className={inputClass}
                        value={addForm.rationCard}
                        onChange={(e) => updateAddField("rationCard", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Bank details */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Bank Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        className={inputClass}
                        value={addForm.bankName}
                        onChange={(e) => updateAddField("bankName", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 30928409184"
                        className={inputClass}
                        value={addForm.bankAccountNo}
                        onChange={(e) => updateAddField("bankAccountNo", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0007421"
                        className={inputClass}
                        value={addForm.bankIfsc}
                        onChange={(e) => updateAddField("bankIfsc", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Program assignment */}
                <div className="pt-2">
                  <label className={labelClass}>Livelihood Program *</label>
                  <select
                    required
                    className={`${inputClass} w-full mt-1.5`}
                    value={addForm.programId}
                    onChange={(e) => updateAddField("programId", e.target.value)}
                  >
                    <option value="">— Select a program —</option>
                    {farmPrograms.length > 0 && (
                      <optgroup label="Farm Programs">
                        {farmPrograms.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {nonFarmPrograms.length > 0 && (
                      <optgroup label="Non-Farm Programs">
                        {nonFarmPrograms.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-xs text-on-surface-variant italic mt-2">
                    The beneficiary will be assigned to this program.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="px-5 py-2 rounded-full border border-outline-variant hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-primary text-white hover:bg-primary/95 shadow-glow transition-all font-semibold cursor-pointer flex items-center gap-2"
                  >
                    Next: KYOR Form
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </form>
            )}

            {addStep === "kyor" && (
              <ResilienceSurveyForm
                mode="embedded"
                prefill={kyorPrefill}
                hideQuestionIds={kyorHidden}
                onBack={() => setAddStep("details")}
                onSubmit={handleCreateBeneficiary}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
