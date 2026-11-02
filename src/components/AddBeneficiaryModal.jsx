"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import ResilienceSurveyForm from "@/components/ResilienceSurveyForm";
import DateInput from "@/components/ui/DateInput";
import useBodyScrollLock from "@/lib/useBodyScrollLock";
import { INDIA_STATES, getDistrictsForState, withCurrentOption } from "@/lib/indiaLocations";
import { PRIMARY_INCOME_CATEGORIES, DEFAULT_PRIMARY_INCOME } from "@/lib/incomeCategories";
import {
  validateRequired,
  validateMobile,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateRationCard,
  validateBankAccount,
  validateIfsc,
  validatePersonName,
  validateDateNotFuture,
  validateAmount,
  validateInteger,
  toMobileInput,
  toAadhaarInput,
  toPanInput,
  toVoterIdInput,
  toRationCardInput,
  toBankAccountInput,
  toIfscInput,
  toPersonNameInput,
} from "@/lib/validation";

export const emptyAddForm = {
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
  landmark: "",
  primaryIncomeType: DEFAULT_PRIMARY_INCOME,
  primaryIncomeOther: "",
  monthlyIncome: "",
  householdSize: "4",
  emergencyContact: "",
  tier: "Tier 2",
  aadhar: "",
  panCard: "",
  voterId: "",
  rationCard: "",
  bankName: "",
  bankAccountNo: "",
  bankIfsc: "",
  programId: "",
};

function RequiredLabel({ children }) {
  return (
    <>
      {children}
      <span className="text-error"> *</span>
    </>
  );
}

