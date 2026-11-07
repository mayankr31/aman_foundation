"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";
import OnLeaveToday from "@/components/OnLeaveToday";
import HolidayManagerModal from "@/components/holidays/HolidayManagerModal";
import {
  POLICY_FLAGS,
  QUOTA_PERIODS,
  QUOTA_PERIOD_OPTIONS,
  getPolicyFlagLabel,
} from "@/lib/leavePolicy";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];
const POLICY_ADMIN_ROLES = ["ADMIN", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"];
const PERIOD_LOCKED_KEYS = ["COMP_OFF", "MATERNITY", "PATERNITY", "BEREAVEMENT", "LWP"];

function formatStoredDates(value) {
  return String(value || "").replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match) => formatDate(match));
}

function emptyPolicyType() {
  return {
    name: "",
    code: "",
    quotaPeriod: QUOTA_PERIODS.FINANCIAL_YEAR,
    annualQuota: "",
    maxConsecutiveDays: "",
    maxConsecutiveMonths: "",
    minServiceDays: "",
    medicalCertificateAfterDays: "",
    validityDays: "",
    softMaxConsecutive: false,
    paid: true,
    holidayNameRequired: false,
    policyNote: "",
    active: true,
  };
}

function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toQuotaNumber(value) {
  const number = toNullableNumber(value);
  return number == null ? 0 : number;
}

function configPayload(config) {
  return {
    key: config.key,
    name: config.name,
    code: config.code || "",
    policyNote: config.policyNote || "",
    annualQuota: toQuotaNumber(config.annualQuota),
    quotaPeriod: config.quotaPeriod,
    maxConsecutiveDays: toNullableNumber(config.maxConsecutiveDays),
    maxConsecutiveMonths: toNullableNumber(config.maxConsecutiveMonths),
    softMaxConsecutive: !!config.softMaxConsecutive,
    minServiceDays: toNullableNumber(config.minServiceDays),
    medicalCertificateAfterDays: toNullableNumber(config.medicalCertificateAfterDays),
    validityDays: toNullableNumber(config.validityDays),
    paid: config.paid !== false,
    holidayNameRequired: !!config.holidayNameRequired,
    active: config.active !== false,
  };
}

