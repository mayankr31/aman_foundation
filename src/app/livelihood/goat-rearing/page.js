"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function GoatRearing() {
  const { token } = useAuth();
  const [timeframe, setTimeframe] = useState("1 Year");
  const [livestockList, setLivestockList] = useState([]);
  const [beneficiaryCount, setBeneficiaryCount] = useState(1248);
  const [totalGoats, setTotalGoats] = useState(3740);
  const [goatBeneficiaries, setGoatBeneficiaries] = useState([]);
  const [goatRearingPrograms, setGoatRearingPrograms] = useState([]);
  const [allBens, setAllBens] = useState([]);
  const [avgRoi, setAvgRoi] = useState(145);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states for enrollment
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState("new"); // "new" or "existing"
  const [selectedExistingBenId, setSelectedExistingBenId] = useState("");
  const [newFarmerName, setNewFarmerName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [goatsAssigned, setGoatsAssigned] = useState("2");
  const [investment, setInvestment] = useState("");
  const [returnsAmount, setReturnsAmount] = useState("");
  const [roiPercentage, setRoiPercentage] = useState("");
  const [advantagesLog, setAdvantagesLog] = useState("");
  const [goatProgramId, setGoatProgramId] = useState("");

  // Form states for adding programs
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramDesc, setNewProgramDesc] = useState("");

  // Form states for editing assignments
  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editBenId, setEditBenId] = useState("");
  const [editBenName, setEditBenName] = useState("");
  const [editGoats, setEditGoats] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editInvestment, setEditInvestment] = useState("");
  const [editReturns, setEditReturns] = useState("");
  const [editRoi, setEditRoi] = useState("");
  const [editAdvantages, setEditAdvantages] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    async function loadGoatStats() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [liveRes, benRes, progRes] = await Promise.all([
          fetch("/api/livestock", { headers }),
          fetch("/api/beneficiaries", { headers }),
          fetch("/api/livelihood/programs", { headers })
        ]);
        const liveJson = await liveRes.json();
        const benJson = await benRes.json();
        const progJson = await progRes.json();

        if (progJson.success) {
          setGoatRearingPrograms(progJson.data.goatRearingPrograms || []);
        }

        if (liveJson.success) {
          setLivestockList(liveJson.data);
          const goats = liveJson.data.filter(l => 
            l.animalType.toLowerCase().includes("goat") || 
            l.animalType.toLowerCase().includes("gr") || 
            l.animalType.toLowerCase() === "livestock"
          );
          if (goats.length > 0) setTotalGoats(goats.length);
        }

        if (benJson.success) {
          setAllBens(benJson.data);
          const goatBens = benJson.data.filter(b =>
            b.schemeEnrollments.some(se => se.scheme.name.toLowerCase().includes("goat"))
          );
          setGoatBeneficiaries(goatBens);
          if (goatBens.length > 0) setBeneficiaryCount(goatBens.length);

          const allDetails = goatBens.flatMap(b => b.goatRearingDetails || []);
          const detailsWithRoi = allDetails.filter(d => d.roiPercentage !== null && d.roiPercentage !== undefined);
          if (detailsWithRoi.length > 0) {
            const totalRoi = detailsWithRoi.reduce((acc, d) => acc + d.roiPercentage, 0);
            setAvgRoi(Math.round(totalRoi / detailsWithRoi.length));
          }
        }
      } catch (err) {
        console.error("Failed to load goat stats:", err);
      }
    }
    loadGoatStats();
  }, [token, refreshTrigger]);

  const handleEnrollBeneficiary = async (e) => {
    e.preventDefault();

    try {
      let benId = selectedExistingBenId;
      let headers = token ? { Authorization: `Bearer ${token}` } : {};
      let schemes = ["Goat Rearing"];
      let sugarcaneDetail = null;

      if (enrollType === "new") {
        if (!newFarmerName || !newLocation || !goatsAssigned) return;
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
            primaryIncomeType: "Livestock",
            tier: "Tier 2",
            tierPercent: 50,
            resilienceScore: 50,
            schemes: ["Goat Rearing"]
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
        if (!selectedExistingBenId || !goatsAssigned) return;
        const existingBen = allBens.find(b => b.id === selectedExistingBenId);
        if (!existingBen) return;

        // update scheme enrollments to add Goat Rearing
        const oldSchemes = existingBen.schemeEnrollments.map(se => se.scheme.name);
        schemes = Array.from(new Set([...oldSchemes, "Goat Rearing"]));

        // preserve sugarcane detail if enrolled
        if (existingBen.sugarcaneDetail) {
          sugarcaneDetail = {
            hectaresAllotted: existingBen.sugarcaneDetail.hectaresAllotted,
            soilType: existingBen.sugarcaneDetail.soilType,
            waterSource: existingBen.sugarcaneDetail.waterSource,
            cropStage: existingBen.sugarcaneDetail.cropStage,
            estimatedYieldTons: existingBen.sugarcaneDetail.estimatedYieldTons,
            actualYieldTons: existingBen.sugarcaneDetail.actualYieldTons,
            fertilizersDistributed: existingBen.sugarcaneDetail.fertilizersDistributed,
            estimatedRevenue: existingBen.sugarcaneDetail.estimatedRevenue,
            actualRevenue: existingBen.sugarcaneDetail.actualRevenue,
            sugarcaneProgramId: existingBen.sugarcaneDetail.sugarcaneProgramId
          };
        }
      }

      // Now update everything in one single PATCH call
      const detailRes = await fetch(`/api/beneficiaries/${benId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({
          schemes,
          goatRearingDetail: {
            goatsAssigned: parseInt(goatsAssigned || 0),
            investment: investment ? parseFloat(investment) : null,
            returnsAmount: returnsAmount ? parseFloat(returnsAmount) : null,
            roiPercentage: roiPercentage ? parseFloat(roiPercentage) : null,
            advantagesLog: advantagesLog || null,
            goatRearingProgramId: goatProgramId || null
          },
          sugarcaneDetail
        })
      });
      const detailJson = await detailRes.json();
      if (detailJson.success) {
        // Create an individual livestock animal asset record for them
        const randomTag = `GR-${Math.floor(1000 + Math.random() * 9000)}`;
        await fetch("/api/livestock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify({
            beneficiaryId: benId,
            tagNumber: `Tag #${randomTag}`,
            animalType: "Goat",
            breed: "Black Bengal",
            ageMonths: 12,
            healthStatus: "Healthy"
          })
        });

        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(detailJson.error || "Failed to save goat rearing details");
      }
    } catch (err) {
      console.error("Enrolling beneficiary error:", err);
    }

    // reset form
    setNewFarmerName("");
    setNewLocation("");
    setGoatsAssigned("2");
    setInvestment("");
    setReturnsAmount("");
    setRoiPercentage("");
    setAdvantagesLog("");
    setGoatProgramId("");
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
          type: "goat",
          name: newProgramName,
          description: newProgramDesc
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewProgramName("");
        setNewProgramDesc("");
        setShowAddProgramModal(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(json.error || "Failed to create goat program");
      }
    } catch (err) {
      console.error("Adding goat program error:", err);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      const existingBen = allBens.find(b => b.id === editBenId);
      if (!existingBen) return;
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
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
        // preserve sugarcane detail if enrolled
        sugarcaneDetail: existingBen.sugarcaneDetail ? {
          hectaresAllotted: existingBen.sugarcaneDetail.hectaresAllotted,
          soilType: existingBen.sugarcaneDetail.soilType,
          waterSource: existingBen.sugarcaneDetail.waterSource,
          cropStage: existingBen.sugarcaneDetail.cropStage,
          estimatedYieldTons: existingBen.sugarcaneDetail.estimatedYieldTons,
          actualYieldTons: existingBen.sugarcaneDetail.actualYieldTons,
          fertilizersDistributed: existingBen.sugarcaneDetail.fertilizersDistributed,
          estimatedRevenue: existingBen.sugarcaneDetail.estimatedRevenue,
          actualRevenue: existingBen.sugarcaneDetail.actualRevenue,
          sugarcaneProgramId: existingBen.sugarcaneDetail.sugarcaneProgramId
        } : null,
        // update goat rearing detail
        goatRearingDetail: {
          goatsAssigned: parseInt(editGoats || 0),
          investment: editInvestment !== "" ? parseFloat(editInvestment) : null,
          returnsAmount: editReturns !== "" ? parseFloat(editReturns) : null,
          roiPercentage: editRoi !== "" ? parseFloat(editRoi) : null,
          advantagesLog: editAdvantages || null,
          notes: editNotes || null,
          goatRearingProgramId: editProgramId || null
        }
      };

      const res = await fetch(`/api/beneficiaries/${editBenId}`, {
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
        alert(json.error || "Failed to update goat rearing assignment");
      }
    } catch (err) {
      console.error("Updating goat rearing assignment error:", err);
    }
  };

  const unenrolledBens = allBens.filter(b =>
    !b.schemeEnrollments.some(se => se.scheme.name.toLowerCase().includes("goat"))
  );

  // Trajectory data
  const trajectoryHeights = {
    "6 Months": [40, 50, 60, 45, 55],
    "1 Year": [30, 45, 60, 75, 90],
  };

  const heights = trajectoryHeights[timeframe];

  return (
    <div className="p-8 flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full pb-24">
      {/* Page Header */}
      <Link
        href="/livelihood"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to Livelihood Hub
        </span>
      </Link>
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[2.75rem] font-headline tracking-[-0.02em] leading-tight text-on-surface mb-2 font-bold">
            Goat Rearing Distribution &amp; Health
          </h2>
          <p className="text-on-surface-variant font-body text-sm max-w-2xl">
            Monitoring livelihood impact through livestock distribution metrics, health tracking, and return on investment for rural beneficiaries.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 font-sans">
          <button className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full text-xs font-semibold hover:bg-surface-variant transition-colors flex items-center gap-2 border border-outline-variant/10 cursor-pointer">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Data
          </button>
          <button
            onClick={() => setShowAddProgramModal(true)}
            className="bg-secondary text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-secondary-container transition-all flex items-center gap-2 shadow-lg shadow-secondary/30 active:scale-95 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-sm">add_box</span>
            Add Program
          </button>

        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metrics Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Metric Card 1 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 shadow-ambient relative overflow-hidden group border border-outline-variant/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">
              Total Beneficiaries
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold text-primary">{beneficiaryCount.toLocaleString()}</span>
              <span className="text-sm font-medium text-primary-fixed-dim bg-primary-fixed/20 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">trending_up</span> +12%
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 pt-4 border-t border-surface-container">
              Across active villages
            </p>
          </div>

          {/* Metric Card 2 */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 shadow-ambient border border-outline-variant/10">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">
              Active Livestock
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold text-on-surface">{totalGoats.toLocaleString()}</span>
            </div>
            <div className="mt-4 flex flex-col gap-2 font-sans">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">Adults</span>
                <span className="text-on-surface">{Math.round(totalGoats * 0.56)}</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "60%" }}></div>
              </div>
              <div className="flex justify-between text-xs mt-2 font-semibold">
                <span className="text-on-surface-variant">Kids</span>
                <span className="text-on-surface">{Math.round(totalGoats * 0.44)}</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary-container h-1.5 rounded-full" style={{ width: "40%" }}></div>
              </div>
            </div>
          </div>

          {/* Metric Card 3 */}
          <div className="bg-primary rounded-lg p-6 pt-8 pl-8 shadow-ambient text-on-primary border-none">
            <span className="font-label text-xs uppercase tracking-[0.05em] text-on-primary/80 mb-4 block font-bold">
              Avg. Household ROI
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-headline font-bold">{avgRoi}%</span>
            </div>
            <p className="text-xs text-on-primary/70 mt-4 font-body leading-relaxed">
              Estimated return over 24 months based on initial capital investment and organic herd growth.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Chart Section */}
          <div className="bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 shadow-ambient flex-1 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline text-lg font-bold text-on-surface">Outcome Trajectory</h3>
              <div className="flex gap-2">
                <span
                  onClick={() => setTimeframe("6 Months")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    timeframe === "6 Months"
                      ? "bg-surface-container-high text-on-surface"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  6 Months
                </span>
                <span
                  onClick={() => setTimeframe("1 Year")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    timeframe === "1 Year"
                      ? "bg-surface-container-high text-on-surface"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  1 Year
                </span>
              </div>
            </div>

            {/* Simulated Chart Bars */}
            <div className="w-full h-64 relative flex items-end justify-between px-4">
              <div
                className="w-12 bg-primary-container/20 rounded-t-sm relative group transition-all duration-500"
                style={{ height: `${heights[0]}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-inverse-surface text-inverse-on-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Q1
                </div>
              </div>
              <div
                className="w-12 bg-primary-container/40 rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[1]}%` }}
              ></div>
              <div
                className="w-12 bg-primary-container/60 rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[2]}%` }}
              ></div>
              <div
                className="w-12 bg-primary-container/80 rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[3]}%` }}
              ></div>
              <div
                className="w-12 bg-primary rounded-t-sm transition-all duration-500"
                style={{ height: `${heights[4]}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Goat Rearing Programs Overview */}
        <div className="lg:col-span-12 bg-surface-container-lowest rounded-lg p-6 pt-8 pl-8 shadow-ambient border border-outline-variant/10">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-on-surface">Goat Rearing Programs Overview</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Active schemes focused on distributing livestock assets and enhancing family livelihoods.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {goatRearingPrograms.map((prog) => {
              const participants = goatBeneficiaries.filter(b => b.goatRearingDetails?.some(d => d.goatRearingProgramId === prog.id));
              const goats = participants.reduce((sum, b) => {
                const progDetails = b.goatRearingDetails?.filter(d => d.goatRearingProgramId === prog.id) || [];
                return sum + progDetails.reduce((s, d) => s + (d.goatsAssigned || 0), 0);
              }, 0);
              return (
                <Link href={`/livelihood/goat-rearing/${prog.id}`} key={prog.id} className="p-5 border border-surface-container-high rounded-xl bg-surface-container-low/20 space-y-4 hover:bg-surface-container-low transition-colors block no-underline text-left">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[9px] bg-secondary-container/20 text-secondary uppercase tracking-wider font-bold">
                      Active Program
                    </span>
                    <h4 className="font-bold text-base text-on-surface mt-2">{prog.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{prog.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-surface-container-high pt-4 text-xs font-semibold">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Goats Distributed</p>
                      <p className="text-on-surface font-bold mt-0.5">{goats} Animals</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Participants</p>
                      <p className="text-primary font-bold mt-0.5">{participants.length} Families</p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {goatRearingPrograms.length === 0 && (
              <p className="col-span-3 text-center text-xs text-slate-400 py-4 italic">No goat rearing programs logged in the system.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Program Modal */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Goat Rearing Program</h3>
              <button
                onClick={() => setShowAddProgramModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined font-bold">close</span>
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
                  placeholder="e.g. Silage and silvopasture development scheme"
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
                  placeholder="Describe program details..."
                  value={newProgramDesc}
                  onChange={(e) => setNewProgramDesc(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
                  rows="3"
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
