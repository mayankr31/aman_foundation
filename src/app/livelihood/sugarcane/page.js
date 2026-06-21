"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function SugarcaneCultivation() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [sugarcanePrograms, setSugarcanePrograms] = useState([]);
  const [allBens, setAllBens] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states for enrollment
  const [enrollType, setEnrollType] = useState("new"); // "new" or "existing"
  const [selectedExistingBenId, setSelectedExistingBenId] = useState("");
  const [newFarmerName, setNewFarmerName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newParcel, setNewParcel] = useState("");
  const [newStage, setNewStage] = useState("Planting");
  const [newSoil, setNewSoil] = useState("Clay Loam");
  const [newWater, setNewWater] = useState("Rainfed");
  const [newProgramId, setNewProgramId] = useState("");

  // Form states for adding programs
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramDesc, setNewProgramDesc] = useState("");
  const [newProgramLand, setNewProgramLand] = useState("");

  // Form states for editing assignments
  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editFarmerId, setEditFarmerId] = useState("");
  const [editFarmerName, setEditFarmerName] = useState("");
  const [editLand, setEditLand] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editSoil, setEditSoil] = useState("Clay Loam");
  const [editWater, setEditWater] = useState("Rainfed");
  const [editStage, setEditStage] = useState("Planting");
  const [editActualYield, setEditActualYield] = useState("");
  const [editActualRev, setEditActualRev] = useState("");
  const [editFertilizers, setEditFertilizers] = useState("");

  useEffect(() => {
    async function loadSugarcaneData() {
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
        }

        if (json.success) {
          setAllBens(json.data);
          const caneFarmers = json.data.filter(b =>
            b.schemeEnrollments.some(se => se.scheme.name.toLowerCase().includes("sugarcane"))
          ).map((b, idx) => {
            const initials = b.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
            return {
              id: b.id,
              initials,
              bgInitials: idx % 3 === 0 ? "bg-primary-container text-on-primary-container" : idx % 3 === 1 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-variant text-on-surface-variant",
              name: b.name,
              location: b.address || "Bartari, Kalgachia",
              parcel: b.sugarcaneDetails?.reduce((sum, d) => sum + (d.hectaresAllotted || 0), 0) || 0,
              stage: b.sugarcaneDetails?.[0]?.cropStage || "N/A",
              stageClass: (b.sugarcaneDetails?.[0]?.cropStage === "Harvesting" || b.sugarcaneDetails?.[0]?.cropStage === "Harvested") ? "bg-secondary-container/20 text-secondary" : "bg-primary/10 text-primary",
              soilType: b.sugarcaneDetails?.[0]?.soilType || "N/A",
              waterSource: b.sugarcaneDetails?.[0]?.waterSource || "N/A",
              estYield: b.sugarcaneDetails?.reduce((sum, d) => sum + (d.estimatedYieldTons || 0), 0) || 0,
              estIncome: b.sugarcaneDetails?.reduce((sum, d) => sum + (d.estimatedRevenue || (d.estimatedYieldTons * 3120) || 0), 0) || 0,
              actualYield: b.sugarcaneDetails?.reduce((sum, d) => sum + (d.actualYieldTons || 0), 0) || null,
              actualRevenue: b.sugarcaneDetails?.reduce((sum, d) => sum + (d.actualRevenue || 0), 0) || null,
              fertilizers: b.sugarcaneDetails?.[0]?.fertilizersDistributed || "None",
              programName: b.sugarcaneDetails?.[0]?.sugarcaneProgram?.name || "Unassigned"
            };
          });
          setFarmers(caneFarmers);
          if (caneFarmers.length > 0) {
            setSelectedFarmer(caneFarmers[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load sugarcane data:", err);
      }
    }
    loadSugarcaneData();
  }, [token, refreshTrigger]);

  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");

  const locations = ["All", ...new Set(farmers.map((f) => f.location.split(",")[0].trim()))];
  const stages = ["All", "Planting", "Growing", "Harvesting", "Harvested"];

  const handleEnrollFarmer = async (e) => {
    e.preventDefault();

    const hectares = parseFloat(newParcel);
    const tons = hectares * 45;
    const income = tons * 3120; // Rupee standard rate multiplier

    try {
      let benId = selectedExistingBenId;
      let headers = token ? { Authorization: `Bearer ${token}` } : {};
      let schemes = ["Sugarcane"];
      let goatRearingDetail = null;

      if (enrollType === "new") {
        if (!newFarmerName || !newLocation || !newParcel) return;
        const randomNum = Math.floor(100 + Math.random() * 900);
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const enrolmentId = `BEN-${randomNum}-${randomLetter}`;

        const res = await fetch("/api/beneficiaries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify({
            enrolmentId,
            name: newFarmerName,
            address: `${newLocation}, Kalgachia, Assam`,
            householdSize: 4,
            primaryIncomeType: "Agriculture",
            tier: "Tier 2",
            tierPercent: 50,
            resilienceScore: 50,
            schemes: ["Sugarcane"]
          })
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.error || "Failed to create new beneficiary");
          return;
        }
        benId = json.data.id;
      } else {
        // existing beneficiary
        if (!selectedExistingBenId || !newParcel) return;
        const existingBen = allBens.find(b => b.id === selectedExistingBenId);
        if (!existingBen) return;

        // update scheme enrollments to add Sugarcane
        const oldSchemes = existingBen.schemeEnrollments.map(se => se.scheme.name);
        schemes = Array.from(new Set([...oldSchemes, "Sugarcane"]));

        // preserve existing goat rearing detail if present
        if (existingBen.goatRearingDetail) {
          goatRearingDetail = {
            goatsAssigned: existingBen.goatRearingDetail.goatsAssigned,
            investment: existingBen.goatRearingDetail.investment,
            returnsAmount: existingBen.goatRearingDetail.returnsAmount,
            roiPercentage: existingBen.goatRearingDetail.roiPercentage,
            advantagesLog: existingBen.goatRearingDetail.advantagesLog,
            notes: existingBen.goatRearingDetail.notes,
            goatRearingProgramId: existingBen.goatRearingDetail.goatRearingProgramId
          };
        }
      }

      // Now create sugarcane detail record for this beneficiary using PATCH
      const detailRes = await fetch(`/api/beneficiaries/${benId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({
          schemes,
          sugarcaneDetail: {
            hectaresAllotted: hectares,
            soilType: newSoil,
            waterSource: newWater,
            cropStage: newStage,
            estimatedYieldTons: tons,
            estimatedRevenue: income,
            sugarcaneProgramId: newProgramId || null
          },
          goatRearingDetail
        })
      });
      const detailJson = await detailRes.json();
      if (detailJson.success) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(detailJson.error || "Failed to save sugarcane details");
      }
    } catch (err) {
      console.error("Enrolling farmer error:", err);
    }

    // reset form
    setNewFarmerName("");
    setNewLocation("");
    setNewParcel("");
    setNewStage("Planting");
    setNewSoil("Clay Loam");
    setNewWater("Rainfed");
    setNewProgramId("");
    setSelectedExistingBenId("");
    setShowEnrollModal(false);
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newProgramName) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/livelihood/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({
          type: "sugarcane",
          name: newProgramName,
          description: newProgramDesc,
          totalLandHectares: parseFloat(newProgramLand || 0)
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewProgramName("");
        setNewProgramDesc("");
        setNewProgramLand("");
        setShowAddProgramModal(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(json.error || "Failed to create sugarcane program");
      }
    } catch (err) {
      console.error("Adding sugarcane program error:", err);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      const existingBen = allBens.find(b => b.id === editFarmerId);
      if (!existingBen) return;
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const hectares = parseFloat(editLand || 0);
      const estYield = hectares * 45;
      const estRev = estYield * 3120;
      
      const payload = {
        name: existingBen.name,
        dob: existingBen.dob,
        mobNumber: existingBen.mobNumber,
        caste: existingBen.caste,
        religion: existingBen.religion,
        address: existingBen.address,
        householdSize: existingBen.householdSize,
        primaryIncomeType: existingBen.primaryIncomeType,
        annualIncome: existingBen.annualIncome,
        monthlyIncome: existingBen.monthlyIncome,
        resilienceScore: existingBen.resilienceScore,
        tier: existingBen.tier,
        tierPercent: existingBen.tierPercent,
        aadhar: existingBen.aadhar,
        panCard: existingBen.panCard,
        rationCard: existingBen.rationCard,
        bankName: existingBen.bankName,
        bankAccountNo: existingBen.bankAccountNo,
        bankIfsc: existingBen.bankIfsc,
        familyMembers: existingBen.familyMembers?.map(m => ({
          name: m.name,
          relation: m.relation,
          dob: m.dob ? m.dob.split("T")[0] : null,
          contactInfo: m.contactInfo
        })) || [],
        livestock: existingBen.livestock?.map(l => ({
          tagNumber: l.tagNumber,
          animalType: l.animalType,
          breed: l.breed,
          ageMonths: l.ageMonths,
          healthStatus: l.healthStatus
        })) || [],
        schemes: existingBen.schemeEnrollments.map(se => se.scheme.name),
        // preserve goat rearing detail
        goatRearingDetail: existingBen.goatRearingDetail ? {
          goatsAssigned: existingBen.goatRearingDetail.goatsAssigned,
          investment: existingBen.goatRearingDetail.investment,
          returnsAmount: existingBen.goatRearingDetail.returnsAmount,
          roiPercentage: existingBen.goatRearingDetail.roiPercentage,
          advantagesLog: existingBen.goatRearingDetail.advantagesLog,
          notes: existingBen.goatRearingDetail.notes,
          goatRearingProgramId: existingBen.goatRearingDetail.goatRearingProgramId
        } : null,
        // update sugarcane detail
        sugarcaneDetail: {
          hectaresAllotted: hectares,
          soilType: editSoil,
          waterSource: editWater,
          cropStage: editStage,
          estimatedYieldTons: estYield,
          estimatedRevenue: estRev,
          actualYieldTons: editActualYield !== "" ? parseFloat(editActualYield) : null,
          actualRevenue: editActualRev !== "" ? parseFloat(editActualRev) : null,
          fertilizersDistributed: editFertilizers || null,
          sugarcaneProgramId: editProgramId || null
        }
      };

      const res = await fetch(`/api/beneficiaries/${editFarmerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowEditAssignModal(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(json.error || "Failed to update sugarcane assignment");
      }
    } catch (err) {
      console.error("Updating sugarcane assignment error:", err);
    }
  };

  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "All" || f.location.includes(selectedLocation);
    const matchesStage = selectedStage === "All" || f.stage === selectedStage;
    return matchesSearch && matchesLocation && matchesStage;
  });

  const unenrolledBens = allBens.filter(b =>
    !b.schemeEnrollments.some(se => se.scheme.name.toLowerCase().includes("sugarcane"))
  );

  const programStats = sugarcanePrograms.map(p => {
    const programFarmers = farmers.filter(f => f.programName === p.name);
    const allottedLand = programFarmers.reduce((sum, f) => sum + f.parcel, 0);
    const yieldedTons = programFarmers.reduce((sum, f) => sum + (f.actualYield || 0), 0);
    return {
      ...p,
      beneficiaryCount: programFarmers.length,
      allottedLand,
      yieldedTons
    };
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Header Section */}
      <div>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
              Livelihood Module
            </span>
            <h2 className="text-4xl md:text-5xl font-headline tracking-[-0.02em] font-semibold text-on-surface">
              Sugarcane Cultivation
            </h2>
            <p className="text-on-surface-variant mt-2 max-w-2xl text-body font-body leading-relaxed text-sm">
              Tracking farmer enrolment, seasonal growth cycles, and yield forecasts for the current harvest year.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full text-sm font-medium hover:bg-surface-variant transition-colors flex items-center gap-2 font-sans border border-outline-variant/10 cursor-pointer">
              <span className="material-symbols-outlined text-sm">download</span>
              Export Report
            </button>
            <button
              onClick={() => setShowAddProgramModal(true)}
              className="bg-secondary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-secondary-container transition-all flex items-center gap-2 shadow-lg shadow-secondary/30 active:scale-95 font-sans cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-sm">add_box</span>
              Add Program
            </button>

          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        {/* KPI Cards */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Active Farmers
            </span>
            <div className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
            </div>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {farmers.length}
          </div>
          <p className="text-sm text-on-surface-variant">Enrolled this season</p>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Total Land Parcel
            </span>
            <span className="material-symbols-outlined text-tertiary">landscape</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {farmers.reduce((acc, f) => acc + f.parcel, 0).toFixed(1)} <span className="text-xl text-on-surface-variant">Hectares</span>
          </div>
          <p className="text-sm text-on-surface-variant">Across Kalgachia circle</p>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 relative overflow-hidden border border-outline-variant/10">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Est. Yield Forecast
            </span>
            <span className="material-symbols-outlined text-secondary">monitoring</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1 relative z-10">
            {farmers.reduce((acc, f) => acc + f.estYield, 0).toFixed(0)} <span className="text-xl text-on-surface-variant">Tons</span>
          </div>
          <p className="text-sm text-on-surface-variant relative z-10">Expected Q4 Harvest</p>
        </div>

        {/* Main Content Left (Map/Parcels) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden flex flex-col h-full border border-outline-variant/10">
          <div className="p-6 pb-4 pt-8 pl-8 border-b border-surface-container-highest flex justify-between items-center">
            <h3 className="text-lg font-bold text-on-surface">Land Parcel Distribution</h3>
            <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1 font-sans bg-transparent border-none cursor-pointer">
              View Full Map <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="relative flex-1 min-h-[300px] bg-surface-container text-on-surface">
            <img
              alt="Map view of sugarcane plots near Kalgachia, Assam"
              className="w-full h-full object-cover opacity-80"
              src="/sugarcane_map_kalgachia.png"
            />
            {/* Floating Map Legend */}
            <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-lg shadow-ambient w-48 bg-white/80 dark:bg-slate-900/80">
              <h4 className="text-xs uppercase tracking-[0.05em] font-bold text-on-surface mb-3 font-sans">
                Crop Status
              </h4>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-on-surface-variant">Maturing (60%)</span>
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
                <div className="w-3 h-3 rounded-full bg-inverse-primary"></div>
                <span className="text-on-surface-variant">Early Growth (25%)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-on-surface-variant">Harvesting (15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Seasonal Timeline) */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 flex flex-col border border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface mb-6">Seasonal Activity Log</h3>
          <div className="relative border-l-2 border-surface-container-highest ml-3 space-y-8 pb-4 flex-1">
            {/* Timeline Item 1 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest shadow-sm"></div>
              <div className="text-[0.75rem] uppercase tracking-[0.05em] text-primary font-bold mb-1 font-sans">
                Current Phase
              </div>
              <h4 className="text-md font-bold text-on-surface">Growth Monitoring</h4>
              <p className="text-sm text-on-surface-variant mt-1 mb-2">
                Weeks 12-24. Assessing water stress and fertilizer application.
              </p>
              <div className="flex items-center gap-2 font-semibold">
                <span className="bg-surface-container px-2 py-1 rounded text-xs text-on-surface-variant font-medium">
                  85% Complete
                </span>
                <div className="h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full relative"
                    style={{ width: "85%" }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[1px]"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Timeline Item 2 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-highest border-4 border-surface-container-lowest"></div>
              <div className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1 font-sans">
                Upcoming
              </div>
              <h4 className="text-md font-bold text-on-surface">Pre-Harvest Inspection</h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Scheduled for Month 8. Quality assessment and logistics planning.
              </p>
            </div>
            {/* Timeline Item 3 */}
            <div className="relative pl-6 opacity-60">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-tertiary-container border-4 border-surface-container-lowest"></div>
              <div className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1 font-sans">
                Completed
              </div>
              <h4 className="text-md font-bold text-on-surface">Planting Phase</h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Seedling distribution and initial land preparation finished.
              </p>
            </div>
          </div>
        </div>

        {/* Sugarcane Programs Overview */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 shadow-ambient border border-outline-variant/10">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-on-surface">Sugarcane Programs Overview</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              High-level distribution schemes mapping allotted land parcels, yield targets, and beneficiary participation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {programStats.map((prog) => (
              <Link href={`/livelihood/sugarcane/${prog.id}`} key={prog.id} className="p-5 border border-surface-container-high rounded-xl bg-surface-container-low/20 space-y-4 hover:bg-surface-container-low transition-colors block text-left no-underline">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[9px] bg-secondary-container/20 text-secondary uppercase tracking-wider font-bold">
                    Active Program
                  </span>
                  <h4 className="font-bold text-base text-on-surface mt-2">{prog.name}</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{prog.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-surface-container-high pt-4 text-xs font-semibold">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Total Land</p>
                    <p className="text-on-surface font-bold mt-0.5">{prog.totalLandHectares} Ha</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Allotted</p>
                    <p className="text-on-surface font-bold mt-0.5">{prog.allottedLand.toFixed(1)} Ha</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Participants</p>
                    <p className="text-primary font-bold mt-0.5">{prog.beneficiaryCount} Farmers</p>
                  </div>
                </div>
              </Link>
            ))}
            {programStats.length === 0 && (
              <p className="col-span-3 text-center text-xs text-slate-400 py-4 italic">No sugarcane programs logged in the system.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Program Modal */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Sugarcane Program</h3>
              <button
                onClick={() => setShowAddProgramModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddProgram} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Program Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beki Basin Cane Expansion"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  placeholder="Describe program objectives..."
                  value={newProgramDesc}
                  onChange={(e) => setNewProgramDesc(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
                  rows="3"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Allotted Land (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 50.0"
                  value={newProgramLand}
                  onChange={(e) => setNewProgramLand(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-secondary text-white font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