export default function LeaveWorkflow() {
  const { token, user: currentUser, can } = useAuth();
  const canWrite = can("leaves", "WRITE");
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [rejectingLeaveId, setRejectingLeaveId] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const [showPolicy, setShowPolicy] = useState(false);
  const [policyConfigs, setPolicyConfigs] = useState([]);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [showAddType, setShowAddType] = useState(false);
  const [newPolicyType, setNewPolicyType] = useState(emptyPolicyType());
  const [creatingType, setCreatingType] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const canReview = [...POLICY_ADMIN_ROLES, "HR", ...PROGRAM_ROLES].includes(currentUser?.roleName);
  const canManagePolicy = POLICY_ADMIN_ROLES.includes(currentUser?.roleName);
  const canManageHolidays = ["ADMIN", "HR", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"].includes(
    currentUser?.roleName
  );
  const { pageItems: pagedLeaves, currentPage, setCurrentPage } = usePagination(leaves, 10);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.data || []);
      }
    } catch (err) {
      triggerToast("Error fetching leaves");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchPolicy = async () => {
    try {
      const res = await fetch("/api/leaves/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPolicyConfigs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openPolicy = () => {
    setPolicyError("");
    setShowAddType(false);
    setNewPolicyType(emptyPolicyType());
    fetchPolicy();
    setShowPolicy(true);
  };

  const updatePolicyConfig = (index, patch) => {
    setPolicyConfigs((prev) =>
      prev.map((config, configIndex) => (configIndex === index ? { ...config, ...patch } : config))
    );
    setPolicyError("");
  };

  const policyHasErrors = policyConfigs.some((config) => {
    if (!String(config.name || "").trim()) return true;
    const nonNegativeFields = [
      config.annualQuota,
      config.minServiceDays,
      config.medicalCertificateAfterDays,
    ];
    if (
      nonNegativeFields.some((value) => {
        if (value === "" || value === null || value === undefined) return false;
        const number = Number(value);
        return !Number.isFinite(number) || number < 0;
      })
    ) {
      return true;
    }
    const positiveFields = [config.maxConsecutiveDays, config.maxConsecutiveMonths, config.validityDays];
    if (
      positiveFields.some((value) => {
        if (value === "" || value === null || value === undefined) return false;
        const number = Number(value);
        return !Number.isFinite(number) || number < 1;
      })
    ) {
      return true;
    }
    return (
      config.maxConsecutiveMonths !== "" &&
      config.maxConsecutiveMonths !== null &&
      config.maxConsecutiveMonths !== undefined &&
      Number(config.maxConsecutiveMonths) > 12
    );
  });

  const savePolicy = async () => {
    if (policyHasErrors) {
      triggerToast("Please correct the highlighted policy values.");
      return;
    }
    setSavingPolicy(true);
    setPolicyError("");
    try {
      const res = await fetch("/api/leaves/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ configs: policyConfigs.map(configPayload) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save policy");
      setPolicyConfigs(data.data || []);
      triggerToast("Leave policy updated");
      setShowPolicy(false);
    } catch (err) {
      setPolicyError(err.message || "Failed to save policy");
      triggerToast(err.message || "Failed to save policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const createLeaveType = async () => {
    if (!String(newPolicyType.name || "").trim()) {
      setPolicyError("Leave type name is required.");
      return;
    }
    setCreatingType(true);
    setPolicyError("");
    try {
      const res = await fetch("/api/leaves/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(configPayload(newPolicyType)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create leave type");
      await fetchPolicy();
      setNewPolicyType(emptyPolicyType());
      setShowAddType(false);
      triggerToast("Leave type added");
    } catch (err) {
      setPolicyError(err.message || "Failed to create leave type");
      triggerToast(err.message || "Failed to create leave type");
    } finally {
      setCreatingType(false);
    }
  };

  const deleteLeaveType = async (config) => {
    if (config.isSystem) return;
    if (!window.confirm(`Delete "${config.name}"? Types with existing requests can only be deactivated.`)) return;
    try {
      const res = await fetch(`/api/leaves/config?key=${encodeURIComponent(config.key)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete leave type");
      setPolicyConfigs((prev) => prev.filter((item) => item.key !== config.key));
      triggerToast("Leave type deleted");
    } catch (err) {
      triggerToast(err.message || "Failed to delete leave type");
    }
  };

  const handleUpdateStatus = async (leaveId, newStatus, rejectionReason = null) => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ...(rejectionReason && { rejectionReason }),
        }),
      });
      if (res.ok) {
        triggerToast(`Leave ${newStatus.toLowerCase()} successfully`);
        fetchLeaves();
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || "Failed to update leave");
      }
    } catch (err) {
      triggerToast("Error updating leave");
    }
  };

  const handleRejectClick = (leaveId) => {
    setRejectingLeaveId(leaveId);
    setRejectionReasonText("");
  };

  const submitRejection = async () => {
    if (!rejectionReasonText.trim()) {
      triggerToast("Rejection reason is required.");
      return;
    }
    setIsSubmittingRejection(true);
    await handleUpdateStatus(rejectingLeaveId, "REJECTED", rejectionReasonText);
    setIsSubmittingRejection(false);
    setRejectingLeaveId(null);
    setRejectionReasonText("");
  };

  const renderNumberInput = (config, index, field, label, { min = 0, placeholder = "" } = {}) => (
    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
      {label}
      <input
        type="number"
        min={min}
        step="1"
        value={config[field] ?? ""}
        placeholder={placeholder}
        onChange={(event) => updatePolicyConfig(index, { [field]: event.target.value })}
        className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
      />
    </label>
  );

  const renderCheckbox = (config, index, field, label) => (
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
      <input
        type="checkbox"
        checked={config[field] === true}
        onChange={(event) => updatePolicyConfig(index, { [field]: event.target.checked })}
        className="accent-primary w-4 h-4"
      />
      {label}
    </label>
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 flex-grow flex flex-col overflow-y-auto pb-24 max-w-7xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
            {canReview ? "Administration Module" : "Self Service"}
          </p>
          <h2 className="page-title text-on-surface">
            {canReview ? "Leave Management" : "My Leaves"}
          </h2>
        </div>
      </div>

      {canReview && <OnLeaveToday className="mb-6" />}

      <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h3 className="font-headline font-bold text-xl text-on-surface">Leave Requests</h3>
          <div className="flex flex-wrap items-center gap-2">
            {canWrite && (
              <Link
                href="/hr/leaves/apply"
                className="text-xs font-bold bg-primary text-white border border-primary px-3 py-1.5 rounded-full hover:bg-primary-container transition-colors"
              >
                Apply for Leave
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowHolidays(true)}
              className="text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors"
            >
              {canManageHolidays ? "Manage Holidays" : "Holiday Calendar"}
            </button>
            {canManagePolicy && (
              <button
                onClick={openPolicy}
                className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                Leave Policy
              </button>
            )}
            <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
              {leaves.length} Request{leaves.length !== 1 && "s"}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="mobile-card-table w-full min-w-[900px] table-fixed text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                <th className="w-[15%] py-3 px-4">Applicant</th>
                <th className="w-[11%] py-3 px-4">Role</th>
                <th className="w-[16%] py-3 px-4">Type</th>
                <th className="w-[14%] py-3 px-4">Dates</th>
                <th className="w-[20%] py-3 px-4">Reason</th>
                <th className="w-[12%] py-3 px-4">Status</th>
                <th className="w-[12%] py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedLeaves.map((leave) => {
                const flags = (leave.policyFlags || []).filter(
                  (flag) => flag !== POLICY_FLAGS.MEDICAL_CERTIFICATE_REQUIRED
                );
                return (
                  <tr key={leave.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                    <td data-label="" className="py-4 px-4 font-bold text-on-surface break-words align-top">{leave.user?.name || "Unknown"}</td>
                    <td data-label="Role" className="py-4 px-4 text-xs font-semibold text-slate-500 break-words align-top">{formatRoleLabel(leave.user?.role)}</td>
                    <td data-label="Type" className="py-4 px-4 text-xs text-on-surface-variant break-words align-top">
                      <div>{leave.type}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {leave.compOffWorkedDate && (
                          <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                            Worked: {formatDate(leave.compOffWorkedDate)}
                          </span>
                        )}
                        {leave.holidayName && (
                          <span className="text-[9px] text-sky-700 font-semibold bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">
                            Holiday: {leave.holidayName}
                          </span>
                        )}
                        {leave.medicalCertificateRequired && (
                          <span className="text-[9px] text-rose-700 font-semibold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                            Medical certificate at office
                          </span>
                        )}
                        {flags.map((flag) => (
                          <span key={flag} className="text-[9px] text-amber-700 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                            {getPolicyFlagLabel(flag)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Dates" className="py-4 px-4 font-mono text-xs break-words align-top">{formatStoredDates(leave.dates)}</td>
                    <td data-label="Reason" className="py-4 px-4 text-xs text-on-surface-variant break-words align-top">{leave.reason}</td>
                    <td data-label="Status" className="py-4 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          leave.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          leave.status === "REJECTED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {leave.status}
                        </span>
                        {leave.status === "REJECTED" && leave.rejectionReason && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30 max-w-[150px] break-words">
                            <span className="font-bold">Reason:</span> {leave.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Actions" className="py-4 px-4 flex gap-2">
                      {canWrite && leave.status === "PENDING" && leave.userId !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(leave.id, "APPROVED")}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg text-xs font-bold transition-colors"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(leave.id)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg text-xs font-bold transition-colors"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {leaves.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-on-surface-variant">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalItems={leaves.length} itemsPerPage={10} onPageChange={setCurrentPage} />
      </div>

      {showPolicy && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl p-4 sm:p-6 relative max-h-[94vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-3 mb-5 border-b border-outline-variant/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-headline font-bold text-on-surface">Leave Policy</h3>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Configure entitlements and limits. Built-in types keep their core behaviour; custom types can be added for future needs.
                </p>
              </div>
              <button onClick={() => setShowPolicy(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {policyConfigs.length} leave type(s)
              </p>
              <button
                onClick={() => {
                  setShowAddType((prev) => !prev);
                  setPolicyError("");
                }}
                className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary-container transition-colors"
              >
                {showAddType ? "Close Add Form" : "+ Add Leave Type"}
              </button>
            </div>

            {policyError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                {policyError}
              </div>
            )}

            {showAddType && (
              <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <p className="text-sm font-bold text-on-surface mb-3">New Leave Type</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:col-span-2">
                    Name
                    <input
                      type="text"
                      value={newPolicyType.name}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="e.g. Study Leave"
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Short code
                    <input
                      type="text"
                      value={newPolicyType.code}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, code: event.target.value }))}
                      placeholder="e.g. STL"
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Period
                    <select
                      value={newPolicyType.quotaPeriod}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, quotaPeriod: event.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    >
                      {QUOTA_PERIOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Entitlement (days)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newPolicyType.annualQuota}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, annualQuota: event.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Max consecutive days
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newPolicyType.maxConsecutiveDays}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, maxConsecutiveDays: event.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Min service days
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newPolicyType.minServiceDays}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, minServiceDays: event.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Certificate after (days)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newPolicyType.medicalCertificateAfterDays}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, medicalCertificateAfterDays: event.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:col-span-2 lg:col-span-4">
                    Policy note
                    <textarea
                      rows="2"
                      value={newPolicyType.policyNote}
                      onChange={(event) => setNewPolicyType((prev) => ({ ...prev, policyNote: event.target.value }))}
                      placeholder="Shown to employees when applying"
                      className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface resize-none"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={newPolicyType.paid}
                        onChange={(event) => setNewPolicyType((prev) => ({ ...prev, paid: event.target.checked }))}
                        className="accent-primary w-4 h-4"
                      />
                      Paid leave
                    </label>
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={newPolicyType.softMaxConsecutive}
                        onChange={(event) => setNewPolicyType((prev) => ({ ...prev, softMaxConsecutive: event.target.checked }))}
                        className="accent-primary w-4 h-4"
                      />
                      Consecutive limit is a warning
                    </label>
                    <button
                      onClick={createLeaveType}
                      disabled={creatingType}
                      className="ml-auto px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors disabled:opacity-60"
                    >
                      {creatingType ? "Adding..." : "Add Leave Type"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {policyConfigs.map((config, index) => (
                <div key={config.key} className="rounded-xl border border-outline-variant/20 p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={config.name}
                        onChange={(event) => updatePolicyConfig(index, { name: event.target.value })}
                        className="min-w-[180px] flex-1 sm:flex-none px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-bold text-on-surface"
                      />
                      <input
                        type="text"
                        value={config.code || ""}
                        onChange={(event) => updatePolicyConfig(index, { code: event.target.value })}
                        placeholder="Code"
                        className="w-20 px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-xs font-bold uppercase text-on-surface"
                      />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                        {config.isSystem ? "Built-in" : "Custom"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {renderCheckbox(config, index, "active", "Active")}
                      {!config.isSystem && (
                        <button
                          onClick={() => deleteLeaveType(config)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Period
                      {config.quotaPeriod === QUOTA_PERIODS.CREDIT ? (
                        <input
                          type="text"
                          value="Compensatory credit"
                          disabled
                          className="mt-1 w-full px-3 py-2 border border-outline-variant/20 rounded-lg bg-surface-container/50 text-sm font-normal normal-case tracking-normal text-on-surface-variant"
                        />
                      ) : (
                        <select
                          value={config.quotaPeriod}
                          disabled={PERIOD_LOCKED_KEYS.includes(config.key)}
                          onChange={(event) => updatePolicyConfig(index, { quotaPeriod: event.target.value })}
                          className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface disabled:opacity-70"
                        >
                          {QUOTA_PERIOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      )}
                    </label>
                    {renderNumberInput(config, index, "annualQuota", "Entitlement (days)")}
                    {renderNumberInput(config, index, "maxConsecutiveDays", "Max consecutive days", { min: 1 })}
                    {renderNumberInput(config, index, "maxConsecutiveMonths", "Max consecutive months", { min: 1 })}
                    {renderNumberInput(config, index, "minServiceDays", "Min service days")}
                    {renderNumberInput(config, index, "medicalCertificateAfterDays", "Certificate after (days)")}
                    {renderNumberInput(config, index, "validityDays", "Validity days")}
                    <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4 pt-1">
                      {renderCheckbox(config, index, "paid", "Paid leave")}
                      {renderCheckbox(config, index, "softMaxConsecutive", "Consecutive limit is a warning")}
                      {renderCheckbox(config, index, "holidayNameRequired", "Holiday name required")}
                    </div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:col-span-2 lg:col-span-4">
                      Policy note
                      <textarea
                        rows="2"
                        value={config.policyNote || ""}
                        onChange={(event) => updatePolicyConfig(index, { policyNote: event.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-outline-variant/40 rounded-lg bg-transparent text-sm font-normal normal-case tracking-normal text-on-surface resize-none"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {policyHasErrors && (
              <p className="text-[11px] font-semibold text-rose-600 mb-2">
                Check leave type names and numeric policy values before saving.
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t border-outline-variant/10">
              <button onClick={() => setShowPolicy(false)} className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
              <button onClick={savePolicy} disabled={savingPolicy || policyHasErrors} className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                {savingPolicy ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg shrink-0">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {rejectingLeaveId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-lg p-4 sm:p-8 relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/10 pb-4">
              <h3 className="text-xl font-headline font-bold text-on-surface">Provide Rejection Reason</h3>
              <button onClick={() => setRejectingLeaveId(null)} className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 mb-6 font-sans">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</label>
              <textarea
                rows="4"
                value={rejectionReasonText}
                onChange={(event) => setRejectionReasonText(event.target.value)}
                placeholder="Why is this leave being rejected?"
                className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-rose-500 bg-transparent text-sm text-on-surface resize-none"
              ></textarea>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-4 border-t border-outline-variant/10">
              <button onClick={() => setRejectingLeaveId(null)} className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
              <button
                onClick={submitRejection}
                disabled={isSubmittingRejection}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-transform flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmittingRejection ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <HolidayManagerModal
        open={showHolidays}
        onClose={() => setShowHolidays(false)}
        canManage={canManageHolidays}
        token={token}
      />
    </div>
  );
}
