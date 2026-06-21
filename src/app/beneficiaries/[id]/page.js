"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function BeneficiaryProfileDetail() {
  const { id } = useParams();

  const { token, isInitializing } = useAuth();
  const [activeTab, setActiveTab] = useState("Program History");
  const [beneficiary, setBeneficiary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState("Personal");

  // Form states matching database schema
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [mobNumber, setMobNumber] = useState("");
  const [caste, setCaste] = useState("");
  const [religion, setReligion] = useState("");
  const [address, setAddress] = useState("");
  const [householdSize, setHouseholdSize] = useState(4);
  const [primaryIncomeType, setPrimaryIncomeType] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [resilienceScore, setResilienceScore] = useState(50);
  const [tier, setTier] = useState("Tier 2");
  const [tierPercent, setTierPercent] = useState(50);
  
  // ID proofs
  const [aadhar, setAadhar] = useState("");
  const [panCard, setPanCard] = useState("");
  const [rationCard, setRationCard] = useState("");

  // Bank details
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  // Nested arrays
  const [familyMembers, setFamilyMembers] = useState([]);
  const [livestock, setLivestock] = useState([]);

  // Scheme enrollments & Livelihood sub-programs
  const [enrolledSchemes, setEnrolledSchemes] = useState([]);
  // Removed singular scheme states as assignments are now handled in Program Details

  const loadBeneficiaryDetail = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log("[Detail Page] Fetching for id:", id, "with token length:", token ? token.length : 0);
      const res = await fetch(`/api/beneficiaries/${id}`, { headers });
      
      const json = await res.json();
      console.log("[Detail Page] Beneficiary API response:", res.status, json);

      if (json.success) {
        const b = json.data;
        setBeneficiary(b);

        // Populate forms
        setName(b.name || "");
        setDob(b.dob ? b.dob.split("T")[0] : "");
        setMobNumber(b.mobNumber || "");
        setCaste(b.caste || "");
        setReligion(b.religion || "");
        setAddress(b.address || "");
        setHouseholdSize(b.householdSize || 4);
        setPrimaryIncomeType(b.primaryIncomeType || "");
        setAnnualIncome(b.annualIncome !== null ? b.annualIncome : "");
        setMonthlyIncome(b.monthlyIncome !== null ? b.monthlyIncome : "");
        setResilienceScore(b.resilienceScore || 50);
        setTier(b.tier || "Tier 2");
        setTierPercent(b.tierPercent || 50);

        setAadhar(b.aadhar || "");
        setPanCard(b.panCard || "");
        setRationCard(b.rationCard || "");

        setBankName(b.bankName || "");
        setBankAccountNo(b.bankAccountNo || "");
        setBankIfsc(b.bankIfsc || "");

        setEnrolledSchemes((b.schemeEnrollments || []).map(se => se.scheme.name));

        setFamilyMembers((b.familyMembers || []).map(f => ({
          name: f.name || "",
          relation: f.relation || "",
          dob: f.dob ? f.dob.split("T")[0] : "",
          contactInfo: f.contactInfo || ""
        })));

        setLivestock((b.livestock || []).map(l => ({
          tagNumber: l.tagNumber || "",
          animalType: l.animalType || "Goat",
          breed: l.breed || "",
          ageMonths: l.ageMonths !== null ? l.ageMonths : "",
          healthStatus: l.healthStatus || "Healthy"
        })));

        // Singular scheme details removed
      }
    } catch (err) {
      console.error("Failed to load beneficiary detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitializing && id && id !== "undefined" && id !== "null") {
      loadBeneficiaryDetail();
    }
  }, [id, token, isInitializing]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        dob: dob || null,
        mobNumber,
        caste,
        religion,
        address,
        householdSize: parseInt(householdSize),
        primaryIncomeType,
        annualIncome: annualIncome !== "" ? parseFloat(annualIncome) : null,
        monthlyIncome: monthlyIncome !== "" ? parseFloat(monthlyIncome) : null,
        resilienceScore: parseInt(resilienceScore),
        tier,
        tierPercent: parseInt(tierPercent),
        aadhar,
        panCard,
        rationCard,
        bankName,
        bankAccountNo,
        bankIfsc,
        familyMembers: familyMembers.filter(m => m.name.trim() !== ""),
        livestock: livestock.filter(l => l.tagNumber.trim() !== ""),
        schemes: enrolledSchemes,
        // Detailed assignments removed from beneficiary PATCH
      };

      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update profile error:", err);
    }
  };

  const addFamilyMemberRow = () => {
    setFamilyMembers([...familyMembers, { name: "", relation: "Spouse", dob: "", contactInfo: "" }]);
  };

  const removeFamilyMemberRow = (idx) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== idx));
  };

  const updateFamilyMemberRow = (idx, field, val) => {
    const updated = [...familyMembers];
    updated[idx][field] = val;
    setFamilyMembers(updated);
  };

  const addLivestockRow = () => {
    setLivestock([...livestock, { tagNumber: "", animalType: "Goat", breed: "", ageMonths: "", healthStatus: "Healthy" }]);
  };

  const removeLivestockRow = (idx) => {
    setLivestock(livestock.filter((_, i) => i !== idx));
  };

  const updateLivestockRow = (idx, field, val) => {
    const updated = [...livestock];
    updated[idx][field] = val;
    setLivestock(updated);
  };

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!beneficiary) {
    return <div className="p-8 text-center text-on-surface-variant font-medium">Beneficiary not found</div>;
  }

  const score = beneficiary.resilienceScore || 50;
  const strokeDashoffset = 251.2 - (score / 100) * 251.2;

  const isGoatEnrolled = beneficiary.schemeEnrollments?.some(se => se.scheme.name === "Goat Rearing");
  const isCaneEnrolled = beneficiary.schemeEnrollments?.some(se => se.scheme.name === "Sugarcane");

  const cumulativeReturnsAmount = beneficiary.goatRearingDetails?.reduce((sum, d) => sum + (d.returnsAmount || 0), 0) || 0;
  const cumulativeReturns = cumulativeReturnsAmount > 0 ? `₹${cumulativeReturnsAmount.toLocaleString()}` : "N/A";

  const landAllottedAmount = beneficiary.sugarcaneDetails?.reduce((sum, d) => sum + (d.hectaresAllotted || 0), 0) || 0;
  const landAllottedText = landAllottedAmount > 0 ? `${landAllottedAmount} Hectares` : "N/A";

  const calculateAge = (dateString) => {
    if (!dateString) return "N/A";
    const birthday = new Date(dateString);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " Years";
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
      {/* Back link */}
      <Link
        href="/beneficiaries"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Beneficiaries Directory
        </span>
      </Link>

      {/* Header */}
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-label-md text-on-surface-variant mb-2 font-sans font-bold uppercase tracking-widest text-[10px]">
            Livelihood Management
          </p>
          <h1 className="text-3xl md:text-[2.75rem] font-bold text-on-surface tracking-tight leading-tight font-headline">
            Beneficiary Profile File
          </h1>
        </div>
        <div className="flex gap-3 font-sans">
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-body-md font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
          <button className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-body-md font-medium shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer border-none">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Profile Section */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-700"></div>
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md relative bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl">
              {beneficiary.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-grow pt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-on-surface tracking-tight capitalize font-headline">{beneficiary.name}</h2>
                <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap w-fit">
                  Active Participant
                </span>
              </div>
              <p className="text-on-surface-variant text-sm mb-6 max-w-md font-sans">
                Assam rural development and livelihood beneficiary near Kalgachia circle. Enrolled in multiple micro-development programs.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 font-sans text-sm">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Location</p>
                  <p className="text-on-surface font-bold">{beneficiary.address || "Kalgachia, Assam"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Mobile Number</p>
                  <p className="text-on-surface font-bold">{beneficiary.mobNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">DOB / Age</p>
                  <p className="text-on-surface font-bold">
                    {beneficiary.dob ? new Date(beneficiary.dob).toLocaleDateString() : "N/A"} ({calculateAge(beneficiary.dob)})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Caste / Religion</p>
                  <p className="text-on-surface font-bold">{beneficiary.caste || "General"} / {beneficiary.religion || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Enrollment ID</p>
                  <p className="text-on-surface font-mono font-bold text-xs">{beneficiary.enrolmentId}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Household Size</p>
                  <p className="text-on-surface font-bold">{beneficiary.householdSize} Members</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Socio-Economic Tier</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden max-w-[100px]">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${beneficiary.tierPercent}%` }}></div>
                    </div>
                    <span className="font-bold text-on-surface text-xs">{beneficiary.tier}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Annual Income</p>
                  <p className="text-on-surface font-bold">{beneficiary.annualIncome ? `₹${beneficiary.annualIncome.toLocaleString()}` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Monthly Income</p>
                  <p className="text-on-surface font-bold">{beneficiary.monthlyIncome ? `₹${beneficiary.monthlyIncome.toLocaleString()}` : "N/A"}</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Resilience Score Dial */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-ambient flex flex-col items-center justify-center relative overflow-hidden border border-outline-variant/10">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-container-low opacity-50"></div>
          <h3 className="text-xs uppercase tracking-widest text-on-surface-variant text-center w-full relative z-10 mb-6 font-sans font-bold">
            Resilience Index Score
          </h3>
          <div className="relative w-48 h-48 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="var(--color-surface-container-highest)"
                strokeDasharray="251.2"
                strokeDashoffset="0"
                strokeWidth="8"
              ></circle>
              <circle
                className="drop-shadow-[0_2px_4px_rgba(0,104,87,0.3)]"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="var(--color-primary)"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-on-surface tracking-tighter">{score}</span>
              <span className="text-xs text-on-surface-variant font-medium uppercase tracking-widest mt-1">
                / 100
              </span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-primary bg-primary-container/10 px-3 py-1.5 rounded-full relative z-10 font-sans">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-xs font-bold uppercase tracking-wider">Updated Realtime</span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="lg:col-span-12 mt-4 mb-2 border-b border-surface-container-highest flex overflow-x-auto no-scrollbar font-sans">
          {["Program History", "Family Directory", "ID Proofs & Bank Details", "Impact Summary"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm whitespace-nowrap transition-colors cursor-pointer border-none bg-transparent ${
                  isActive
                    ? "font-semibold text-primary border-b-2 border-primary"
                    : "font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Contents */}
        <div className="lg:col-span-8">
          {activeTab === "Program History" && (
            <div className="space-y-6">
              <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-4 text-xs font-sans text-on-surface-variant flex gap-3 items-start leading-relaxed">
                <span className="material-symbols-outlined text-primary shrink-0">info</span>
                <div>
                  <p className="font-bold text-primary mb-1">How Program History is Added</p>
                  <p>Scheme enrollment history is generated dynamically from the beneficiary's database linkage. You can add or remove schemes and select sub-programs by clicking <strong>Edit Profile</strong> above and opening the <strong>Scheme Specific</strong> tab.</p>
                </div>
              </div>

              {/* Enrolled Schemes Logs */}
              <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 font-sans">
                <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Active Scheme Enrollments
                </h3>
                <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                  
                  {isGoatEnrolled && (
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-container-lowest z-10 shadow-glow"></div>
                      <div className="bg-surface p-5 rounded-lg border border-surface-container-high">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-on-surface text-base">Goat Rearing Development</h4>
                            <p className="text-xs text-on-surface-variant mt-1">
                              Enrolled on: {new Date(beneficiary.schemeEnrollments.find(se => se.scheme.name === "Goat Rearing")?.enrolledAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
                        
                        {beneficiary.goatRearingDetails && beneficiary.goatRearingDetails.length > 0 ? (
                          <div className="space-y-4 mt-4">
                            {beneficiary.goatRearingDetails.map((detail, idx) => (
                              <div key={detail.id || idx} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 text-xs p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Program Linkage</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.goatRearingProgram?.name || "Unassigned"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Goats Assigned</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.goatsAssigned} Animals</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Investment Value</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">₹{detail.investment?.toLocaleString() || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Cumulative Returns</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">₹{detail.returnsAmount?.toLocaleString() || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">ROI</p>
                                  <p className="text-primary font-bold text-sm mt-1">{detail.roiPercentage !== null ? `${detail.roiPercentage}%` : "N/A"}</p>
                                </div>
                                <div className="col-span-2 sm:col-span-4 lg:col-span-5 mt-2 border-t border-surface-container-high pt-2">
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Advantages Logged</p>
                                  <p className="text-on-surface-variant font-medium mt-1 leading-relaxed">{detail.advantagesLog || "No advantages logged yet."}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant mt-2 italic">Waiting for program details to be populated.</p>
                        )}
                      </div>
                    </div>
                  )}
 
                  {isCaneEnrolled && (
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-secondary border-2 border-surface ring-4 ring-surface-container-lowest z-10"></div>
                      <div className="bg-surface p-5 rounded-lg border border-surface-container-high">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-on-surface text-base">Sugarcane Cultivation</h4>
                            <p className="text-xs text-on-surface-variant mt-1">
                              Enrolled on: {new Date(beneficiary.schemeEnrollments.find(se => se.scheme.name === "Sugarcane")?.enrolledAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-secondary bg-secondary-container/10 px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
 
                        {beneficiary.sugarcaneDetails && beneficiary.sugarcaneDetails.length > 0 ? (
                          <div className="space-y-4 mt-4">
                            {beneficiary.sugarcaneDetails.map((detail, idx) => (
                              <div key={detail.id || idx} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Program Linkage</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.sugarcaneProgram?.name || "Unassigned"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Allotted land</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.hectaresAllotted} Hectares</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Soil / Irrigation</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.soilType || "N/A"} / {detail.waterSource || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Crop Stage</p>
                                  <p className="text-secondary font-bold text-sm mt-1 uppercase tracking-wider">{detail.cropStage}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Est. vs Actual Yield</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.estimatedYieldTons} vs {detail.actualYieldTons !== null ? `${detail.actualYieldTons} Tons` : "Growing"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Est. vs Actual Revenue</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">₹{detail.estimatedRevenue?.toLocaleString() || "N/A"} vs {detail.actualRevenue ? `₹${detail.actualRevenue.toLocaleString()}` : "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Fertilizer Distribution</p>
                                  <p className="text-on-surface font-bold text-sm mt-1">{detail.fertilizersDistributed || "None distributed"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant mt-2 italic">Waiting for program details to be populated.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(!isGoatEnrolled && !isCaneEnrolled) && (
                    <p className="text-sm text-on-surface-variant italic">No scheme enrollments found.</p>
                  )}
                  
                </div>
              </div>

              {/* Livestock Assets Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 font-sans">
                <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pets</span>
                  Livestock Assets inventory
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {beneficiary.livestock && beneficiary.livestock.length > 0 ? (
                    beneficiary.livestock.map((l) => (
                      <div key={l.id} className="p-4 border border-surface-container-high rounded-xl bg-surface-container-low/30 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[9px] bg-primary-fixed text-on-primary-fixed uppercase tracking-wider font-bold">
                              {l.animalType}
                            </span>
                            <h4 className="font-bold text-on-surface text-base mt-2">{l.tagNumber}</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">{l.breed || "Local Breed"} • {l.ageMonths ? `${l.ageMonths} Months` : "N/A"}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            l.healthStatus === "Healthy" ? "bg-primary/10 text-primary" : "bg-error-container text-on-error-container"
                          }`}>
                            {l.healthStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-sm text-on-surface-variant italic">No livestock assets allocated to this beneficiary.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Family Directory" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-primary">group</span>
                Family Members &amp; Household Registry
              </h3>
              
              <div className="space-y-4">
                {beneficiary.familyMembers && beneficiary.familyMembers.length > 0 ? (
                  beneficiary.familyMembers.map((m) => (
                    <div key={m.id} className="p-4 border border-surface-container-highest rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 font-sans bg-surface-container-low/20">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface capitalize">{m.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Relationship: <span className="font-semibold text-on-surface-variant">{m.relation}</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 text-xs sm:text-right font-medium">
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Age / DOB</p>
                          <p className="text-on-surface font-semibold mt-0.5">
                            {m.dob ? `${calculateAge(m.dob)} (${new Date(m.dob).toLocaleDateString()})` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Contact Mobile</p>
                          <p className="text-on-surface font-semibold mt-0.5 font-mono">{m.contactInfo || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic">No family member records logged.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "ID Proofs & Bank Details" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-primary">description</span>
                  Identity Cards &amp; Document Registry
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 font-sans">National ID cards and public relief system credentials.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-surface-container-highest rounded-lg font-sans bg-surface-container-low/10">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aadhar Identity</p>
                  <p className="font-bold text-sm text-on-surface mt-1 font-mono tracking-wide">
                    {beneficiary.aadhar ? beneficiary.aadhar : "Not Provided"}
                  </p>
                  <span className={`inline-block mt-3 px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                    beneficiary.aadhar ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                  }`}>
                    {beneficiary.aadhar ? "Verified" : "Missing"}
                  </span>
                </div>

                <div className="p-4 border border-surface-container-highest rounded-lg font-sans bg-surface-container-low/10">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PAN Card Identity</p>
                  <p className="font-bold text-sm text-on-surface mt-1 font-mono tracking-wide uppercase">
                    {beneficiary.panCard ? beneficiary.panCard : "Not Provided"}
                  </p>
                  <span className={`inline-block mt-3 px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                    beneficiary.panCard ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                  }`}>
                    {beneficiary.panCard ? "Verified" : "Missing"}
                  </span>
                </div>

                <div className="p-4 border border-surface-container-highest rounded-lg font-sans bg-surface-container-low/10">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ration Card (SFY)</p>
                  <p className="font-bold text-sm text-on-surface mt-1 font-mono tracking-wide uppercase">
                    {beneficiary.rationCard ? beneficiary.rationCard : "Not Provided"}
                  </p>
                  <span className={`inline-block mt-3 px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                    beneficiary.rationCard ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                  }`}>
                    {beneficiary.rationCard ? "Verified" : "Missing"}
                  </span>
                </div>
              </div>

              <div className="border-t border-surface-container-high pt-6">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline mb-4">
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                  Bank Account Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
                  <div className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bank Name</p>
                    <p className="font-bold text-sm text-on-surface mt-1">{beneficiary.bankName || "Not Seeded"}</p>
                  </div>
                  <div className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Number</p>
                    <p className="font-bold text-sm text-on-surface mt-1 font-mono">{beneficiary.bankAccountNo || "Not Seeded"}</p>
                  </div>
                  <div className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IFSC Code</p>
                    <p className="font-bold text-sm text-on-surface mt-1 font-mono uppercase">{beneficiary.bankIfsc || "Not Seeded"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Impact Summary" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="bg-secondary-container/10 border border-secondary/20 rounded-xl p-4 text-xs font-sans text-on-surface-variant flex gap-3 items-start leading-relaxed">
                <span className="material-symbols-outlined text-secondary shrink-0">insights</span>
                <div>
                  <p className="font-bold text-secondary mb-1">Where does the Impact Summary come from?</p>
                  <p>Socio-economic metrics are generated automatically from active micro-project stats:
                    1) <strong>Resilience Index</strong> is updated dynamically based on household surveys; 
                    2) <strong>Goat Rearing ROI</strong> is calculated as returns vs initial investment; 
                    3) <strong>Sugarcane Yield Efficiency</strong> measures actual harvested tonnage against the allotted land target.</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-primary font-bold">insights</span>
                Household Socio-Economic Impact Summary
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                Aggregated impact parameters representing baseline improvements across financial reserve parameters since enrolling in the portal.
              </p>
              
              <div className="space-y-6 font-sans text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Resilience Index Rating</span>
                    <span className="text-primary">{score}% score</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${score}%` }}></div>
                  </div>
                </div>
                
                {beneficiary.goatRearingDetails && beneficiary.goatRearingDetails.length > 0 && beneficiary.goatRearingDetails.map((detail, idx) => detail.roiPercentage !== null ? (
                  <div key={`goat-roi-${idx}`}>
                    <div className="flex justify-between font-bold mb-1">
                      <span>Goat Rearing ROI ({detail.goatRearingProgram?.name || "Program"})</span>
                      <span className="text-primary">{detail.roiPercentage}% ROI</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, detail.roiPercentage)}%` }}></div>
                    </div>
                  </div>
                ) : null)}

                {beneficiary.sugarcaneDetails && beneficiary.sugarcaneDetails.length > 0 && beneficiary.sugarcaneDetails.map((detail, idx) => detail.actualYieldTons ? (
                  <div key={`cane-yield-${idx}`}>
                    <div className="flex justify-between font-bold mb-1">
                      <span>Sugarcane Yield Efficiency ({detail.sugarcaneProgram?.name || "Program"})</span>
                      <span className="text-primary">{Math.round((detail.actualYieldTons / detail.estimatedYieldTons) * 100)}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((detail.actualYieldTons / detail.estimatedYieldTons) * 100))}%` }}></div>
                    </div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>

        {/* Secondary Info Sidepanel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="text-xs uppercase tracking-widest text-on-surface-variant mb-4 font-sans font-bold">
              Cumulative Impact
            </h3>
            <div className="space-y-4 text-sm font-sans">
              <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] font-bold">payments</span>
                  </div>
                  <span className="font-semibold text-on-surface">Goat Returns</span>
                </div>
                <span className="font-bold text-on-surface text-base">{cumulativeReturns}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] font-bold">agriculture</span>
                  </div>
                  <span className="font-semibold text-on-surface">Allotted Land</span>
                </div>
                <span className="font-bold text-on-surface text-base">{landAllottedText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* master edit profile modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] font-sans border border-outline-variant/10 text-on-surface">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-surface-container-high pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Edit Master Beneficiary Profile</h3>
                <p className="text-xs text-on-surface-variant">Update demographic info, bank accounts, identities, and nested items.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Edit Sub-tabs */}
            <div className="flex border-b border-surface-container-high mb-4 overflow-x-auto no-scrollbar font-sans text-xs">
              {[
                { key: "Personal", label: "Personal & Income" },
                { key: "IDBank", label: "IDs & Bank Details" },
                { key: "Family", label: "Family Registry" },
                { key: "Livestock", label: "Livestock Inventory" },
                { key: "Schemes", label: "Scheme Specific" }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setEditTab(tab.key)}
                  className={`px-4 py-2 border-none bg-transparent cursor-pointer font-bold uppercase tracking-wider ${
                    editTab === tab.key ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateProfile} className="flex-grow overflow-y-auto pr-2 space-y-4">
              
              {editTab === "Personal" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">DOB</label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Mobile Number</label>
                    <input type="text" value={mobNumber} onChange={e => setMobNumber(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Caste</label>
                    <input type="text" placeholder="e.g. General, OBC, SC, ST" value={caste} onChange={e => setCaste(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Religion</label>
                    <input type="text" placeholder="e.g. Hinduism, Islam" value={religion} onChange={e => setReligion(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Primary Income Category</label>
                    <input type="text" placeholder="e.g. Agriculture, Livestock" value={primaryIncomeType} onChange={e => setPrimaryIncomeType(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Annual Income (₹)</label>
                    <input type="number" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Monthly Income (₹)</label>
                    <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Household Size</label>
                    <input type="number" value={householdSize} onChange={e => setHouseholdSize(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Resilience Index (0-100)</label>
                    <input type="number" min="0" max="100" value={resilienceScore} onChange={e => setResilienceScore(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Socio-Economic Tier</label>
                    <select value={tier} onChange={e => setTier(e.target.value)} className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface">
                      <option value="Tier 1">Tier 1 (Lowest Income)</option>
                      <option value="Tier 2">Tier 2 (Marginal Income)</option>
                      <option value="Tier 3">Tier 3 (Developing)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Tier Percent (Progress)</label>
                    <input type="number" value={tierPercent} onChange={e => setTierPercent(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Address / Location</label>
                    <textarea value={address} rows="2" onChange={e => setAddress(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface resize-none" />
                  </div>
                </div>
              )}

              {editTab === "IDBank" && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Identity Proofs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Aadhar Number</label>
                      <input type="text" placeholder="1234 5678 9012" value={aadhar} onChange={e => setAadhar(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">PAN Card</label>
                      <input type="text" placeholder="ABCDE1234F" value={panCard} onChange={e => setPanCard(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Ration Card (SFY)</label>
                      <input type="text" placeholder="RC-AS-XXXX" value={rationCard} onChange={e => setRationCard(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide border-t border-surface-container-high pt-4">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Bank Name</label>
                      <input type="text" placeholder="e.g. State Bank of India" value={bankName} onChange={e => setBankName(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Account Number</label>
                      <input type="text" value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">IFSC Code</label>
                      <input type="text" placeholder="SBIN000XXXX" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                  </div>
                </div>
              )}

              {editTab === "Family" && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Family Members List</h4>
                    <button
                      type="button"
                      onClick={addFamilyMemberRow}
                      className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      + Add Member
                    </button>
                  </div>

                  <div className="space-y-3">
                    {familyMembers.map((m, idx) => (
                      <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 border border-surface-container-high bg-surface-container-low/20 rounded-lg">
                        <div className="flex-1 min-w-[150px] flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Full Name</label>
                          <input type="text" required value={m.name} onChange={e => updateFamilyMemberRow(idx, "name", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="w-32 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Relation</label>
                          <input type="text" required value={m.relation} onChange={e => updateFamilyMemberRow(idx, "relation", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="w-40 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">DOB</label>
                          <input type="date" value={m.dob} onChange={e => updateFamilyMemberRow(idx, "dob", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="w-44 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Contact Mobile</label>
                          <input type="text" value={m.contactInfo} onChange={e => updateFamilyMemberRow(idx, "contactInfo", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFamilyMemberRow(idx)}
                          className="px-2 py-1.5 bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors rounded cursor-pointer border-none flex items-center justify-center self-stretch shrink-0 mt-1 md:mt-0"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {familyMembers.length === 0 && (
                      <p className="text-center text-on-surface-variant italic py-4">No family members registered. Click "+ Add Member" above.</p>
                    )}
                  </div>
                </div>
              )}

              {editTab === "Livestock" && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Livestock Assets Directory</h4>
                    <button
                      type="button"
                      onClick={addLivestockRow}
                      className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      + Add Animal Asset
                    </button>
                  </div>

                  <div className="space-y-3">
                    {livestock.map((l, idx) => (
                      <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 border border-surface-container-high bg-surface-container-low/20 rounded-lg">
                        <div className="w-44 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Tag / Animal ID</label>
                          <input type="text" required value={l.tagNumber} onChange={e => updateLivestockRow(idx, "tagNumber", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="w-32 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Animal Type</label>
                          <input type="text" required value={l.animalType} onChange={e => updateLivestockRow(idx, "animalType", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="flex-1 min-w-[120px] flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Breed Name</label>
                          <input type="text" value={l.breed} onChange={e => updateLivestockRow(idx, "breed", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="w-24 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Age (Months)</label>
                          <input type="number" value={l.ageMonths} onChange={e => updateLivestockRow(idx, "ageMonths", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent border-outline-variant text-on-surface text-xs" />
                        </div>
                        <div className="w-36 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Health Status</label>
                          <select value={l.healthStatus} onChange={e => updateLivestockRow(idx, "healthStatus", e.target.value)} className="px-2 py-1.5 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface text-xs">
                            <option value="Healthy">Healthy</option>
                            <option value="Needs Check">Needs Check</option>
                            <option value="Sick">Sick</option>
                            <option value="Vaccinated">Vaccinated</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLivestockRow(idx)}
                          className="px-2 py-1.5 bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors rounded cursor-pointer border-none flex items-center justify-center self-stretch shrink-0 mt-1 md:mt-0"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    {livestock.length === 0 && (
                      <p className="text-center text-on-surface-variant italic py-4">No livestock registered. Click "+ Add Animal Asset" above.</p>
                    )}
                  </div>
                </div>
              )}

              {editTab === "Schemes" && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 border border-outline-variant/10 bg-surface-container-low/20 rounded-xl space-y-3">
                    <h4 className="font-bold text-sm text-on-surface uppercase tracking-wide">Scheme Enrollments</h4>
                    <div className="flex gap-6 mt-1 text-sm font-medium">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enrolledSchemes.includes("Goat Rearing")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnrolledSchemes([...enrolledSchemes, "Goat Rearing"]);
                            } else {
                              setEnrolledSchemes(enrolledSchemes.filter(s => s !== "Goat Rearing"));
                            }
                          }}
                          className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                        />
                        <span>Enroll in Goat Rearing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enrolledSchemes.includes("Sugarcane")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnrolledSchemes([...enrolledSchemes, "Sugarcane"]);
                            } else {
                              setEnrolledSchemes(enrolledSchemes.filter(s => s !== "Sugarcane"));
                            }
                          }}
                          className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                        />
                        <span>Enroll in Sugarcane Cultivation</span>
                      </label>
                    </div>
                  </div>

                  {(enrolledSchemes.includes("Goat Rearing") || enrolledSchemes.includes("Sugarcane")) && (
                    <p className="text-sm text-on-surface-variant italic p-4 bg-surface-container-low/20 rounded-xl border border-outline-variant/10">
                      Specific program details (e.g. goats assigned, crop stages, yields) are now managed directly from the respective Program Detail pages.
                    </p>
                  )}

                  {!enrolledSchemes.includes("Goat Rearing") && !enrolledSchemes.includes("Sugarcane") && (
                    <p className="text-center text-on-surface-variant italic">Select a scheme above to enroll this beneficiary.</p>
                  )}
                </div>
              )}

            </form>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-surface-container-high pt-4 mt-4 text-xs font-sans">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProfile}
                className="px-5 py-2.5 rounded-full bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer border-none font-bold uppercase tracking-wider shadow-glow"
              >
                Save Profile Updates
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
