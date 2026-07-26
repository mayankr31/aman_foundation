"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import { useToast } from "@/context/ToastContext";

export default function BeneficiaryProfileDetail() {
  const { id } = useParams();

  const { token, isInitializing } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("Program History");
  const [beneficiary, setBeneficiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmMigrate, setShowConfirmMigrate] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
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
  // Resilience Surveys
  const [surveys, setSurveys] = useState([]);
  const [adaptiveSurveys, setAdaptiveSurveys] = useState([]);
  const [absorptiveSurveys, setAbsorptiveSurveys] = useState([]);
  const [transformativeSurveys, setTransformativeSurveys] = useState([]);
  const [vulnerabilitySurveys, setVulnerabilitySurveys] = useState([]);
  const [solutionPlans, setSolutionPlans] = useState([]);

  // Migration History
  const [migrationRecords, setMigrationRecords] = useState([]);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationForm, setMigrationForm] = useState({ migrationType: "SEASONAL", destination: "", migrationDate: "", expectedReturnDate: "", actualReturnDate: "", notes: "" });
  const [editMigrationId, setEditMigrationId] = useState(null);

  // Income Tracking
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ amount: "", incomeDate: "", source: "", notes: "" });
  const [incomeOtherSource, setIncomeOtherSource] = useState("");
  const [editIncomeId, setEditIncomeId] = useState(null);

  // Link Students
  const [showLinkStudentModal, setShowLinkStudentModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);

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

        setMigrationRecords(b.migrationRecords || []);

        const incomeRes = await fetch(`/api/beneficiaries/${id}/income`, { headers });
        if (incomeRes.ok) {
          const incomeData = await incomeRes.json();
          if (incomeData.success) {
            setIncomeRecords(incomeData.data);
          }
        }

        // Fetch Resilience Surveys
        const resilienceRes = await fetch(`/api/beneficiaries/${id}/resilience-surveys`, { headers });
        if (resilienceRes.ok) {
          const resilienceData = await resilienceRes.json();
          if (resilienceData.success) {
            setSurveys(resilienceData.data);
          }
        }

        // Fetch Adaptive Capacity Surveys
        const adaptiveRes = await fetch(`/api/beneficiaries/${id}/adaptive-surveys`, { headers });
        if (adaptiveRes.ok) {
          const adaptiveData = await adaptiveRes.json();
          if (adaptiveData.success) {
            setAdaptiveSurveys(adaptiveData.data);
          }
        }

        // Fetch Absorptive Capacity Surveys
        const absorptiveRes = await fetch(`/api/beneficiaries/${id}/absorptive-surveys`, { headers });
        if (absorptiveRes.ok) {
          const absorptiveData = await absorptiveRes.json();
          if (absorptiveData.success) {
            setAbsorptiveSurveys(absorptiveData.data);
          }
        }

        // Fetch Transformative Capacity Surveys
        const transformativeRes = await fetch(`/api/beneficiaries/${id}/transformative-surveys`, { headers });
        if (transformativeRes.ok) {
          const transformativeData = await transformativeRes.json();
          if (transformativeData.success) {
            setTransformativeSurveys(transformativeData.data);
          }
        }

        // Fetch Vulnerability Surveys
        const vulnerabilityRes = await fetch(`/api/beneficiaries/${id}/vulnerability-surveys`, { headers });
        if (vulnerabilityRes.ok) {
          const vulnerabilityData = await vulnerabilityRes.json();
          if (vulnerabilityData.success) {
            setVulnerabilitySurveys(vulnerabilityData.data);
          }
        }

        // Fetch Solution Plans
        const solutionRes = await fetch(`/api/beneficiaries/${id}/solution-plans`, { headers });
        if (solutionRes.ok) {
          const solutionData = await solutionRes.json();
          if (solutionData.success) {
            setSolutionPlans(solutionData.data);
          }
        }

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

  const handleToggleMigrated = async () => {
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isMigrated: !beneficiary.isMigrated })
      });
      const json = await res.json();
      if (json.success) {
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to update migration status");
      }
    } catch (err) {
      console.error("Update migration error:", err);
    } finally {
      setShowConfirmMigrate(false);
    }
  };

  const handleDeleteBeneficiary = async () => {
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Beneficiary deleted successfully.");
        window.location.href = "/beneficiaries";
      } else {
        alert(json.error || "Failed to delete beneficiary");
      }
    } catch (err) {
      console.error("Delete beneficiary error:", err);
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const handleOpenMigrationForm = (record = null) => {
    if (record) {
      setEditMigrationId(record.id);
      setMigrationForm({
        migrationType: record.migrationType || "SEASONAL",
        destination: record.destination || "",
        migrationDate: record.migrationDate ? record.migrationDate.split("T")[0] : "",
        expectedReturnDate: record.expectedReturnDate ? record.expectedReturnDate.split("T")[0] : "",
        actualReturnDate: record.actualReturnDate ? record.actualReturnDate.split("T")[0] : "",
        notes: record.notes || ""
      });
    } else {
      setEditMigrationId(null);
      setMigrationForm({ migrationType: "SEASONAL", destination: "", migrationDate: "", expectedReturnDate: "", actualReturnDate: "", notes: "" });
    }
    setShowMigrationModal(true);
  };

  const handleCloseMigrationForm = () => {
    setShowMigrationModal(false);
    setEditMigrationId(null);
  };

  const handleMigrationSave = async (e) => {
    e.preventDefault();
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const url = editMigrationId
        ? `/api/beneficiaries/${id}/migrations/${editMigrationId}`
        : `/api/beneficiaries/${id}/migrations`;
      const method = editMigrationId ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(migrationForm) });
      const json = await res.json();
      if (json.success) {
        handleCloseMigrationForm();
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to save migration record");
      }
    } catch (err) {
      console.error("Migration save error:", err);
    }
  };

  const handleDeleteMigration = async (recordId) => {
    if (!confirm("Are you sure you want to delete this migration record?")) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/beneficiaries/${id}/migrations/${recordId}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to delete migration record");
      }
    } catch (err) {
      console.error("Delete migration error:", err);
    }
  };

  const handleOpenIncomeForm = (record = null) => {
    if (record) {
      setEditIncomeId(record.id);
      const knownSources = ["Agriculture", "Livestock", "Daily Wage", "Small Business", "Remittance"];
      const isCustomSource = record.source && !knownSources.includes(record.source);
      setIncomeForm({
        amount: record.amount || "",
        incomeDate: record.incomeDate ? record.incomeDate.split("T")[0] : "",
        source: isCustomSource ? "Other" : (record.source || ""),
        notes: record.notes || ""
      });
      setIncomeOtherSource(isCustomSource ? (record.source || "") : "");
    } else {
      setEditIncomeId(null);
      setIncomeForm({ amount: "", incomeDate: "", source: "", notes: "" });
      setIncomeOtherSource("");
    }
    setShowIncomeModal(true);
  };

  const handleCloseIncomeForm = () => {
    setShowIncomeModal(false);
    setEditIncomeId(null);
    setIncomeOtherSource("");
  };

  const handleIncomeSave = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || !incomeForm.incomeDate) {
      alert("Amount and Date are required.");
      return;
    }
    const resolvedSource = incomeForm.source === "Other" ? (incomeOtherSource.trim() || "Other") : incomeForm.source;
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const url = `/api/beneficiaries/${id}/income`;
      const method = "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ ...incomeForm, source: resolvedSource })
      });
      const json = await res.json();
      if (json.success) {
        handleCloseIncomeForm();
        loadBeneficiaryDetail();
        toast.success("Income record saved successfully.");
      } else {
        alert(json.error || "Failed to save income record");
      }
    } catch (err) {
      console.error("Income save error:", err);
    }
  };

  const handleDeleteIncome = async (recordId) => {
    if (!confirm("Are you sure you want to delete this income record?")) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/beneficiaries/${id}/income`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ recordId })
      });
      const json = await res.json();
      if (json.success) {
        loadBeneficiaryDetail();
        toast.success("Income record deleted.");
      } else {
        alert(json.error || "Failed to delete income record");
      }
    } catch (err) {
      console.error("Delete income error:", err);
    }
  };

  const handleStudentSearch = async (query) => {
    setStudentSearch(query);
    setStudentSearchLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = `/api/students${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        setAllStudents(json.data || []);
      }
    } catch (err) {
      console.error("Student search error:", err);
    } finally {
      setStudentSearchLoading(false);
    }
  };

  const handleLinkStudent = async (studentId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ beneficiaryId: id })
      });
      const json = await res.json();
      if (json.success) {
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to link student");
      }
    } catch (err) {
      console.error("Link student error:", err);
    }
  };

  const handleUnlinkStudent = async (studentId) => {
    if (!confirm("Are you sure you want to unlink this student?")) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ beneficiaryId: null })
      });
      const json = await res.json();
      if (json.success) {
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to unlink student");
      }
    } catch (err) {
      console.error("Unlink student error:", err);
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
        <div className="flex gap-3 font-sans flex-wrap">
          <button
            onClick={() => setShowConfirmMigrate(true)}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-body-md font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">
              {beneficiary.isMigrated ? "undo" : "moving"}
            </span>
            {beneficiary.isMigrated ? "Unmark Migrated" : "Mark Migrated"}
          </button>
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
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="bg-error-container text-on-error-container px-5 py-2.5 rounded-full text-body-md font-medium hover:bg-error-container/80 transition-colors flex items-center gap-2 cursor-pointer border border-error/20"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete
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
                {beneficiary.isMigrated && (
                  <span className="bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap w-fit">
                    Migrated
                  </span>
                )}
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
          {["Program History", "Family Directory", "ID Proofs & Bank Details", "Impact Summary", "Income Tracking", "Resilience KYR Tool", "Adaptive Capacity", "Absorptive Capacity", "Transformative Capacity", "Vulnerability", "Solution Board & Planning", "Migration History"].map((tab) => {
            const isActive = activeTab === tab;
            const tabLabel = tab === "Family Directory" && beneficiary.familyMembers?.length
              ? `Family Directory (${beneficiary.familyMembers.length})`
              : tab === "Migration History"
                ? `Migration History (${migrationRecords.length})`
                : tab === "Income Tracking"
                  ? `Income Tracking (${incomeRecords.length})`
                  : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 whitespace-nowrap text-sm font-semibold border-b-2 transition-colors ${
                  isActive ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-container-highest"
                }`}
              >
                {tabLabel}
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

              {/* Active Scheme Enrollments */}
              <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 font-sans">
                <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Active Livelihood Programs
                </h3>

                {(!beneficiary.livelihoodDetails || beneficiary.livelihoodDetails.length === 0) &&
                 (!beneficiary.goatRearingDetails || beneficiary.goatRearingDetails.length === 0) &&
                 (!beneficiary.sugarcaneDetails || beneficiary.sugarcaneDetails.length === 0) ? (
                  <p className="text-sm text-on-surface-variant italic">No program enrollments found. Enroll this beneficiary through a program detail page.</p>
                ) : (
                  <div className="space-y-6">
                    {/* New Unified Livelihood Details */}
                    {beneficiary.livelihoodDetails && beneficiary.livelihoodDetails.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-surface-container-high pb-2">
                          {beneficiary.livelihoodDetails.filter(d => d.program?.category === "FARM").length > 0 ? "Farm" : ""}
                          {beneficiary.livelihoodDetails.filter(d => d.program?.category === "FARM").length > 0 && beneficiary.livelihoodDetails.filter(d => d.program?.category === "NON_FARM").length > 0 ? " & " : ""}
                          {beneficiary.livelihoodDetails.filter(d => d.program?.category === "NON_FARM").length > 0 ? "Non-Farm" : ""} Programs
                        </p>
                        {beneficiary.livelihoodDetails.map((detail) => (
                          <div key={detail.id} className="bg-surface p-5 rounded-lg border border-surface-container-high">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-on-surface text-base">{detail.program?.name || "Unknown Program"}</h4>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {detail.program?.category === "FARM" ? "Farm" : "Non-Farm"} · {detail.program?.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "N/A"}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">
                                Enrolled {new Date(detail.enrolledAt).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                              {detail.attributes && typeof detail.attributes === "object" && Object.entries(detail.attributes).map(([key, val]) => {
                                if (val === null || val === undefined || val === "") return null;
                                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
                                let display = String(val);
                                if (["investment", "returnsAmount", "estimatedRevenue", "actualRevenue"].includes(key)) {
                                  display = `₹${Number(val).toLocaleString("en-IN")}`;
                                } else if (key === "roiPercentage") {
                                  display = `${Number(val).toFixed(1)}%`;
                                } else if (typeof val === "number") {
                                  display = Number(val).toLocaleString("en-IN");
                                }
                                return (
                                  <div key={key}>
                                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">{label}</p>
                                    <p className="text-on-surface font-bold text-sm mt-0.5">{display}</p>
                                  </div>
                                );
                              })}
                              {detail.notes && (
                                <div className="col-span-full border-t border-surface-container-high pt-2 mt-1">
                                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Notes</p>
                                  <p className="text-on-surface-variant text-sm mt-0.5">{detail.notes}</p>
                                </div>
                              )}
                            </div>
                            {detail.events && detail.events.length > 0 && (
                              <div className="mt-3 border-t border-surface-container-high pt-3">
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-2">Events</p>
                                <div className="space-y-2">
                                  {detail.events.map((evt) => (
                                    <div key={evt.id} className="flex items-start gap-2 p-2 bg-surface-container-low rounded border border-outline-variant/10 text-xs">
                                      <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 shrink-0">{evt.eventType}</span>
                                      <span className="text-on-surface-variant">{new Date(evt.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                      {evt.quantity != null && <span className="text-on-surface-variant">Qty: {evt.quantity}</span>}
                                      {evt.notes && <span className="text-on-surface-variant truncate max-w-xs">{evt.notes}</span>}
                                      {evt.photoUrl && (
                                        <button onClick={() => setLightboxPhoto(evt.photoUrl)} className="shrink-0 w-8 h-8 rounded overflow-hidden border border-outline-variant/20 cursor-pointer bg-transparent p-0 ml-auto">
                                          <img src={evt.photoUrl} alt="Event" className="w-full h-full object-cover" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy Goat Rearing Details */}
                    {beneficiary.goatRearingDetails && beneficiary.goatRearingDetails.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-surface-container-high pb-2">Legacy — Goat Rearing</p>
                        {beneficiary.goatRearingDetails.map((detail, idx) => (
                          <div key={detail.id || idx} className="bg-surface p-5 rounded-lg border border-surface-container-high">
                            <h4 className="font-bold text-on-surface text-sm mb-3">{detail.goatRearingProgram?.name || "Unassigned"}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs p-3 bg-surface-container-lowest rounded-lg">
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Goats</p><p className="text-on-surface font-bold text-sm mt-0.5">{detail.goatsAssigned}</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Investment</p><p className="text-on-surface font-bold text-sm mt-0.5">₹{detail.investment?.toLocaleString() || "N/A"}</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Returns</p><p className="text-on-surface font-bold text-sm mt-0.5">₹{detail.returnsAmount?.toLocaleString() || "N/A"}</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">ROI</p><p className="text-primary font-bold text-sm mt-0.5">{detail.roiPercentage != null ? `${detail.roiPercentage}%` : "N/A"}</p></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy Sugarcane Details */}
                    {beneficiary.sugarcaneDetails && beneficiary.sugarcaneDetails.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-surface-container-high pb-2">Legacy — Sugarcane</p>
                        {beneficiary.sugarcaneDetails.map((detail, idx) => (
                          <div key={detail.id || idx} className="bg-surface p-5 rounded-lg border border-surface-container-high">
                            <h4 className="font-bold text-on-surface text-sm mb-3">{detail.sugarcaneProgram?.name || "Unassigned"}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs p-3 bg-surface-container-lowest rounded-lg">
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Land</p><p className="text-on-surface font-bold text-sm mt-0.5">{detail.hectaresAllotted} Ha</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Soil / Water</p><p className="text-on-surface font-bold text-sm mt-0.5">{detail.soilType || "N/A"} / {detail.waterSource || "N/A"}</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Stage</p><p className="text-secondary font-bold text-sm mt-0.5 uppercase">{detail.cropStage}</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Yield (Est/Actual)</p><p className="text-on-surface font-bold text-sm mt-0.5">{detail.estimatedYieldTons}/{detail.actualYieldTons || "—"} T</p></div>
                              <div><p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Revenue (Est/Actual)</p><p className="text-on-surface font-bold text-sm mt-0.5">₹{detail.estimatedRevenue?.toLocaleString() || "N/A"} / {detail.actualRevenue ? `₹${detail.actualRevenue.toLocaleString()}` : "N/A"}</p></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

          {activeTab === "Resilience KYR Tool" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">assignment</span>
                    Resilience Measurement - HH level KYR tool
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-1">
                    Assess the family's capacity to absorb, adapt and transform.
                  </p>
                </div>
                <Link
                  href={`/beneficiaries/${id}/kyr-survey`}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Take New Survey
                </Link>
              </div>

              <div className="space-y-4">
                {surveys && surveys.length > 0 ? (
                  surveys.map((survey) => (
                    <div key={survey.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col gap-4 font-sans">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <p className="font-bold text-on-surface">Survey Date: {new Date(survey.surveyDate).toLocaleDateString()}</p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Overall Score: <span className="font-bold text-primary">{survey.overallScore}%</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Financial</p>
                            <p className="text-on-surface font-semibold">{survey.financialResilienceScore}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Health</p>
                            <p className="text-on-surface font-semibold">{survey.healthResilienceScore}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Social</p>
                            <p className="text-on-surface font-semibold">{survey.socialConnectednessScore}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Mindset</p>
                            <p className="text-on-surface font-semibold">{survey.disasterMindsetScore}%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-surface-container-highest">
                        <Link href={`/beneficiaries/${id}/responses/kyr/${survey.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Full Response
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No surveys have been taken for this beneficiary yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Adaptive Capacity" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">trending_up</span>
                    Adaptive Capacity Tool
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-1">
                    Assess the household's ability to adapt to new situations.
                  </p>
                </div>
                <Link
                  href={`/beneficiaries/${id}/adaptive-capacity`}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Take New Survey
                </Link>
              </div>

              <div className="space-y-4">
                {adaptiveSurveys && adaptiveSurveys.length > 0 ? (
                  adaptiveSurveys.map((survey) => (
                    <div key={survey.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-on-surface">Survey Date: {new Date(survey.surveyDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Score: <span className="font-bold text-primary">{parseFloat(survey.overallScore).toFixed(2)}</span> / 9
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-surface-container-highest">
                        <Link href={`/beneficiaries/${id}/responses/adaptive/${survey.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Full Response
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No adaptive capacity surveys have been taken for this beneficiary yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Absorptive Capacity" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">shield</span>
                    Absorptive Capacity Tool
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-1">
                    Assess the household's ability to absorb shocks and disasters.
                  </p>
                </div>
                <Link
                  href={`/beneficiaries/${id}/absorptive-capacity`}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Take New Survey
                </Link>
              </div>

              <div className="space-y-4">
                {absorptiveSurveys && absorptiveSurveys.length > 0 ? (
                  absorptiveSurveys.map((survey) => (
                    <div key={survey.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-on-surface">Survey Date: {new Date(survey.surveyDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Score: <span className="font-bold text-primary">{parseFloat(survey.overallScore).toFixed(2)}</span> / 7
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-surface-container-highest">
                        <Link href={`/beneficiaries/${id}/responses/absorptive/${survey.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Full Response
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No absorptive capacity surveys have been taken for this beneficiary yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Transformative Capacity" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">architecture</span>
                    Transformative Capacity Tool
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-1">
                    Assess systemic changes and access to markets, services, and opportunities.
                  </p>
                </div>
                <Link
                  href={`/beneficiaries/${id}/transformative-capacity`}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Take New Survey
                </Link>
              </div>

              <div className="space-y-4">
                {transformativeSurveys && transformativeSurveys.length > 0 ? (
                  transformativeSurveys.map((survey) => (
                    <div key={survey.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-on-surface">Survey Date: {new Date(survey.surveyDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Score: <span className="font-bold text-primary">{parseFloat(survey.overallScore).toFixed(2)}</span> / 9
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-surface-container-highest">
                        <Link href={`/beneficiaries/${id}/responses/transformative/${survey.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Full Response
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No transformative capacity surveys have been taken for this beneficiary yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Vulnerability" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">warning</span>
                    Vulnerability Assessment Tool
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-1">
                    Assess the shocks, hardships, and effects faced by the household.
                  </p>
                </div>
                <Link
                  href={`/beneficiaries/${id}/vulnerability`}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Take New Survey
                </Link>
              </div>

              <div className="space-y-4">
                {vulnerabilitySurveys && vulnerabilitySurveys.length > 0 ? (
                  vulnerabilitySurveys.map((survey) => (
                    <div key={survey.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col font-sans">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-on-surface">Survey Date: {new Date(survey.surveyDate).toLocaleDateString()}</p>
                          <p className="text-xs text-on-surface-variant mt-1">Shocks, Hardships, and Severities Recorded</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-surface-container-highest">
                        <Link href={`/beneficiaries/${id}/responses/vulnerability/${survey.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Full Response
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No vulnerability surveys have been taken for this beneficiary yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Solution Board & Planning" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6 font-sans">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4 border-b border-surface-container-highest pb-6">
                <div>
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">assignment_turned_in</span>
                    Solution Board & Planning
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-2 max-w-2xl">
                    View the reference documents to understand resilience gaps, then create a customized action plan prioritizing key areas for the household.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <Link
                    href={`/beneficiaries/${id}/solution-board-reference`}
                    className="w-full bg-surface-container-highest text-on-surface border border-outline-variant/30 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-surface-container-highest/80 transition-colors flex items-center justify-center gap-2 text-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    View Reference Board
                  </Link>
                  <Link
                    href={`/beneficiaries/${id}/solution-plan`}
                    className="w-full gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-glow text-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create Solution Plan
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-on-surface mb-4">Saved Solution Plans</h4>
                <div className="space-y-4">
                  {solutionPlans && solutionPlans.length > 0 ? (
                    solutionPlans.map((plan) => (
                      <div key={plan.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col font-sans">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-on-surface flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                              Plan Date: {new Date(plan.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-on-surface-variant mt-1">
                              Priorities targeted: <span className="font-semibold text-on-surface">{plan.planData?.numAreasPrioritized || 0}</span>
                            </p>
                          </div>
                          <div>
                            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
                              Plan Active
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-surface-container-highest">
                          <Link href={`/beneficiaries/${id}/responses/solution-plan/${plan.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            View Full Plan
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                      No solution plans have been created for this beneficiary yet. Click "Create Solution Plan" to get started.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Income Tracking" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">payments</span>
                    Income Tracking
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Record monthly income entries for this household.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenIncomeForm()}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Income
                </button>
              </div>

              <div className="space-y-4">
                {incomeRecords && incomeRecords.length > 0 ? (
                  incomeRecords.map((record) => (
                    <div key={record.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-bold text-on-surface text-lg">₹{Number(record.amount).toLocaleString()}</p>
                          {record.source && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container">
                              {record.source}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Date</p>
                            <p className="text-on-surface font-medium">{record.incomeDate ? new Date(record.incomeDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Recorded On</p>
                            <p className="text-on-surface font-medium">{new Date(record.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                        </div>
                        {record.notes && (
                          <p className="text-xs text-on-surface-variant mt-2 italic">"{record.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenIncomeForm(record)}
                          className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer border-none bg-transparent text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(record.id)}
                          className="p-1.5 hover:bg-error-container/20 rounded-full transition-colors cursor-pointer border-none bg-transparent text-on-surface-variant hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No income records found for this beneficiary.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Migration History" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">moving</span>
                    Migration History
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Track seasonal and permanent migration patterns for this household.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenMigrationForm()}
                  className="gradient-primary bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Migration
                </button>
              </div>

              <div className="space-y-4">
                {migrationRecords && migrationRecords.length > 0 ? (
                  migrationRecords.map((record) => (
                    <div key={record.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            record.migrationType === "PERMANENT" ? "bg-error-container text-on-error-container" : "bg-tertiary-container text-on-tertiary-container"
                          }`}>
                            {record.migrationType === "PERMANENT" ? "Permanent" : "Seasonal"}
                          </span>
                        </div>
                        <p className="font-bold text-on-surface text-sm">{record.destination}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs">
                          <div>
                            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Migration Date</p>
                            <p className="text-on-surface font-medium">{record.migrationDate ? new Date(record.migrationDate).toLocaleDateString() : "N/A"}</p>
                          </div>
                          {record.expectedReturnDate && (
                            <div>
                              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Expected Return</p>
                              <p className="text-on-surface font-medium">{new Date(record.expectedReturnDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          {record.actualReturnDate && (
                            <div>
                              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Actual Return</p>
                              <p className="text-on-surface font-medium">{new Date(record.actualReturnDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-xs text-on-surface-variant mt-2 italic">"{record.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenMigrationForm(record)}
                          className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer border-none bg-transparent text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMigration(record.id)}
                          className="p-1.5 hover:bg-error-container/20 rounded-full transition-colors cursor-pointer border-none bg-transparent text-on-surface-variant hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                    No migration records found for this beneficiary.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Family Directory" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-primary">group</span>
                  Family Members &amp; Household Registry
                </h3>
                <button
                  onClick={() => { setShowEditModal(true); setEditTab("Family"); }}
                  className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Family Member
                </button>
              </div>
              
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

              {/* Linked Students */}
              <div className="border-t border-surface-container-high pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">school</span>
                    Linked Students
                  </h4>
                  <button
                    onClick={() => { setStudentSearch(""); setShowLinkStudentModal(true); handleStudentSearch(""); }}
                    className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_link</span>
                    Link Student
                  </button>
                </div>

                <div className="space-y-3">
                  {beneficiary.students && beneficiary.students.length > 0 ? (
                    beneficiary.students.map((student) => (
                      <div key={student.id} className="p-3 border border-surface-container-highest rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 font-sans bg-surface-container-low/20">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/students/${student.id}`}
                              className="font-bold text-sm text-primary hover:underline capitalize"
                            >
                              {student.name}
                            </Link>
                            {student.isMigrated && (
                              <span className="px-1.5 py-0.5 bg-surface-variant text-on-surface-variant rounded text-[8px] font-bold uppercase tracking-wider">
                                Migrated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                            <span className="font-mono text-[9px]">ID: {student.studentId || student.id}</span>
                            <span>Grade: {student.grade || "N/A"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkStudent(student.id)}
                          className="px-2.5 py-1 bg-error-container/20 text-on-error-container hover:bg-error-container/40 transition-colors rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none flex items-center gap-1 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[14px]">link_off</span>
                          Unlink
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant italic p-3 border border-dashed border-surface-container-highest rounded-lg bg-surface-container-low/10 text-center">
                      No students linked to this household yet. Click "Link Student" to connect a student record.
                    </p>
                  )}
                </div>
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

      {/* Income Form Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center border-b border-surface-container-high pb-4 mb-4">
              <h3 className="text-xl font-bold text-on-surface">
                {editIncomeId ? "Edit Income Record" : "Add Income Record"}
              </h3>
              <button
                onClick={handleCloseIncomeForm}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleIncomeSave} className="flex-grow overflow-y-auto pr-2 space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Date</label>
                <input
                  type="date"
                  required
                  value={incomeForm.incomeDate}
                  onChange={e => setIncomeForm({ ...incomeForm, incomeDate: e.target.value })}
                  className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={incomeForm.amount}
                  onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Income Source</label>
                <select
                  value={incomeForm.source}
                  onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface"
                >
                  <option value="">Select source</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Daily Wage">Daily Wage</option>
                  <option value="Small Business">Small Business</option>
                  <option value="Remittance">Remittance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {incomeForm.source === "Other" && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold uppercase tracking-wider text-slate-400">Specify Other Source</label>
                  <input
                    type="text"
                    required
                    value={incomeOtherSource}
                    onChange={e => setIncomeOtherSource(e.target.value)}
                    placeholder="e.g. Pension, Rental, Fishing..."
                    className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Notes</label>
                <textarea
                  rows="3"
                  value={incomeForm.notes}
                  onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  placeholder="Additional notes about this income entry..."
                  className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface resize-none"
                />
              </div>
            </form>

            <div className="flex justify-end gap-3 border-t border-surface-container-high pt-4 mt-4 text-xs font-sans">
              <button
                type="button"
                onClick={handleCloseIncomeForm}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIncomeSave}
                className="px-5 py-2.5 rounded-full bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer border-none font-bold uppercase tracking-wider shadow-glow"
              >
                {editIncomeId ? "Update Record" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Form Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center border-b border-surface-container-high pb-4 mb-4">
              <h3 className="text-xl font-bold text-on-surface">
                {editMigrationId ? "Edit Migration Record" : "Add Migration Record"}
              </h3>
              <button
                onClick={handleCloseMigrationForm}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleMigrationSave} className="flex-grow overflow-y-auto pr-2 space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Migration Type</label>
                <select
                  value={migrationForm.migrationType}
                  onChange={e => setMigrationForm({ ...migrationForm, migrationType: e.target.value })}
                  className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface"
                >
                  <option value="SEASONAL">Seasonal</option>
                  <option value="PERMANENT">Permanent</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Destination</label>
                <input
                  type="text"
                  required
                  value={migrationForm.destination}
                  onChange={e => setMigrationForm({ ...migrationForm, destination: e.target.value })}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Migration Date</label>
                <input
                  type="date"
                  required
                  value={migrationForm.migrationDate}
                  onChange={e => setMigrationForm({ ...migrationForm, migrationDate: e.target.value })}
                  className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface"
                />
              </div>

              {migrationForm.migrationType === "SEASONAL" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Expected Return Date</label>
                    <input
                      type="date"
                      value={migrationForm.expectedReturnDate}
                      onChange={e => setMigrationForm({ ...migrationForm, expectedReturnDate: e.target.value })}
                      className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Actual Return Date</label>
                    <input
                      type="date"
                      value={migrationForm.actualReturnDate}
                      onChange={e => setMigrationForm({ ...migrationForm, actualReturnDate: e.target.value })}
                      className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Notes</label>
                <textarea
                  rows="3"
                  value={migrationForm.notes}
                  onChange={e => setMigrationForm({ ...migrationForm, notes: e.target.value })}
                  placeholder="Additional details about this migration..."
                  className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface resize-none"
                />
              </div>
            </form>

            <div className="flex justify-end gap-3 border-t border-surface-container-high pt-4 mt-4 text-xs font-sans">
              <button
                type="button"
                onClick={handleCloseMigrationForm}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMigrationSave}
                className="px-5 py-2.5 rounded-full bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer border-none font-bold uppercase tracking-wider shadow-glow"
              >
                {editMigrationId ? "Update Record" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Student Modal */}
      {showLinkStudentModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center border-b border-surface-container-high pb-4 mb-4">
              <h3 className="text-xl font-bold text-on-surface">Link Student to Household</h3>
              <button
                onClick={() => setShowLinkStudentModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Students</label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => handleStudentSearch(e.target.value)}
                  placeholder="Search by name, student ID..."
                  className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface text-sm"
                />
              </div>

              <div className="space-y-2 text-xs">
                {studentSearchLoading ? (
                  <p className="text-center text-on-surface-variant italic py-4">Searching...</p>
                ) : allStudents.length > 0 ? (
                  allStudents.map((student) => {
                    const isAlreadyLinked = beneficiary.students?.some(s => s.id === student.id);
                    return (
                      <div key={student.id} className="p-3 border border-surface-container-highest rounded-lg flex items-center justify-between gap-3 bg-surface-container-low/20">
                        <div>
                          <p className="font-bold text-on-surface text-sm capitalize">{student.name}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            ID: {student.studentId || student.id} {student.grade ? `| Grade: ${student.grade}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => isAlreadyLinked ? handleUnlinkStudent(student.id) : handleLinkStudent(student.id)}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none transition-colors ${
                            isAlreadyLinked
                              ? "bg-error-container/20 text-on-error-container hover:bg-error-container/40"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {isAlreadyLinked ? "Unlink" : "Link"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-on-surface-variant italic py-4">No students found.</p>
                )}
              </div>

              {/* Already Linked Students in this modal for reference */}
              {beneficiary.students && beneficiary.students.length > 0 && (
                <div className="border-t border-surface-container-high pt-4 mt-4">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">Currently Linked Students</h4>
                  <div className="space-y-2">
                    {beneficiary.students.map((student) => (
                      <div key={student.id} className="p-2 border border-surface-container-highest rounded-lg flex items-center justify-between gap-3 bg-surface-container-low/20">
                        <div>
                          <p className="font-semibold text-on-surface text-xs capitalize">{student.name}</p>
                          <p className="text-slate-400 text-[9px]">ID: {student.studentId || student.id}</p>
                        </div>
                        <button
                          onClick={() => handleUnlinkStudent(student.id)}
                          className="px-2.5 py-1 bg-error-container/20 text-on-error-container hover:bg-error-container/40 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer border-none"
                        >
                          Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-surface-container-high pt-4 mt-4 text-xs font-sans">
              <button
                type="button"
                onClick={() => setShowLinkStudentModal(false)}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer border-none text-white"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <img
            src={lightboxPhoto}
            alt="Event evidence"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmActionModal
        isOpen={showConfirmMigrate}
        onClose={() => setShowConfirmMigrate(false)}
        onConfirm={handleToggleMigrated}
        title={beneficiary?.isMigrated ? "Unmark as Migrated" : "Mark as Migrated"}
        message={beneficiary?.isMigrated ? "Are you sure you want to unmark this beneficiary as migrated?" : "Are you sure you want to mark this beneficiary as migrated?"}
        confirmText={beneficiary?.isMigrated ? "Unmark" : "Mark as Migrated"}
        variant="primary"
      />

      <ConfirmActionModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteBeneficiary}
        title="Delete Beneficiary"
        message="Are you sure you want to permanently delete this beneficiary? All associated records (income, family, livestock, surveys) will be removed. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