export default function AddBeneficiaryModal({
  onClose,
  onCreated,
  studentId = null,
  allPrograms = false,
  title,
}) {
  const { token } = useAuth();
  const heading = title || (studentId ? "Add Parents Details" : "Add New Beneficiary");
  const toast = useToast();

  // Keep the page behind the modal from scrolling while it is open.
  useBodyScrollLock(true);

  const [step, setStep] = useState("details");
  const [form, setForm] = useState(emptyAddForm);
  const [errors, setErrors] = useState({});
  const [livelihoodPrograms, setLivelihoodPrograms] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/livelihood/programs${allPrograms ? "?all=true" : ""}`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) {
          setLivelihoodPrograms(json.data.programs || []);
        }
      })
      .catch((err) => console.error("Failed to load livelihood programs:", err));

    return () => {
      cancelled = true;
    };
  }, [token, allPrograms]);

  const farmPrograms = livelihoodPrograms.filter((p) => p.category === "FARM");
  const nonFarmPrograms = livelihoodPrograms.filter((p) => p.category === "NON_FARM");

  const stateOptions = withCurrentOption(INDIA_STATES.map((state) => state.name), form.state);
  const districtOptions = withCurrentOption(getDistrictsForState(form.state), form.district);
  const parsedMonthlyIncome = parseFloat(form.monthlyIncome);
  const annualIncome = Number.isFinite(parsedMonthlyIncome) ? parsedMonthlyIncome * 12 : "";

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = () => {
    const validationErrors = {};

    const nameError = validatePersonName(form.name, { required: true });
    if (nameError) validationErrors.name = nameError;

    const dobError = validateDateNotFuture(form.dob, {
      required: true,
      label: "Date of birth",
    });
    if (dobError) validationErrors.dob = dobError;

    const requiredFields = [
      ["gender", "Gender"],
      ["caste", "Caste"],
      ["religion", "Religion"],
      ["state", "State"],
      ["district", "District"],
      ["block", "Block"],
      ["ward", "Ward / GP"],
      ["village", "Village"],
      ["landmark", "Nearby landmark"],
      ["primaryIncomeType", "Primary income category"],
      ["tier", "Socio-economic tier"],
      ["bankName", "Bank name"],
      ["programId", "Livelihood program"],
    ];

    for (const [key, label] of requiredFields) {
      const message = validateRequired(form[key], label);
      if (message) validationErrors[key] = message;
    }

    if (form.primaryIncomeType === "Other") {
      const otherIncomeError = validateRequired(form.primaryIncomeOther, "Income category");
      if (otherIncomeError) validationErrors.primaryIncomeOther = otherIncomeError;
    }

    const validators = [
      ["mobNumber", validateMobile(form.mobNumber, { required: true })],
      ["emergencyContact", validateMobile(form.emergencyContact, { required: true })],
      ["aadhar", validateAadhaar(form.aadhar, { required: true })],
      ["panCard", validatePan(form.panCard, { required: true })],
      ["voterId", validateVoterId(form.voterId, { required: true })],
      ["rationCard", validateRationCard(form.rationCard, { required: true })],
      ["bankAccountNo", validateBankAccount(form.bankAccountNo, { required: true })],
      ["bankIfsc", validateIfsc(form.bankIfsc, { required: true })],
      ["monthlyIncome", validateAmount(form.monthlyIncome, { required: true, min: 0 })],
      ["householdSize", validateInteger(form.householdSize, { required: true, min: 1, max: 20 })],
    ];

    for (const [key, message] of validators) {
      if (message) validationErrors[key] = message;
    }

    return validationErrors;
  };

  const showErrors = (nextErrors) => {
    setErrors(nextErrors);
    requestAnimationFrame(() => {
      document
        .querySelector("[data-add-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleNext = (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      showErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep("kyr");
  };

  const createBeneficiary = async (surveyPayload) => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      showErrors(validationErrors);
      setStep("details");
      return;
    }
    setErrors({});

    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const enrolmentId = `BEN-${randomNum}-${randomLetter}`;

      const composedAddress =
        [form.village, form.landmark, form.ward, form.block, form.district, form.state]
          .map((value) => (value || "").trim())
          .filter(Boolean)
          .join(", ") || null;

      const resolvedIncomeType =
        form.primaryIncomeType === "Other"
          ? form.primaryIncomeOther.trim() || "Other"
          : form.primaryIncomeType;
      const monthlyIncomeValue = form.monthlyIncome !== "" ? parseFloat(form.monthlyIncome) : null;

      const res = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          enrolmentId,
          name: form.name.trim(),
          gender: form.gender || null,
          dob: form.dob || null,
          mobNumber: form.mobNumber || null,
          emergencyContact: form.emergencyContact || null,
          caste: form.caste || null,
          religion: form.religion || null,
          address: composedAddress,
          landmark: form.landmark || null,
          state: form.state || null,
          district: form.district || null,
          block: form.block || null,
          ward: form.ward || null,
          village: form.village || null,
          householdSize: form.householdSize ? parseInt(form.householdSize) : 4,
          primaryIncomeType: resolvedIncomeType || null,
          annualIncome: monthlyIncomeValue !== null ? monthlyIncomeValue * 12 : null,
          monthlyIncome: monthlyIncomeValue,
          tier: form.tier,
          aadhar: form.aadhar || null,
          panCard: form.panCard || null,
          voterId: form.voterId || null,
          rationCard: form.rationCard || null,
          bankName: form.bankName || null,
          bankAccountNo: form.bankAccountNo || null,
          bankIfsc: form.bankIfsc || null,
          programId: form.programId,
          ...(studentId ? { studentId } : {}),
          ...(studentId && surveyPayload ? { resilienceSurvey: surveyPayload } : {}),
        }),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Failed to register beneficiary");
        return;
      }

      if (surveyPayload && !studentId) {
        // Keep the existing beneficiary-directory flow: create, then save the KYR form.
        const surveyRes = await fetch(`/api/beneficiaries/${json.data.id}/resilience-surveys`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(surveyPayload),
        });
        const surveyJson = await surveyRes.json();

        if (surveyJson.success) {
          toast.success(`Registered new beneficiary: ${form.name.trim()}`);
        } else {
          toast.error("Beneficiary created, but KYR form could not be saved.");
        }
      } else if (surveyPayload) {
        toast.success(`Registered new beneficiary: ${form.name.trim()}`);
      } else {
        toast.success(
          studentId
            ? `${form.name.trim()} saved and linked to the student. The KYR form can be filled later.`
            : `${form.name.trim()} saved. You can fill the KYR form later from their profile.`
        );
      }

      onCreated?.(json.data);
      onClose?.();
    } catch (err) {
      console.error("Failed to add beneficiary:", err);
      toast.error("Failed to add beneficiary. Please try again.");
    }
  };

  const handleCreateWithoutKyr = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      showErrors(validationErrors);
      return;
    }
    setErrors({});
    createBeneficiary(null);
  };

  const kyrPrefill = {
    "B.3": form.state,
    "B.4": form.district,
    "B.5": form.block,
    "B.6": form.ward,
    "B.7": form.village,
    "B.8": form.name,
    "B.9": form.gender,
    "B.10": form.householdSize,
    "B.14": form.primaryIncomeType === "Other" ? form.primaryIncomeOther : form.primaryIncomeType,
    "B.16_Min": form.monthlyIncome,
    "B.16_Max": form.monthlyIncome,
    "B.18": form.caste,
  };
  const kyrHidden = ["B.3", "B.4", "B.5", "B.6", "B.7", "B.8", "B.9", "B.10", "B.14", "B.16", "B.18"];

  const inputClass =
    "w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-base sm:text-sm";
  const fieldClass = (key) => `${inputClass}${errors[key] ? " ring-1 ring-error" : ""}`;
  const fieldError = (key) =>
    errors[key] ? (
      <p data-add-error className="text-[11px] font-semibold text-error">{errors[key]}</p>
    ) : null;
  const labelClass = "text-xs font-semibold text-on-surface-variant uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-surface-container pb-4">
          <div>
            <h3 className="text-xl font-bold">{heading}</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {step === "details"
                ? studentId
                  ? "Step 1 of 2 — Basic details, documents and program assignment for the parent/guardian."
                  : "Step 1 of 2 — Basic details, documents and program assignment."
                : "Step 2 of 2 — Fill the KYR form for this household."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <span className={step === "details" ? "text-primary" : "text-on-surface-variant"}>
            1. Basic Details
          </span>
          <span className="flex-1 h-px bg-surface-container-highest" />
          <span className={step === "kyr" ? "text-primary" : "text-on-surface-variant"}>
            2. KYR Form
          </span>
        </div>

        {step === "details" && (
          <form onSubmit={handleNext} noValidate className="space-y-4 text-sm">
            <p className="text-[11px] font-semibold text-on-surface-variant">
              All fields in this step are required.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Full Name</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joynal Abedin"
                  maxLength={60}
                  className={fieldClass("name")}
                  value={form.name}
                  onChange={(e) => updateField("name", toPersonNameInput(e.target.value))}
                />
                {fieldError("name")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Date of Birth</RequiredLabel></label>
                <DateInput
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className={fieldClass("dob")}
                  value={form.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                />
                {fieldError("dob")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Gender</RequiredLabel></label>
                <select
                  required
                  className={fieldClass("gender")}
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                >
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Don't want to respond">Don&apos;t want to respond</option>
                  <option value="Others">Others</option>
                </select>
                {fieldError("gender")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Mobile Number</RequiredLabel></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Enter exactly 10 digits, without +91 or spaces."
                  placeholder="e.g. 9988771122"
                  className={fieldClass("mobNumber")}
                  value={form.mobNumber}
                  onChange={(e) => updateField("mobNumber", toMobileInput(e.target.value))}
                />
                {fieldError("mobNumber")}
                <span className="text-[10px] text-on-surface-variant">
                  10 digits, numbers only (no +91).
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Emergency Contact Number</RequiredLabel></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Enter exactly 10 digits, without +91 or spaces."
                  placeholder="e.g. 9988771100"
                  className={fieldClass("emergencyContact")}
                  value={form.emergencyContact}
                  onChange={(e) => updateField("emergencyContact", toMobileInput(e.target.value))}
                />
                {fieldError("emergencyContact")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Caste</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General, SC, ST"
                  className={fieldClass("caste")}
                  value={form.caste}
                  onChange={(e) => updateField("caste", e.target.value)}
                />
                {fieldError("caste")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Religion</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Islam, Hinduism"
                  className={fieldClass("religion")}
                  value={form.religion}
                  onChange={(e) => updateField("religion", e.target.value)}
                />
                {fieldError("religion")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>State</RequiredLabel></label>
                <select
                  required
                  className={fieldClass("state")}
                  value={form.state}
                  onChange={(e) => {
                    const state = e.target.value;
                    setForm((prev) => ({ ...prev, state, district: "" }));
                    setErrors((prev) => {
                      if (!prev.state && !prev.district) return prev;
                      const next = { ...prev };
                      delete next.state;
                      delete next.district;
                      return next;
                    });
                  }}
                >
                  <option value="">— Select State —</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {fieldError("state")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>District</RequiredLabel></label>
                <select
                  required
                  className={fieldClass("district")}
                  value={form.district}
                  disabled={!form.state}
                  onChange={(e) => updateField("district", e.target.value)}
                >
                  <option value="">{form.state ? "— Select District —" : "Select state first"}</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {fieldError("district")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Block</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalgachia"
                  className={fieldClass("block")}
                  value={form.block}
                  onChange={(e) => updateField("block", e.target.value)}
                />
                {fieldError("block")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Ward / GP</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 2"
                  className={fieldClass("ward")}
                  value={form.ward}
                  onChange={(e) => updateField("ward", e.target.value)}
                />
                {fieldError("ward")}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass}><RequiredLabel>Village</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bartari"
                  className={fieldClass("village")}
                  value={form.village}
                  onChange={(e) => updateField("village", e.target.value)}
                />
                {fieldError("village")}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass}><RequiredLabel>Nearby Landmark</RequiredLabel></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Kalgachia College"
                  className={fieldClass("landmark")}
                  value={form.landmark}
                  onChange={(e) => updateField("landmark", e.target.value)}
                />
                {fieldError("landmark")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Primary Income Category</RequiredLabel></label>
                <select
                  required
                  className={fieldClass("primaryIncomeType")}
                  value={form.primaryIncomeType}
                  onChange={(e) => updateField("primaryIncomeType", e.target.value)}
                >
                  {PRIMARY_INCOME_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {fieldError("primaryIncomeType")}
              </div>

              {form.primaryIncomeType === "Other" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>Specify Income Category</RequiredLabel></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fishing, Pension"
                    className={fieldClass("primaryIncomeOther")}
                    value={form.primaryIncomeOther}
                    onChange={(e) => updateField("primaryIncomeOther", e.target.value)}
                  />
                  {fieldError("primaryIncomeOther")}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Socio-Economic Tier</RequiredLabel></label>
                <select
                  required
                  className={fieldClass("tier")}
                  value={form.tier}
                  onChange={(e) => updateField("tier", e.target.value)}
                >
                  <option value="Tier 1">Tier 1 (Critical)</option>
                  <option value="Tier 2">Tier 2 (Progressing)</option>
                  <option value="Tier 3">Tier 3 (Stable)</option>
                </select>
                {fieldError("tier")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Monthly Income (₹)</RequiredLabel></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 3750"
                  className={fieldClass("monthlyIncome")}
                  value={form.monthlyIncome}
                  onChange={(e) => updateField("monthlyIncome", e.target.value)}
                />
                {fieldError("monthlyIncome")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Annual Income (₹) — Auto-calculated</label>
                <input
                  type="number"
                  readOnly
                  tabIndex={-1}
                  className={`${inputClass} bg-surface-container/50 cursor-not-allowed`}
                  value={annualIncome}
                  placeholder="Calculated from monthly income"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}><RequiredLabel>Household Size</RequiredLabel></label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  required
                  className={fieldClass("householdSize")}
                  value={form.householdSize}
                  onChange={(e) => updateField("householdSize", e.target.value)}
                />
                {fieldError("householdSize")}
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Identity Proofs</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>Aadhar Number</RequiredLabel></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={12}
                    pattern="[0-9]{12}"
                    title="Aadhaar must be exactly 12 digits."
                    placeholder="e.g. 123456789012"
                    className={fieldClass("aadhar")}
                    value={form.aadhar}
                    onChange={(e) => updateField("aadhar", toAadhaarInput(e.target.value))}
                  />
                  {fieldError("aadhar")}
                  <span className="text-[10px] text-on-surface-variant">12 digits, numbers only.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>PAN Card</RequiredLabel></label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                    title="PAN must be in the format ABCDE1234F."
                    placeholder="e.g. ABCDE1234F"
                    className={fieldClass("panCard")}
                    value={form.panCard}
                    onChange={(e) => updateField("panCard", toPanInput(e.target.value))}
                  />
                  {fieldError("panCard")}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>Voter ID</RequiredLabel></label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    pattern="[A-Z]{3}[0-9]{7}"
                    title="Voter ID must be 3 letters followed by 7 digits."
                    placeholder="e.g. ABC1234567"
                    className={fieldClass("voterId")}
                    value={form.voterId}
                    onChange={(e) => updateField("voterId", toVoterIdInput(e.target.value))}
                  />
                  {fieldError("voterId")}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>Ration Card</RequiredLabel></label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    pattern="[A-Z0-9][A-Z0-9-]{5,19}"
                    title="Ration card must be 6 to 20 letters, digits or hyphens."
                    placeholder="e.g. SFY-AS-4029"
                    className={fieldClass("rationCard")}
                    value={form.rationCard}
                    onChange={(e) => updateField("rationCard", toRationCardInput(e.target.value))}
                  />
                  {fieldError("rationCard")}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Bank Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>Bank Name</RequiredLabel></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India"
                    className={fieldClass("bankName")}
                    value={form.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                  />
                  {fieldError("bankName")}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>Account Number</RequiredLabel></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={18}
                    pattern="[0-9]{9,18}"
                    title="Bank account number must be 9 to 18 digits."
                    placeholder="e.g. 30928409184"
                    className={fieldClass("bankAccountNo")}
                    value={form.bankAccountNo}
                    onChange={(e) => updateField("bankAccountNo", toBankAccountInput(e.target.value))}
                  />
                  {fieldError("bankAccountNo")}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}><RequiredLabel>IFSC Code</RequiredLabel></label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    pattern="[A-Z]{4}0[A-Z0-9]{6}"
                    title="IFSC must be in the format SBIN0007421."
                    placeholder="e.g. SBIN0007421"
                    className={fieldClass("bankIfsc")}
                    value={form.bankIfsc}
                    onChange={(e) => updateField("bankIfsc", toIfscInput(e.target.value))}
                  />
                  {fieldError("bankIfsc")}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className={labelClass}><RequiredLabel>Livelihood Program</RequiredLabel></label>
              <select
                required
                className={`${fieldClass("programId")} w-full mt-1.5`}
                value={form.programId}
                onChange={(e) => updateField("programId", e.target.value)}
              >
                <option value="">— Select a program —</option>
                {farmPrograms.length > 0 && (
                  <optgroup label="Farm Programs">
                    {farmPrograms.map((program) => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </optgroup>
                )}
                {nonFarmPrograms.length > 0 && (
                  <optgroup label="Non-Farm Programs">
                    {nonFarmPrograms.map((program) => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {errors.programId && (
                <p data-add-error className="text-[11px] font-semibold text-error mt-1">{errors.programId}</p>
              )}
              <p className="text-xs text-on-surface-variant italic mt-2">
                The beneficiary will be assigned to this program.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-surface-container mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-outline-variant hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateWithoutKyr}
                className="px-4 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-semibold cursor-pointer flex items-center justify-center gap-2"
              >
                Save &amp; Fill KYR Later
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/95 shadow-glow transition-all font-semibold cursor-pointer flex items-center justify-center gap-2"
              >
                Next: KYR Form
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {step === "kyr" && (
          <ResilienceSurveyForm
            mode="embedded"
            prefill={kyrPrefill}
            hideQuestionIds={kyrHidden}
            onBack={() => setStep("details")}
            onSubmit={(surveyPayload) => createBeneficiary(surveyPayload)}
          />
        )}
      </div>
    </div>
  );
}
