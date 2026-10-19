"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import PhotoLightbox from "@/components/PhotoLightbox";
import { useToast } from "@/context/ToastContext";
import { computeCapacityScore, computeCapacityTotalScore, getCapacityMaxScore } from "@/lib/capacityDictionaries";
import { BENEFICIARY_TABS, labelFromSlug, slugFromLabel } from "@/lib/beneficiaryTabs";
import ResilienceSurveyForm from "@/components/ResilienceSurveyForm";
import { formatDate } from "@/lib/date";
import { INDIA_STATES, getDistrictsForState, withCurrentOption, normalizeStateName } from "@/lib/indiaLocations";
import { PRIMARY_INCOME_CATEGORIES, isKnownIncomeCategory } from "@/lib/incomeCategories";
import { useLivelihoodTypes } from "@/lib/useLivelihoodTypes";
import { computeBeneficiaryImpact, formatNumber } from "@/lib/beneficiaryImpact";

const SHOW_TAKE_KYR_BUTTON = false;

export default function BeneficiaryProfileDetail() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <BeneficiaryProfileDetailContent />
    </Suspense>
  );
}

function ImpactProgramCard({ program }) {
  const isFarm = program.category === "FARM";
  const hasMetrics = program.kpis.length > 0 || program.computed.length > 0;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-on-surface text-base">{program.name}</h4>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              isFarm
                ? "bg-primary-fixed text-on-primary-fixed"
                : "bg-secondary-container/20 text-secondary"
            }`}>
              {isFarm ? "Farm" : "Non-Farm"}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {program.typeLabel} · Enrolled {formatDate(program.enrolledAt)}
          </p>
        </div>
        <p className="text-xs text-on-surface-variant shrink-0">
          {program.eventCount} event{program.eventCount === 1 ? "" : "s"}
          {program.lastEventDate ? ` · Last ${formatDate(program.lastEventDate)}` : ""}
        </p>
      </div>

      {program.kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {program.kpis.map((kpi) => (
            <div key={kpi.key} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/10">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
              <p className="text-sm font-bold text-on-surface mt-1 break-words">{kpi.formatted}</p>
            </div>
          ))}
        </div>
      )}

      {program.computed.length > 0 && (
        <div className="space-y-3 mt-4">
          {program.computed.map((metric) => (
            <div key={metric.key}>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{metric.label}</span>
                <span className="text-primary">{metric.formatted}</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasMetrics && (
        <p className="text-xs text-on-surface-variant italic mt-4">
          Program assigned, but no impact values recorded yet. Edit this assignment to add its metrics.
        </p>
      )}

      {program.notes && (
        <p className="text-xs text-on-surface-variant mt-4 border-t border-surface-container-high pt-3">
          {program.notes}
        </p>
      )}
    </div>
  );
}

function BeneficiaryProfileDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { token, isInitializing } = useAuth();
  const { getTypeConfig } = useLivelihoodTypes(token);
  const toast = useToast();
  const activeTab = labelFromSlug(searchParams.get("tab")) || "Program History";
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
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gender, setGender] = useState("");
  const [caste, setCaste] = useState("");
  const [religion, setReligion] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [ward, setWard] = useState("");
  const [village, setVillage] = useState("");
  const [householdSize, setHouseholdSize] = useState(4);
  const [primaryIncomeType, setPrimaryIncomeType] = useState("");
  const [primaryIncomeOther, setPrimaryIncomeOther] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [tier, setTier] = useState("Tier 2");
  
  // ID proofs
  const [aadhar, setAadhar] = useState("");
  const [panCard, setPanCard] = useState("");
  const [voterId, setVoterId] = useState("");
  const [rationCard, setRationCard] = useState("");

  // Bank details
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  // Nested arrays
  const [familyMembers, setFamilyMembers] = useState([]);
  const [livestock, setLivestock] = useState([]);

  // Livelihood programs & assignments
  const [livelihoodPrograms, setLivelihoodPrograms] = useState([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [originalAssignments, setOriginalAssignments] = useState({});
  // Resilience Surveys
  const [surveys, setSurveys] = useState([]);
  const [adaptiveSurveys, setAdaptiveSurveys] = useState([]);
  const [absorptiveSurveys, setAbsorptiveSurveys] = useState([]);
  const [transformativeSurveys, setTransformativeSurveys] = useState([]);
  const [vulnerabilitySurveys, setVulnerabilitySurveys] = useState([]);
  const [solutionPlans, setSolutionPlans] = useState([]);
  const [editingSurvey, setEditingSurvey] = useState(null);

  // Profile photo
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // Resilience score calculation selections (null = use latest submission)
  const [calcSelection, setCalcSelection] = useState({ adaptive: null, absorptive: null, transformative: null });
  const [isCalculatingResilience, setIsCalculatingResilience] = useState(false);

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
        setEmergencyContact(b.emergencyContact || "");
        setGender(b.gender || "");
        setCaste(b.caste || "");
        setReligion(b.religion || "");
        setAddress(b.address || "");
        setLandmark(b.landmark || "");
        setStateName(normalizeStateName(b.state || ""));
        setDistrict(b.district || "");
        setBlock(b.block || "");
        setWard(b.ward || "");
        setVillage(b.village || "");
        setHouseholdSize(b.householdSize || 4);
        const loadedIncomeType = b.primaryIncomeType || "";
        if (loadedIncomeType && !isKnownIncomeCategory(loadedIncomeType)) {
          setPrimaryIncomeType("Other");
          setPrimaryIncomeOther(loadedIncomeType);
        } else {
          setPrimaryIncomeType(loadedIncomeType);
          setPrimaryIncomeOther("");
        }
        setMonthlyIncome(b.monthlyIncome ?? "");
        setTier(b.tier || "Tier 2");

        setAadhar(b.aadhar || "");
        setPanCard(b.panCard || "");
        setVoterId(b.voterId || "");
        setRationCard(b.rationCard || "");

        setBankName(b.bankName || "");
        setBankAccountNo(b.bankAccountNo || "");
        setBankIfsc(b.bankIfsc || "");

        const assignments = {};
        (b.livelihoodDetails || []).forEach((d) => {
          if (d.programId) assignments[d.programId] = d.id;
        });
        setOriginalAssignments(assignments);
        setSelectedProgramIds(Object.keys(assignments));

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

        // Fetch livelihood programs (for program assignment)
        const programsRes = await fetch("/api/livelihood/programs", { headers });
        if (programsRes.ok) {
          const programsData = await programsRes.json();
          if (programsData.success) {
            setLivelihoodPrograms(programsData.data.programs || []);
          }
        }
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

  const handleCalculateResilience = async () => {
    if (resilienceScoreComputed === null) {
      toast.error("All three capacity surveys (Adaptive, Absorptive, Transformative) are required to calculate the resilience score.");
      return;
    }
    setIsCalculatingResilience(true);
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resilienceScore: resilienceScoreComputed }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Resilience score calculated and saved as ${resilienceScoreComputed}.`);
        loadBeneficiaryDetail();
      } else {
        alert(json.error || "Failed to save resilience score");
      }
    } catch (err) {
      console.error("Calculate resilience error:", err);
      toast.error("Failed to calculate resilience score.");
    } finally {
      setIsCalculatingResilience(false);
    }
  };

  const handleUpdateSurvey = async ({ responses, scores }) => {
    if (!editingSurvey) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/beneficiaries/${id}/resilience-surveys/${editingSurvey.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ responses, scores }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("KYR form updated successfully.");
        setEditingSurvey(null);
        const refreshRes = await fetch(`/api/beneficiaries/${id}/resilience-surveys`, { headers });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.success) setSurveys(data.data);
        }
      } else {
        toast.error(json.error || "Failed to update KYR form.");
      }
    } catch (err) {
      console.error("Update survey error:", err);
      toast.error("Failed to update KYR form.");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`/api/beneficiaries/${beneficiary?.id || id}/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Profile photo updated.");
        loadBeneficiaryDetail();
      } else {
        toast.error(json.error || "Failed to upload photo.");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const resolvedIncomeType =
        primaryIncomeType === "Other"
          ? primaryIncomeOther.trim() || "Other"
          : primaryIncomeType;
      const monthlyIncomeValue = monthlyIncome !== "" ? parseFloat(monthlyIncome) : null;

      const payload = {
        name,
        dob: dob || null,
        mobNumber,
        emergencyContact,
        gender,
        caste,
        religion,
        address:
          [village, landmark, ward, block, district, stateName]
            .map((s) => (s || "").trim())
            .filter(Boolean)
            .join(", ") || address,
        landmark,
        state: stateName,
        district,
        block,
        ward,
        village,
        householdSize: parseInt(householdSize),
        primaryIncomeType: resolvedIncomeType || null,
        annualIncome: monthlyIncomeValue !== null ? monthlyIncomeValue * 12 : null,
        monthlyIncome: monthlyIncomeValue,
        tier,
        aadhar,
        panCard,
        voterId,
        rationCard,
        bankName,
        bankAccountNo,
        bankIfsc,
        familyMembers: familyMembers.filter(m => m.name.trim() !== ""),
        livestock: livestock.filter(l => (l.animalType || "").trim() !== ""),
        // Detailed assignments are applied separately below
      };

      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        // Apply livelihood program assignment changes
        const toAdd = selectedProgramIds.filter((programId) => !originalAssignments[programId]);
        const toRemove = Object.entries(originalAssignments).filter(
          ([programId]) => !selectedProgramIds.includes(programId)
        );

        for (const programId of toAdd) {
          await fetch(`/api/livelihood/programs/${programId}/assignments`, {
            method: "POST",
            headers,
            body: JSON.stringify({ beneficiaryId: beneficiary.id, attributes: {} })
          });
        }
        for (const [programId, assignId] of toRemove) {
          await fetch(`/api/livelihood/programs/${programId}/assignments/${assignId}`, {
            method: "DELETE",
            headers
          });
        }

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

  const resolveSelection = (list, selectedId) => {
    return (selectedId && list.find(s => s.id === selectedId)) || list[0] || null;
  };

  const adaptiveSelection = resolveSelection(adaptiveSurveys, calcSelection.adaptive);
  const absorptiveSelection = resolveSelection(absorptiveSurveys, calcSelection.absorptive);
  const transformativeSelection = resolveSelection(transformativeSurveys, calcSelection.transformative);

  const adaptivePct = adaptiveSelection ? computeCapacityScore('adaptive', adaptiveSelection.responses) : null;
  const absorptivePct = absorptiveSelection ? computeCapacityScore('absorptive', absorptiveSelection.responses) : null;
  const transformativePct = transformativeSelection ? computeCapacityScore('transformative', transformativeSelection.responses) : null;

  const resilienceScoreComputed = (adaptivePct !== null && absorptivePct !== null && transformativePct !== null)
    ? Math.round((adaptivePct + absorptivePct + transformativePct) / 3)
    : null;

  const missingCapacityTypes = [];
  if (!adaptiveSelection) missingCapacityTypes.push("Adaptive Capacity");
  if (!absorptiveSelection) missingCapacityTypes.push("Absorptive Capacity");
  if (!transformativeSelection) missingCapacityTypes.push("Transformative Capacity");

  const score = resilienceScoreComputed;
  const strokeDashoffset = score !== null ? 251.2 - (score / 100) * 251.2 : 251.2;

  // Basic-detail fields that must be locked (read-only) in the KYR form.
  const getProfileKyrFields = () => {
    const pairs = [
      ["B.3", beneficiary.state],
      ["B.4", beneficiary.district],
      ["B.5", beneficiary.block],
      ["B.6", beneficiary.ward],
      ["B.7", beneficiary.village],
      ["B.8", beneficiary.name],
      ["B.9", beneficiary.gender],
      ["B.10", beneficiary.householdSize != null ? String(beneficiary.householdSize) : ""],
      ["B.14", beneficiary.primaryIncomeType],
      ["B.16_Min", beneficiary.monthlyIncome != null ? String(beneficiary.monthlyIncome) : ""],
      ["B.16_Max", beneficiary.monthlyIncome != null ? String(beneficiary.monthlyIncome) : ""],
      ["B.18", beneficiary.caste],
    ];
    const prefill = {};
    const locks = [];
    pairs.forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        prefill[key] = value;
      }
    });
    pairs.forEach(([key, value]) => {
      if (key === "B.16_Min" || key === "B.16_Max") return;
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        locks.push(key);
      }
    });
    if (prefill["B.16_Min"]) locks.push("B.16");
    return { prefill, locks };
  };
  const kyrProfileFields = getProfileKyrFields();

  const impact = computeBeneficiaryImpact(beneficiary, getTypeConfig);
  const recordedCapacityCount = 3 - missingCapacityTypes.length;
  const farmImpactSummary = [
    impact.farmSummary.totalLand !== null
      ? `${formatNumber(impact.farmSummary.totalLand)} Ha total land`
      : null,
    impact.farmSummary.yieldEfficiency !== null
      ? `${impact.farmSummary.yieldEfficiency}% yield efficiency`
      : null,
    impact.farmSummary.revenueAchievement !== null
      ? `${impact.farmSummary.revenueAchievement}% revenue achievement`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const nonFarmImpactSummary = [
    impact.nonFarmSummary.totalInvestment !== null
      ? `₹${formatNumber(impact.nonFarmSummary.totalInvestment)} invested`
      : null,
    impact.nonFarmSummary.totalReturns !== null
      ? `₹${formatNumber(impact.nonFarmSummary.totalReturns)} returns`
      : null,
    impact.nonFarmSummary.portfolioRoi !== null
      ? `${impact.nonFarmSummary.portfolioRoi}% ROI`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const calculateAge = (dateString) => {
    if (!dateString) return "N/A";
    const birthday = new Date(dateString);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " Years";
  };

  const editStateOptions = withCurrentOption(INDIA_STATES.map((state) => state.name), stateName);
  const editDistrictOptions = withCurrentOption(getDistrictsForState(stateName), district);
  const parsedMonthlyIncome = parseFloat(monthlyIncome);
  const editAnnualIncome = Number.isFinite(parsedMonthlyIncome) ? parsedMonthlyIncome * 12 : "";

  const programCount =
    beneficiary.livelihoodDetails?.length || beneficiary.schemeEnrollments?.length || 0;
  const profileAddress =
    beneficiary.address ||
    [beneficiary.village, beneficiary.block, beneficiary.district, normalizeStateName(beneficiary.state)]
      .filter(Boolean)
      .join(", ") ||
    "Not provided";
  const locationLabel =
    beneficiary.village ||
    beneficiary.block ||
    beneficiary.district ||
    beneficiary.state ||
    beneficiary.address ||
    "";
  const locationSuffix = locationLabel ? ` from ${locationLabel}` : "";
  const profileDescription =
    programCount > 0
      ? `Rural development and livelihood beneficiary${locationSuffix}. Enrolled in ${programCount} micro-development program${programCount === 1 ? "" : "s"}.`
      : `Rural development and livelihood beneficiary${locationSuffix}, registered in the livelihood master registry.`;
  const profileAnnualIncome =
    beneficiary.monthlyIncome != null
      ? beneficiary.monthlyIncome * 12
      : beneficiary.annualIncome;

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full">
      {/* Back link */}
      <Link
        href="/beneficiaries"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
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
          <h1 className="page-title text-on-surface">
            Beneficiary Profile File
          </h1>
        </div>
        <div className="flex gap-3 font-sans flex-wrap">
          <button
            onClick={() => setShowConfirmMigrate(true)}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-body-md font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">
              {beneficiary.isMigrated ? "undo" : "moving"}
            </span>
            {beneficiary.isMigrated ? "Unmark Migrated" : "Mark Migrated"}
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-body-md font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
          <button className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-body-md font-medium shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer border-none">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="bg-error-container text-on-error-container px-4 py-2 rounded-full text-body-md font-medium hover:bg-error-container/80 transition-colors flex items-center gap-2 cursor-pointer border border-error/20"
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
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-surface shadow-md bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl">
                {beneficiary.photoUrl ? (
                  <img
                    src={beneficiary.photoUrl}
                    alt={beneficiary.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxPhoto(beneficiary.photoUrl)}
                  />
                ) : (
                  beneficiary.name.split(" ").map((n) => n[0]).join("")
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                title={beneficiary.photoUrl ? "Replace photo" : "Add photo"}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md border border-surface cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {uploadingPhoto ? "hourglass_top" : "photo_camera"}
                </span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
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
                {profileDescription}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 font-sans text-sm">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Location</p>
                  <p className="text-on-surface font-bold">{profileAddress}</p>
                </div>
                {beneficiary.landmark && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Nearby Landmark</p>
                    <p className="text-on-surface font-bold">{beneficiary.landmark}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Mobile Number</p>
                  <p className="text-on-surface font-bold">{beneficiary.mobNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">DOB / Age</p>
                  <p className="text-on-surface font-bold">
                    {formatDate(beneficiary.dob, "N/A")} ({calculateAge(beneficiary.dob)})
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
                  <p className="font-bold text-on-surface">{beneficiary.tier}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Emergency Contact</p>
                  <p className="font-bold text-on-surface">{beneficiary.emergencyContact || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Primary Income Category</p>
                  <p className="text-on-surface font-bold">{beneficiary.primaryIncomeType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Annual Income</p>
                  <p className="text-on-surface font-bold">{profileAnnualIncome ? `₹${profileAnnualIncome.toLocaleString()}` : "N/A"}</p>
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
              <span className="stat-value text-on-surface">
                {score !== null ? score : "N/A"}
              </span>
              {score !== null && (
                <span className="text-xs text-on-surface-variant font-medium uppercase tracking-widest mt-1">
                  / 100
                </span>
              )}
            </div>
          </div>
          {score !== null ? (
            <div className="mt-6 flex items-center gap-2 text-primary bg-primary-container/10 px-3 py-1.5 rounded-full relative z-10 font-sans">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="text-xs font-bold uppercase tracking-wider">Updated Realtime</span>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-2 text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full relative z-10 font-sans">
              <span className="material-symbols-outlined text-[16px]">pending</span>
              <span className="text-xs font-bold uppercase tracking-wider">Not calculated yet</span>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="lg:col-span-12 mt-4 mb-2 border-b border-surface-container-highest flex overflow-x-auto no-scrollbar font-sans">
          {BENEFICIARY_TABS.map(({ label: tab }) => {
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
                onClick={() => router.replace(`/beneficiaries/${id}?tab=${slugFromLabel(tab)}`, { scroll: false })}
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
                  <p>Program enrollment history is generated dynamically from the beneficiary&apos;s database linkage. You can assign or remove programs by clicking <strong>Edit Profile</strong> above and opening the <strong>Programs</strong> tab.</p>
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
                                Enrolled {formatDate(detail.enrolledAt)}
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
                                      <span className="text-on-surface-variant">{formatDate(evt.eventDate)}</span>
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

          {activeTab === "KYR Form" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-primary font-bold">assignment</span>
                    KYR Form
                  </h3>
                  <p className="text-sm text-on-surface-variant font-sans mt-1">
                    Assess the family's capacity to absorb, adapt and transform.
                  </p>
                </div>
                {/* Set SHOW_TAKE_KYR_BUTTON to true to re-enable the survey entry point. */}
                {SHOW_TAKE_KYR_BUTTON && (
                  <Link
                    href={`/beneficiaries/${id}/kyr-survey`}
                    className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Take KYR Form
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                {surveys && surveys.length > 0 ? (
                  surveys.map((survey) => (
                    <div key={survey.id} className="p-4 border border-surface-container-highest rounded-lg bg-surface-container-low/20 flex flex-col gap-4 font-sans">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <p className="font-bold text-on-surface">Survey Date: {formatDate(survey.surveyDate)}</p>
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
                      
                      <div className="pt-4 border-t border-surface-container-highest flex flex-wrap items-center gap-4">
                        <Link href={`/beneficiaries/${id}/responses/kyr/${survey.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Full Response
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditingSurvey(survey)}
                          className="text-secondary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit border-none bg-transparent cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </button>
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
                  className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
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
                          <p className="font-bold text-on-surface">Survey Date: {formatDate(survey.surveyDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Score: <span className="font-bold text-primary">{computeCapacityTotalScore('adaptive', survey.responses)?.toFixed(2)}</span> / {getCapacityMaxScore('adaptive')}
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
                  className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
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
                          <p className="font-bold text-on-surface">Survey Date: {formatDate(survey.surveyDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Score: <span className="font-bold text-primary">{computeCapacityTotalScore('absorptive', survey.responses)?.toFixed(2)}</span> / {getCapacityMaxScore('absorptive')}
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
                  className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
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
                          <p className="font-bold text-on-surface">Survey Date: {formatDate(survey.surveyDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface-variant">
                            Score: <span className="font-bold text-primary">{computeCapacityTotalScore('transformative', survey.responses)?.toFixed(2)}</span> / {getCapacityMaxScore('transformative')}
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
                  className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
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
                          <p className="font-bold text-on-surface">Survey Date: {formatDate(survey.surveyDate)}</p>
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
                    className="w-full bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-2 rounded-full text-sm font-semibold hover:bg-surface-container-highest/80 transition-colors flex items-center justify-center gap-2 text-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    View Reference Board
                  </Link>
                  <Link
                    href={`/beneficiaries/${id}/solution-plan`}
                    className="w-full gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-glow text-center"
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
                              Plan Date: {formatDate(plan.createdAt)}
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
                        <div className="mt-4 pt-4 border-t border-surface-container-highest flex items-center gap-4 flex-wrap">
                          <Link href={`/beneficiaries/${id}/responses/solution-plan/${plan.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            View Full Plan
                          </Link>
                          <Link href={`/beneficiaries/${id}/solution-plan?planId=${plan.id}`} className="text-primary hover:underline text-xs font-bold outline-none flex items-center gap-1 w-fit">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Edit Plan
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
                  className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
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
                            <p className="text-on-surface font-medium">{formatDate(record.incomeDate, "N/A")}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Recorded On</p>
                            <p className="text-on-surface font-medium">{formatDate(record.createdAt)}</p>
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
                  className="gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-glow whitespace-nowrap"
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
                            <p className="text-on-surface font-medium">{formatDate(record.migrationDate, "N/A")}</p>
                          </div>
                          {record.expectedReturnDate && (
                            <div>
                              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Expected Return</p>
                              <p className="text-on-surface font-medium">{formatDate(record.expectedReturnDate)}</p>
                            </div>
                          )}
                          {record.actualReturnDate && (
                            <div>
                              <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Actual Return</p>
                              <p className="text-on-surface font-medium">{formatDate(record.actualReturnDate)}</p>
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
                            {m.dob ? `${calculateAge(m.dob)} (${formatDate(m.dob)})` : "N/A"}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Voter ID</p>
                  <p className="font-bold text-sm text-on-surface mt-1 font-mono tracking-wide uppercase">
                    {beneficiary.voterId ? beneficiary.voterId : "Not Provided"}
                  </p>
                  <span className={`inline-block mt-3 px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                    beneficiary.voterId ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                  }`}>
                    {beneficiary.voterId ? "Verified" : "Missing"}
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
            <div className="space-y-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 font-sans">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-primary font-bold">insights</span>
                  Household Socio-Economic Impact Summary
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mt-2">
                  Calculated from this beneficiary&apos;s active Farm and Non-Farm program assignments, recorded program values, and capacity surveys.
                </p>

                <div className="mt-4 bg-secondary-container/10 border border-secondary/20 rounded-xl p-4 text-xs text-on-surface-variant flex gap-3 items-start leading-relaxed">
                  <span className="material-symbols-outlined text-secondary shrink-0">info</span>
                  <div>
                    <p className="font-bold text-secondary mb-1">How these metrics are calculated</p>
                    <p>Farm metrics use land, yield, and revenue values. Non-Farm metrics use investment, returns, and ROI values. Resilience comes from the latest Adaptive, Absorptive, and Transformative surveys.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="px-2.5 py-1 rounded-full bg-primary-container/10 text-primary">
                    {impact.programs.length} {impact.usingLegacy ? "legacy record" : "active program"}
                    {impact.programs.length === 1 ? "" : "s"}
                  </span>
                  {impact.farmPrograms.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed">
                      {impact.farmPrograms.length} Farm
                    </span>
                  )}
                  {impact.nonFarmPrograms.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary">
                      {impact.nonFarmPrograms.length} Non-Farm
                    </span>
                  )}
                  {impact.totalEvents > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                      {impact.totalEvents} event{impact.totalEvents === 1 ? "" : "s"}
                    </span>
                  )}
                  {impact.lastEventDate && (
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                      Last activity {formatDate(impact.lastEventDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">monitor_heart</span>
                      Resilience Index
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">Composite of the latest capacity surveys.</p>
                  </div>
                  <div className="text-right">
                    {score !== null ? (
                      <>
                        <span className="text-3xl font-bold text-primary tracking-tight">{score}</span>
                        <span className="text-xs text-on-surface-variant font-medium"> / 100</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-on-surface-variant">Not calculated</span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-4">
                  {score !== null && (
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                  )}
                </div>

                <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                  {score !== null
                    ? "Based on the latest Adaptive, Absorptive, and Transformative surveys."
                    : `Complete all three capacity surveys to calculate this score. ${recordedCapacityCount} of 3 recorded${missingCapacityTypes.length > 0 ? ` — missing ${missingCapacityTypes.join(", ")}` : ""}.`}
                </p>
              </div>

              {impact.usingLegacy && (
                <div className="bg-surface-container-high/40 border border-outline-variant/20 rounded-xl p-4 text-xs text-on-surface-variant font-sans leading-relaxed">
                  Showing legacy Goat Rearing/Sugarcane records. New assignments are tracked under Farm and Non-Farm programs.
                </div>
              )}

              {impact.farmPrograms.length > 0 && (
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-headline">
                        <span className="material-symbols-outlined text-primary">agriculture</span>
                        Farm Programs
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {impact.farmPrograms.length} program{impact.farmPrograms.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {farmImpactSummary && (
                      <p className="text-xs font-semibold text-on-surface-variant">{farmImpactSummary}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {impact.farmPrograms.map((program) => (
                      <ImpactProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                </section>
              )}

              {impact.nonFarmPrograms.length > 0 && (
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-headline">
                        <span className="material-symbols-outlined text-secondary">pets</span>
                        Non-Farm Programs
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {impact.nonFarmPrograms.length} program{impact.nonFarmPrograms.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {nonFarmImpactSummary && (
                      <p className="text-xs font-semibold text-on-surface-variant">{nonFarmImpactSummary}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {impact.nonFarmPrograms.map((program) => (
                      <ImpactProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                </section>
              )}

              {impact.programs.length === 0 && (
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient border border-dashed border-outline-variant/30 text-center font-sans">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">insights</span>
                  <p className="font-bold text-on-surface mt-2">No livelihood programs assigned yet</p>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
                    Enroll this beneficiary from a Farm or Non-Farm program page to start tracking real impact metrics.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secondary Info Sidepanel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Resilience Score (KYR) - always visible */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="text-xs uppercase tracking-widest text-on-surface-variant mb-4 font-sans font-bold">
              Resilience Score (KYR)
            </h3>

            <div className="flex items-center justify-between mb-3 font-sans">
              <div>
                <p className="text-sm font-semibold text-on-surface">Composite Score</p>
                <p className="text-[10px] text-on-surface-variant">Average of 3 capacity scores</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary tracking-tight">{resilienceScoreComputed ?? "N/A"}</span>
                <span className="text-xs text-on-surface-variant font-medium"> / 100</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mb-5">
              {resilienceScoreComputed !== null && (
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, resilienceScoreComputed))}%` }}
                />
              )}
            </div>

            <div className="space-y-3 text-sm font-sans">
              {[
                { label: "Adaptive", key: 'adaptive', pct: adaptivePct, sel: adaptiveSelection, list: adaptiveSurveys },
                { label: "Absorptive", key: 'absorptive', pct: absorptivePct, sel: absorptiveSelection, list: absorptiveSurveys },
                { label: "Transformative", key: 'transformative', pct: transformativePct, sel: transformativeSelection, list: transformativeSurveys },
              ].map((item) => (
                <div key={item.key} className="p-3 bg-surface rounded-lg border border-outline-variant/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-on-surface">{item.label} Capacity</span>
                    <span className={`font-bold ${item.pct !== null ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {item.pct !== null ? `${item.pct}%` : "N/A"}
                    </span>
                  </div>
                  <select
                    value={item.sel?.id || ""}
                    onChange={(e) => setCalcSelection(prev => ({ ...prev, [item.key]: e.target.value || null }))}
                    disabled={item.list.length === 0}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {item.list.length === 0 && <option value="">No submissions</option>}
                    {item.list.map(s => (
                      <option key={s.id} value={s.id}>
                        {formatDate(s.surveyDate)} — {computeCapacityScore(item.key, s.responses)}%
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {missingCapacityTypes.length > 0 && (
              <div className="mt-4 p-3 bg-error-container/10 border border-error/20 rounded-lg text-xs text-on-surface-variant font-sans">
                <p className="font-bold text-error mb-1">Cannot calculate resilience score</p>
                <p>Missing submissions: {missingCapacityTypes.join(", ")}. Take these surveys first.</p>
              </div>
            )}

            <button
              onClick={handleCalculateResilience}
              disabled={resilienceScoreComputed === null || isCalculatingResilience}
              className="mt-4 w-full gradient-primary bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">calculate</span>
              {isCalculatingResilience ? "Calculating..." : "Calculate & Save Resilience Score"}
            </button>
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
                { key: "Programs", label: "Programs" }
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
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface">
                      <option value="">— Select —</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Don't want to respond">Don&apos;t want to respond</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Mobile Number</label>
                    <input type="text" value={mobNumber} onChange={e => setMobNumber(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Emergency Contact Number</label>
                    <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
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
                    <select value={primaryIncomeType} onChange={e => setPrimaryIncomeType(e.target.value)} className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface">
                      <option value="">— Select —</option>
                      {PRIMARY_INCOME_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  {primaryIncomeType === "Other" && (
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Specify Income Category</label>
                      <input type="text" placeholder="e.g. Fishing, Pension" value={primaryIncomeOther} onChange={e => setPrimaryIncomeOther(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Monthly Income (₹)</label>
                    <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Annual Income (₹) — Auto-calculated</label>
                    <input type="number" readOnly tabIndex={-1} value={editAnnualIncome} placeholder="Calculated from monthly income" className="px-3 py-2 border rounded bg-surface-container/50 border-outline-variant text-on-surface cursor-not-allowed" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Household Size</label>
                    <input type="number" value={householdSize} onChange={e => setHouseholdSize(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Socio-Economic Tier</label>
                    <select value={tier} onChange={e => setTier(e.target.value)} className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface">
                      <option value="Tier 1">Tier 1 (Lowest Income)</option>
                      <option value="Tier 2">Tier 2 (Marginal Income)</option>
                      <option value="Tier 3">Tier 3 (Developing)</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className="font-semibold uppercase tracking-wider text-slate-400">Address / Location</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                      <select
                        value={stateName}
                        onChange={e => {
                          setStateName(e.target.value);
                          setDistrict("");
                        }}
                        className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface"
                      >
                        <option value="">— Select State —</option>
                        {editStateOptions.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <select
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                        disabled={!stateName}
                        className="px-3 py-2 border rounded bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface disabled:opacity-60"
                      >
                        <option value="">{stateName ? "— Select District —" : "Select state first"}</option>
                        {editDistrictOptions.map((districtName) => (
                          <option key={districtName} value={districtName}>{districtName}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Block" value={block} onChange={e => setBlock(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                      <input type="text" placeholder="Ward / GP" value={ward} onChange={e => setWard(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                      <input type="text" placeholder="Village" value={village} onChange={e => setVillage(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                      <input type="text" placeholder="Nearby Landmark" value={landmark} onChange={e => setLandmark(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                  </div>
                </div>
              )}

              {editTab === "IDBank" && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wide">Identity Proofs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Aadhar Number</label>
                      <input type="text" placeholder="1234 5678 9012" value={aadhar} onChange={e => setAadhar(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">PAN Card</label>
                      <input type="text" placeholder="ABCDE1234F" value={panCard} onChange={e => setPanCard(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold uppercase tracking-wider text-slate-400">Voter ID</label>
                      <input type="text" placeholder="ABC1234567" value={voterId} onChange={e => setVoterId(e.target.value)} className="px-3 py-2 border rounded bg-transparent border-outline-variant text-on-surface" />
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
                        <div className="w-48 flex flex-col gap-1">
                          <label className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">Animal ID (Auto-generated)</label>
                          <div className="px-2 py-1.5 border rounded bg-surface-container/50 border-outline-variant text-on-surface text-xs font-mono flex items-center min-h-[34px]">
                            {l.tagNumber || "Generated on save"}
                          </div>
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

              {editTab === "Programs" && (
                <div className="space-y-6 text-xs">
                  {["FARM", "NON_FARM"].map((category) => {
                    const label = category === "FARM" ? "Farm Programs" : "Non-Farm Programs";
                    const programs = livelihoodPrograms.filter((p) => p.category === category);
                    if (programs.length === 0) return null;
                    return (
                      <div key={category} className="p-4 border border-outline-variant/10 bg-surface-container-low/20 rounded-xl space-y-3">
                        <h4 className="font-bold text-sm text-on-surface uppercase tracking-wide">{label}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {programs.map((p) => {
                            const checked = selectedProgramIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProgramIds((prev) => [...prev, p.id]);
                                    } else {
                                      setSelectedProgramIds((prev) => prev.filter((pid) => pid !== p.id));
                                    }
                                  }}
                                  className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                                />
                                <span>{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {livelihoodPrograms.length === 0 && (
                    <p className="text-center text-on-surface-variant italic">No livelihood programs available.</p>
                  )}

                  <p className="text-sm text-on-surface-variant italic p-4 bg-surface-container-low/20 rounded-xl border border-outline-variant/10">
                    Program assignments are applied when you click &quot;Save Profile Updates&quot;.
                  </p>
                </div>
              )}

            </form>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-surface-container-high pt-4 mt-4 text-xs font-sans">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProfile}
                className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer border-none font-bold uppercase tracking-wider shadow-glow"
              >
                Save Profile Updates
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit KYR Survey Modal */}
      {editingSurvey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-surface-container pb-4">
              <div>
                <h3 className="text-xl font-bold">Edit Submitted KYR Form</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Update the responses submitted on {formatDate(editingSurvey.surveyDate)}.
                </p>
              </div>
              <button
                onClick={() => setEditingSurvey(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <ResilienceSurveyForm
              key={editingSurvey.id}
              mode="embedded"
              prefill={{ ...(editingSurvey.responses || {}), ...kyrProfileFields.prefill }}
              lockQuestionIds={kyrProfileFields.locks}
              submitLabel="Update Survey"
              title="Edit KYR Form"
              onBack={() => setEditingSurvey(null)}
              onSubmit={handleUpdateSurvey}
            />
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
                className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIncomeSave}
                className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer border-none font-bold uppercase tracking-wider shadow-glow"
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
                className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMigrationSave}
                className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer border-none font-bold uppercase tracking-wider shadow-glow"
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
                className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-50 transition-colors cursor-pointer font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox src={lightboxPhoto} alt="Beneficiary photo" onClose={() => setLightboxPhoto(null)} />

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
