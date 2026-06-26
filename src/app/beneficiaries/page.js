"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/lib/useAuth";

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStepText, setImportStepText] = useState("");

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [sugarcanePrograms, setSugarcanePrograms] = useState([]);
  const [goatRearingPrograms, setGoatRearingPrograms] = useState([]);
  const [hasGoatChecked, setHasGoatChecked] = useState(false);
  const [hasSugarcaneChecked, setHasSugarcaneChecked] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [res, progRes] = await Promise.all([
          fetch("/api/beneficiaries", { headers }),
          fetch("/api/livelihood/programs", { headers })
        ]);
        const json = await res.json();
        const progJson = await progRes.json();

        if (progJson.success) {
          setSugarcanePrograms(progJson.data.sugarcanePrograms || []);
          setGoatRearingPrograms(progJson.data.goatRearingPrograms || []);
        }

        if (json.success) {
          const mapped = json.data.map(b => ({
            id: b.id,
            enrolmentId: b.enrolmentId,
            name: b.name,
            location: b.address || "Bartari, Kalgachia, Assam",
            householdSize: b.householdSize || 4,
            income: b.primaryIncomeType || "Agriculture",
            tier: b.tier,
            tierPercent: b.tierPercent,
            programs: (b.schemeEnrollments || []).map(se => se.scheme.name),
            resilienceScore: b.resilienceScore,
            isMigrated: b.isMigrated,
          }));
          setBeneficiaries(mapped);
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

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name").trim();
    const locationVal = formData.get("location");
    const householdSize = parseInt(formData.get("householdSize") || "4");
    const income = formData.get("income");
    const tier = formData.get("tier");
    const resilienceScore = parseInt(formData.get("resilienceScore") || "50");
    
    const programs = [];
    if (formData.get("program_goat")) programs.push("Goat Rearing");
    if (formData.get("program_sugarcane")) programs.push("Sugarcane");
    if (programs.length === 0) programs.push("Goat Rearing"); // Default fallback
    
    let tierPercent = 50;
    if (tier === "Tier 1") tierPercent = 40;
    else if (tier === "Tier 2") tierPercent = 65;
    else if (tier === "Tier 3") tierPercent = 90;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const enrolmentId = `BEN-${randomNum}-${randomLetter}`;

    try {
      const res = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          enrolmentId,
          name,
          dob: formData.get("dob") || null,
          mobNumber: formData.get("mobNumber") || null,
          caste: formData.get("caste") || null,
          religion: formData.get("religion") || null,
          address: `${locationVal}, Kalgachia, Assam`,
          householdSize,
          primaryIncomeType: income,
          annualIncome: formData.get("annualIncome") ? parseFloat(formData.get("annualIncome")) : null,
          monthlyIncome: formData.get("monthlyIncome") ? parseFloat(formData.get("monthlyIncome")) : null,
          tier,
          tierPercent,
          resilienceScore,
          aadhar: formData.get("aadhar") || null,
          panCard: formData.get("panCard") || null,
          rationCard: formData.get("rationCard") || null,
          bankName: formData.get("bankName") || null,
          bankAccountNo: formData.get("bankAccountNo") || null,
          bankIfsc: formData.get("bankIfsc") || null,
          schemes: programs
        })
      });
        if (json.success) {
        // reload beneficiaries list
        const loadRes = await fetch("/api/beneficiaries", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const loadJson = await loadRes.json();
        if (loadJson.success) {
          const remapped = loadJson.data.map(b => ({
            id: b.id,
            enrolmentId: b.enrolmentId,
            name: b.name,
            location: b.address || "Bartari, Kalgachia, Assam",
            householdSize: b.householdSize || 4,
            income: b.primaryIncomeType || "Agriculture",
            tier: b.tier,
            tierPercent: b.tierPercent,
            programs: (b.schemeEnrollments || []).map(se => se.scheme.name),
            resilienceScore: b.resilienceScore,
            isMigrated: b.isMigrated,
          }));
          setBeneficiaries(remapped);
        }
        toast.success(`Registered new beneficiary: ${name}`);
        setHasGoatChecked(false);
        setHasSugarcaneChecked(false);
        setShowAddModal(false);
      } else {
        alert(json.error || "Failed to register beneficiary");
      }
    } catch (err) {
      console.error("Failed to add beneficiary:", err);
    }
  };

  const simulateBulkImport = () => {
    setImporting(true);
    setImportProgress(0);
    setImportStepText("Reading uploaded CSV file...");
    
    // Simulate step 1
    setTimeout(() => {
      setImportProgress(35);
      setImportStepText("Parsing row data (15 records found)...");
      
      // Simulate step 2
      setTimeout(() => {
        setImportProgress(70);
        setImportStepText("Validating unique IDs and Kalgachia locations...");
        
        // Simulate step 3
        setTimeout(() => {
          setImportProgress(100);
          setImportStepText("Writing records to master directory...");
          
          setTimeout(() => {
            // Append 3 dummy beneficiaries near Kalgachia
            const imported = [
              {
                id: "BEN-511-N",
                enrolmentId: "BEN-511-N",
                name: "Rupjan Nessa",
                location: "Gunialguri, Kalgachia, Assam",
                householdSize: 5,
                income: "Livestock",
                tier: "Tier 2",
                tierPercent: 65,
                programs: ["Goat Rearing"],
                resilienceScore: 74,
              },
              {
                id: "BEN-839-K",
                enrolmentId: "BEN-839-K",
                name: "Abul Kalam",
                location: "Bartari, Kalgachia, Assam",
                householdSize: 6,
                income: "Agriculture",
                tier: "Tier 3",
                tierPercent: 90,
                programs: ["Sugarcane"],
                resilienceScore: 88,
              },
              {
                id: "BEN-293-X",
                enrolmentId: "BEN-293-X",
                name: "Khadija Khatun",
                location: "Moinbari, Kalgachia, Assam",
                householdSize: 7,
                income: "Livestock",
                tier: "Tier 1",
                tierPercent: 40,
                programs: ["Goat Rearing"],
                resilienceScore: 48,
              }
            ];
            
            const updated = [...imported, ...beneficiaries];
            setBeneficiaries(updated);
            
            toast.success("Bulk import complete: 3 new Kalgachia beneficiaries registered successfully!");
            setImporting(false);
            setShowImportModal(false);
          }, 600);
        }, 800);
      }, 800);
    }, 800);
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

          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-surface-container text-on-surface border border-outline-variant/30 rounded-full hover:bg-surface-container-high transition-all font-semibold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Bulk Import
          </button>

          <button className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full hover:shadow-[0_8px_24px_rgba(0,104,87,0.2)] transition-all font-medium text-sm flex-shrink-0 cursor-pointer">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Master
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
            <option value="All Programs">All Sub-Programs</option>
            <option value="Goat Rearing">Goat Rearing</option>
            <option value="Sugarcane">Sugarcane Cultivation</option>
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
                <th className="px-6 py-4">Socio-Economic Progress</th>
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
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {b.name.split(" ").map((n) => n[0]).join("")}
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
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden max-w-[100px]">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${b.tierPercent}%` }}></div>
                      </div>
                      <span className="text-xs text-on-surface font-bold">{b.tier}</span>
                    </div>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center border-b border-surface-container pb-4">
              <div>
                <h3 className="text-xl font-bold">Add New Beneficiary</h3>
                <p className="text-xs text-on-surface-variant mt-1">Register a new profile in the livelihood master registry.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddBeneficiary} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joynal Abedin"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface"
                    name="name"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Village / Location
                  </label>
                  <select
                    name="location"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                  >
                    <option value="Bartari">Bartari</option>
                    <option value="Digjani">Digjani</option>
                    <option value="Sawpur">Sawpur</option>
                    <option value="Balikuri">Balikuri</option>
                    <option value="Gunialguri">Gunialguri</option>
                    <option value="Moinbari">Moinbari</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="dob"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99887 71122"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="mobNumber"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Caste
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. General, SC, ST"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="caste"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Religion
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Islam, Hinduism"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="religion"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Annual Income (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="annualIncome"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Monthly Income (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3750"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="monthlyIncome"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="aadhar"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    PAN Card
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="panCard"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Ration Card
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SFY-AS-4029"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="rationCard"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="bankName"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 30928409184"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="bankAccountNo"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0007421"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="bankIfsc"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Household Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    defaultValue="4"
                    required
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="householdSize"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Primary Income Source
                  </label>
                  <select
                    name="income"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-xs"
                  >
                    <option value="Agriculture">Agriculture</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Daily Wage">Daily Wage</option>
                    <option value="Small Business">Small Business</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Socio-Economic Tier
                  </label>
                  <select
                    name="tier"
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-xs"
                  >
                    <option value="Tier 1">Tier 1 (Critical)</option>
                    <option value="Tier 2">Tier 2 (Progressing)</option>
                    <option value="Tier 3">Tier 3 (Stable)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Resilience Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="50"
                    required
                    className="px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-xs"
                    name="resilienceScore"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Program Linkages
                </label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      name="program_goat"
                      checked={hasGoatChecked}
                      onChange={(e) => setHasGoatChecked(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Goat Rearing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      name="program_sugarcane"
                      checked={hasSugarcaneChecked}
                      onChange={(e) => setHasSugarcaneChecked(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Sugarcane Cultivation</span>
                  </label>
                </div>
              </div>

              {(hasGoatChecked || hasSugarcaneChecked) && (
                <p className="text-xs text-on-surface-variant italic p-3 bg-surface-container-low/30 rounded-xl border border-outline-variant/10">
                  Specific program parameters (like goats assigned, land allotted) can be configured from the respective Program Detail pages after registration.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 rounded-full border border-outline-variant hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-primary text-white hover:bg-primary/95 shadow-glow transition-all font-semibold cursor-pointer"
                >
                  Register Beneficiary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center border-b border-surface-container pb-4">
              <div>
                <h3 className="text-xl font-bold">Bulk Import Beneficiaries</h3>
                <p className="text-xs text-on-surface-variant mt-1">Simulate uploading a CSV spreadsheet of beneficiary data.</p>
              </div>
              <button
                onClick={() => {
                  if (!importing) setShowImportModal(false);
                }}
                disabled={importing}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {importing ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
                  <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                  <span>{importStepText}</span>
                </div>
                <p className="text-xs text-on-surface-variant">{importProgress}% Complete</p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="border-2 border-dashed border-outline-variant/60 rounded-xl p-8 text-center flex flex-col items-center gap-3 hover:border-primary/50 transition-colors bg-surface-container-low/20">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                    cloud_upload
                  </span>
                  <div>
                    <p className="font-bold text-sm">Drag and drop your spreadsheet here</p>
                    <p className="text-xs text-on-surface-variant mt-1">Supports .csv, .xls, .xlsx (Max 10MB)</p>
                  </div>
                  <div className="w-px h-4 bg-outline-variant/40"></div>
                  <button className="px-4 py-1.5 bg-surface-container rounded-full text-xs font-semibold text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors">
                    Browse Files
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-container">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-5 py-2 rounded-full border border-outline-variant hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={simulateBulkImport}
                    className="px-6 py-2 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary hover:shadow-glow transition-all font-semibold text-xs cursor-pointer"
                  >
                    Simulate Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
