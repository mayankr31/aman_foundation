"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

export default function SugarcaneProgramDetail({ params }) {
  const { id } = use(params);
  const { token } = useAuth();
  const toast = useToast();
  
  const [program, setProgram] = useState(null);
  const [allBens, setAllBens] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");

  // Enroll Modal States
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedExistingBenId, setSelectedExistingBenId] = useState("");
  const [newParcel, setNewParcel] = useState("");
  const [newStage, setNewStage] = useState("Planting");
  const [newSoil, setNewSoil] = useState("Clay Loam");
  const [newWater, setNewWater] = useState("Rainfed");
  const [newEstYield, setNewEstYield] = useState("");
  const [newEstRev, setNewEstRev] = useState("");

  // Edit Assignment Modal States
  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editFarmerId, setEditFarmerId] = useState("");
  const [editFarmerName, setEditFarmerName] = useState("");
  const [editLand, setEditLand] = useState("");
  const [editSoil, setEditSoil] = useState("Clay Loam");
  const [editWater, setEditWater] = useState("Rainfed");
  const [editStage, setEditStage] = useState("Planting");
  const [editActualYield, setEditActualYield] = useState("");
  const [editActualRev, setEditActualRev] = useState("");
  const [editFertilizers, setEditFertilizers] = useState("");
  const [editEstYield, setEditEstYield] = useState("");
  const [editEstRev, setEditEstRev] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [progRes, bensRes] = await Promise.all([
          fetch(`/api/livelihood/programs/sugarcane/${id}`, { headers }),
          fetch(`/api/beneficiaries`, { headers })
        ]);
        
        const progJson = await progRes.json();
        const bensJson = await bensRes.json();

        if (progJson.success) {
          setProgram(progJson.data);
        }
        if (bensJson.success) {
          setAllBens(bensJson.data);
        }
      } catch (err) {
        console.error("Failed to load program data:", err);
      }
    }
    loadData();
  }, [id, token, refreshTrigger]);

  if (!program) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="text-on-surface-variant text-sm font-semibold animate-pulse">Loading program details...</div>
      </div>
    );
  }

  // Calculate statistics from the nested beneficiary array
  const enrolledFarmers = program.beneficiaries || [];
  
  const mappedFarmers = enrolledFarmers.map(assign => {
    const b = assign.beneficiary;
    const initials = b.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    return {
      id: b.id,
      assignmentId: assign.id,
      name: b.name,
      initials,
      bgInitials: "bg-primary-container text-on-primary-container",
      location: b.address || "Unknown",
      parcel: assign.hectaresAllotted,
      stage: assign.cropStage,
      stageClass: assign.cropStage === "Harvesting" || assign.cropStage === "Harvested" ? "bg-secondary-container/20 text-secondary" : "bg-primary/10 text-primary",
      soilType: assign.soilType,
      waterSource: assign.waterSource,
      estYield: assign.estimatedYieldTons,
      estIncome: assign.estimatedRevenue,
      actualYield: assign.actualYieldTons,
      actualRevenue: assign.actualRevenue,
      fertilizers: assign.fertilizersDistributed || "None",
      rawAssignment: assign
    };
  });

  const locations = ["All", ...new Set(mappedFarmers.map((f) => f.location.split(",")[0].trim()))];
  const stages = ["All", "Planting", "Growing", "Harvesting", "Harvested"];

  const filteredFarmers = mappedFarmers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "All" || f.location.includes(selectedLocation);
    const matchesStage = selectedStage === "All" || f.stage === selectedStage;
    return matchesSearch && matchesLocation && matchesStage;
  });

  const unenrolledBens = allBens.filter(b => !mappedFarmers.some(mf => mf.id === b.id));

  const totalAllotted = mappedFarmers.reduce((sum, f) => sum + f.parcel, 0);
  const totalEstimatedYield = mappedFarmers.reduce((sum, f) => sum + f.estYield, 0);

  const handleNewParcelChange = (val) => {
    setNewParcel(val);
    const h = parseFloat(val || 0);
    setNewEstYield(h * 45);
    setNewEstRev(h * 45 * 3120);
  };

  const handleEditLandChange = (val) => {
    setEditLand(val);
    const h = parseFloat(val || 0);
    setEditEstYield(h * 45);
    setEditEstRev(h * 45 * 3120);
  };

  const handleNewEstYieldChange = (val) => {
    setNewEstYield(val);
    const y = parseFloat(val || 0);
    setNewEstRev(y * 3120);
  };

  const handleEditEstYieldChange = (val) => {
    setEditEstYield(val);
    const y = parseFloat(val || 0);
    setEditEstRev(y * 3120);
  };

  const handleActualYieldChange = (val) => {
    setEditActualYield(val);
    const y = parseFloat(val || 0);
    setEditActualRev(y * 3120);
  };

  const handleEnrollFarmer = async (e) => {
    e.preventDefault();
    if (!selectedExistingBenId || !newParcel) return;

    const hectares = parseFloat(newParcel);
    const tons = newEstYield !== "" ? parseFloat(newEstYield) : hectares * 45;
    const income = newEstRev !== "" ? parseFloat(newEstRev) : tons * 3120;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/sugarcane/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          beneficiaryId: selectedExistingBenId,
          assignment: {
            hectaresAllotted: hectares,
            soilType: newSoil,
            waterSource: newWater,
            cropStage: newStage,
            estimatedYieldTons: tons,
            estimatedRevenue: income,
          }

        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Beneficiary successfully enrolled in the program.");
        setRefreshTrigger(prev => prev + 1);
        setShowEnrollModal(false);
        setSelectedExistingBenId("");
        setNewParcel("");
      } else {
        toast.error(json.error || "Failed to enroll beneficiary");
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("An error occurred during enrollment.");
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!editFarmerId) return;

    const hectares = parseFloat(editLand || 0);
    const estYield = editEstYield !== "" ? parseFloat(editEstYield) : hectares * 45;
    const estRev = editEstRev !== "" ? parseFloat(editEstRev) : estYield * 3120;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/sugarcane/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          beneficiaryId: editFarmerId,
          assignment: {
            hectaresAllotted: hectares,
            soilType: editSoil,
            waterSource: editWater,
            cropStage: editStage,
            estimatedYieldTons: estYield,
            estimatedRevenue: estRev,
            actualYieldTons: editActualYield,
            actualRevenue: editActualRev,
            fertilizersDistributed: editFertilizers,
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Assignment updated successfully.");
        setRefreshTrigger(prev => prev + 1);
        setShowEditAssignModal(false);
      } else {
        toast.error(json.error || "Failed to update assignment");
      }
    } catch (err) {
      console.error("Update assignment error:", err);
      toast.error("An error occurred while updating the assignment.");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Header */}
      <div>
        <Link
          href="/livelihood/sugarcane"
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 group w-fit"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
            arrow_back
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
            Back to Sugarcane Overview
          </span>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
              Program Details
            </span>
            <h2 className="text-4xl md:text-5xl font-headline tracking-[-0.02em] font-semibold text-on-surface">
              {program.name}
            </h2>
            <p className="text-on-surface-variant mt-2 max-w-2xl text-body font-body leading-relaxed text-sm">
              {program.description}
            </p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-lg shadow-primary/30 active:scale-95 font-sans cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Beneficiary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Total Land Profile
            </span>
            <span className="material-symbols-outlined text-primary">landscape</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {totalAllotted.toFixed(1)} <span className="text-xl text-on-surface-variant">/ {program.totalLandHectares} Ha</span>
          </div>
          <p className="text-sm text-on-surface-variant">Allotted Land vs Target</p>
          <div className="mt-4 h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min((totalAllotted / (program.totalLandHectares || 1)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Enrolled Farmers
            </span>
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {mappedFarmers.length}
          </div>
          <p className="text-sm text-on-surface-variant">Active beneficiaries</p>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Est. Yield Forecast
            </span>
            <span className="material-symbols-outlined text-tertiary">monitoring</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {totalEstimatedYield.toFixed(0)} <span className="text-xl text-on-surface-variant">Tons</span>
          </div>
          <p className="text-sm text-on-surface-variant">Expected Yield</p>
        </div>

        {/* Beneficiaries Table */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden border border-outline-variant/10">
          <div className="p-6 pb-4 pt-8 pl-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-surface-container-lowest border-b border-surface-container-highest">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Program Beneficiaries</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Farmers actively participating in this program.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search farmers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-1.5 rounded-full border border-outline-variant text-xs focus:outline-none focus:border-primary w-full md:w-48 font-sans bg-transparent text-on-surface font-semibold"
              />
              
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-1.5 bg-surface-container text-on-surface rounded-full border-none focus:ring-1 focus:ring-primary text-xs cursor-pointer appearance-none font-sans font-bold"
                >
                  <option value="All" className="bg-surface-container text-on-surface">All Villages</option>
                  {locations.filter(loc => loc !== "All").map((loc) => (
                    <option key={loc} value={loc} className="bg-surface-container text-on-surface">
                      {loc}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-1.5 bg-surface-container text-on-surface rounded-full border-none focus:ring-1 focus:ring-primary text-xs cursor-pointer appearance-none font-sans font-bold"
                >
                  <option value="All" className="bg-surface-container text-on-surface">All Stages</option>
                  {stages.filter(st => st !== "All").map((st) => (
                    <option key={st} value={st} className="bg-surface-container text-on-surface">
                      {st}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container-highest">
                  <th className="px-8 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Farmer Name
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Location
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Parcel Size
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Crop Stage
                  </th>
                  <th className="px-8 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredFarmers.map((f, i) => (
                  <tr
                    key={f.id}
                    className="border-b border-surface-container-highest hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${f.bgInitials}`}
                        >
                          {f.initials}
                        </div>
                        <span className="font-bold text-on-surface">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{f.location}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{f.parcel} Hectares</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${f.stageClass}`}>
                        {f.stage}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right flex justify-end gap-3 items-center">
                      <button
                        onClick={() => {
                          setEditFarmerId(f.id);
                          setEditFarmerName(f.name);
                          setEditLand(f.rawAssignment.hectaresAllotted || 0);
                          setEditSoil(f.rawAssignment.soilType || "Clay Loam");
                          setEditWater(f.rawAssignment.waterSource || "Rainfed");
                          setEditStage(f.rawAssignment.cropStage || "Planting");
                          setEditActualYield(f.rawAssignment.actualYieldTons !== null ? f.rawAssignment.actualYieldTons : "");
                          setEditActualRev(f.rawAssignment.actualRevenue !== null ? f.rawAssignment.actualRevenue : "");
                          setEditFertilizers(f.rawAssignment.fertilizersDistributed || "");
                          setEditEstYield(f.rawAssignment.estimatedYieldTons || "");
                          setEditEstRev(f.rawAssignment.estimatedRevenue || "");
                          setShowEditAssignModal(true);
                        }}
                        className="text-secondary hover:text-secondary-container transition-colors cursor-pointer font-sans text-xs font-bold hover:underline bg-transparent border-none"
                      >
                        Edit Assignment
                      </button>
                      <span className="text-slate-300">|</span>
                      <Link
                        href={`/beneficiaries/${f.id}`}
                        className="text-primary hover:text-primary-container transition-colors cursor-pointer font-sans text-xs font-bold hover:underline"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-xs text-slate-400 font-sans font-semibold">
                      No beneficiaries match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Beneficiary to Program</h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEnrollFarmer} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Select Beneficiary
                </label>
                <select
                  required
                  value={selectedExistingBenId}
                  onChange={(e) => setSelectedExistingBenId(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface cursor-pointer"
                >
                  <option value="">-- Select Beneficiary --</option>
                  {unenrolledBens.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.enrolmentId})
                    </option>
                  ))}
                  {unenrolledBens.length === 0 && (
                    <option disabled>No unenrolled beneficiaries found</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Parcel Size (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 3.5"
                  value={newParcel}
                  onChange={(e) => handleNewParcelChange(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Est. Yield (Tons) <span className="text-[9px] text-slate-400 normal-case">(Hectares × 45)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto-calculated"
                    value={newEstYield}
                    onChange={(e) => handleNewEstYieldChange(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Est. Revenue (₹) <span className="text-[9px] text-slate-400 normal-case">(Yield × 3120)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto-calculated"
                    value={newEstRev}
                    onChange={(e) => setNewEstRev(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Soil Profile Type
                </label>
                <select
                  value={newSoil}
                  onChange={(e) => setNewSoil(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Sandy Soil">Sandy Soil</option>
                  <option value="Alluvial Soil">Alluvial Soil</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Watering Resource Linkage
                </label>
                <select
                  value={newWater}
                  onChange={(e) => setNewWater(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Rainfed">Rainfed</option>
                  <option value="Drip Irrigation">Drip Irrigation</option>
                  <option value="Canal Linkage">Canal Linkage</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Crop Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Planting">Planting</option>
                  <option value="Growing">Growing</option>
                  <option value="Harvesting">Harvesting</option>
                  <option value="Harvested">Harvested</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer border-none"
                >
                  Add Beneficiary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Edit Sugarcane Assignment</h3>
                <p className="text-xs text-on-surface-variant mt-1">Assign land size and update seasonal yield indicators for {editFarmerName}.</p>
              </div>
              <button
                onClick={() => setShowEditAssignModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateAssignment} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Allotted Land (Hectares)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editLand}
                    onChange={(e) => handleEditLandChange(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Est. Yield (Tons) <span className="text-[9px] text-slate-400 normal-case">(Hectares × 45)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editEstYield}
                    onChange={(e) => handleEditEstYieldChange(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Est. Revenue (₹) <span className="text-[9px] text-slate-400 normal-case">(Yield × 3120)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editEstRev}
                    onChange={(e) => setEditEstRev(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Soil Profile Type
                  </label>
                  <select
                    value={editSoil}
                    onChange={(e) => setEditSoil(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                  >
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Sandy Soil">Sandy Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Water Resource Linkage
                  </label>
                  <select
                    value={editWater}
                    onChange={(e) => setEditWater(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                  >
                    <option value="Rainfed">Rainfed</option>
                    <option value="Drip Irrigation">Drip Irrigation</option>
                    <option value="Canal Linkage">Canal Linkage</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Crop Growth Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                  >
                    <option value="Planting">Planting</option>
                    <option value="Growing">Growing</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Harvested">Harvested</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Fertilizers Distributed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NPK (5 bags)"
                    value={editFertilizers}
                    onChange={(e) => setEditFertilizers(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actual Harvested Yield (Tons)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 150"
                    value={editActualYield}
                    onChange={(e) => handleActualYieldChange(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actual Realized Revenue (₹) <span className="text-[9px] text-slate-400 normal-case">(Actual Yield × 3120)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 468000"
                    value={editActualRev}
                    onChange={(e) => setEditActualRev(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowEditAssignModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer border-none shadow-glow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
