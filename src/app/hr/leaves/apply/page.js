"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/date";
import DateInput from "@/components/ui/DateInput";
import { validateDateOrder } from "@/lib/validation";
import {
  POLICY_FLAGS,
  QUOTA_PERIODS,
  daysInclusive,
  getFinancialYearStart,
  getMaxEndDateForMonths,
  getPolicyWarnings,
  parseDateOnly,
} from "@/lib/leavePolicy";

function formatStoredDates(value) {
  return String(value || "").replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match) => formatDate(match));
}

function emptyLeave() {
  return {
    type: "",
    leaveTypeKey: "",
    isMultiple: false,
    singleDate: "",
    fromDate: "",
    toDate: "",
    compOffWorkedDate: "",
    holidayName: "",
    reason: "",
  };
}

export default function LeaveApplication() {
  const { token, user: currentUser, can } = useAuth();
  const canWrite = can("leaves", "WRITE");
  const [leaves, setLeaves] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLeave, setNewLeave] = useState(emptyLeave());

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { pageItems: pagedLeaves, currentPage, setCurrentPage } = usePagination(leaves, 10);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const [res, configRes, summaryRes] = await Promise.all([
        fetch("/api/leaves", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/leaves/config", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/leaves/summary", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const data = await res.json();
      const configData = await configRes.json();
      const summaryData = await summaryRes.json();

      if (res.ok) {
        const myLeaves = (data.data || []).filter((leave) => leave.userId === currentUser?.id);
        setLeaves(myLeaves);
      }
      if (configRes.ok) {
        const activeConfigs = (configData.data || []).filter((config) => config.active);
        setConfigs(activeConfigs);
        setNewLeave((prev) => {
          const selected = activeConfigs.find((config) => config.key === prev.leaveTypeKey) || activeConfigs[0];
          if (!selected) return prev;
          return { ...prev, leaveTypeKey: selected.key, type: selected.name };
        });
      }
      if (summaryRes.ok) setSummary(summaryData.data);
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

  const selectedConfig = configs.find((config) => config.key === newLeave.leaveTypeKey) || null;
  const selectedType = selectedConfig ? summary?.types?.[selectedConfig.key] : null;
  const startDate = parseDateOnly(newLeave.isMultiple ? newLeave.fromDate : newLeave.singleDate);
  const endDate = parseDateOnly(newLeave.isMultiple ? newLeave.toDate : newLeave.singleDate);
  const requestedDays =
    startDate && endDate && endDate >= startDate ? daysInclusive(startDate, endDate) : 0;
  const policyWarnings = selectedConfig
    ? getPolicyWarnings(selectedConfig, {
        days: requestedDays,
        paidLeaveAvailable: summary?.totals?.paidAvailable || 0,
      })
    : [];
  const medicalCertificateRequired = policyWarnings.includes(POLICY_FLAGS.MEDICAL_CERTIFICATE_REQUIRED);
  const consecutiveWarning = policyWarnings.includes(POLICY_FLAGS.CONSECUTIVE_LIMIT_EXCEEDED);
  const paidLeaveWarning = policyWarnings.includes(POLICY_FLAGS.PAID_LEAVE_AVAILABLE);
  const serviceNotMet =
    selectedType &&
    selectedType.minServiceDays != null &&
    selectedType.eligible === false;

  const handleLeaveTypeChange = (key) => {
    const selected = configs.find((config) => config.key === key);
    setNewLeave((prev) => ({
      ...prev,
      leaveTypeKey: key,
      type: selected?.name || key,
      compOffWorkedDate: "",
      holidayName: "",
    }));
  };

  const handleApplyLeave = async () => {
    if (!canWrite) return;
    if (!selectedConfig) {
      triggerToast("Please select a leave type.");
      return;
    }

    const start = newLeave.isMultiple ? newLeave.fromDate : newLeave.singleDate;
    const end = newLeave.isMultiple ? newLeave.toDate : newLeave.singleDate;

    if (!start || !end) {
      triggerToast("Please select valid dates.");
      return;
    }
    if (newLeave.isMultiple) {
      const dateError = validateDateOrder(start, end, { startLabel: "From date", endLabel: "To date" });
      if (dateError) {
        triggerToast(dateError);
        return;
      }
    }
    if (selectedConfig.systemType === "COMP_OFF" || selectedConfig.key === "COMP_OFF") {
      if (!newLeave.compOffWorkedDate) {
        triggerToast("Select the date you worked on a non-working day.");
        return;
      }
    }
    if (selectedConfig.holidayNameRequired && !newLeave.holidayName.trim()) {
      triggerToast("Enter the name of the approved holiday.");
      return;
    }

    const days = daysInclusive(parseDateOnly(start), parseDateOnly(end));
    if (!days) {
      triggerToast("Please select valid dates.");
      return;
    }
    if (selectedConfig.maxConsecutiveDays != null && days > Number(selectedConfig.maxConsecutiveDays)) {
      if (!selectedConfig.softMaxConsecutive) {
        triggerToast(
          `${selectedConfig.name} is limited to ${selectedConfig.maxConsecutiveDays} consecutive days.`
        );
        return;
      }
    }
    if (selectedConfig.maxConsecutiveMonths != null) {
      const maxEnd = getMaxEndDateForMonths(parseDateOnly(start), selectedConfig.maxConsecutiveMonths);
      if (parseDateOnly(end) > maxEnd) {
        triggerToast(
          `${selectedConfig.name} is limited to ${selectedConfig.maxConsecutiveMonths} months per request.`
        );
        return;
      }
    }
    if (
      selectedConfig.quotaPeriod === QUOTA_PERIODS.PER_EVENT &&
      Number(selectedConfig.annualQuota) > 0 &&
      days > Number(selectedConfig.annualQuota)
    ) {
      triggerToast(`${selectedConfig.name} is limited to ${selectedConfig.annualQuota} days per event.`);
      return;
    }
    const parsedStart = parseDateOnly(start);
    const requestedFyStart = parsedStart ? getFinancialYearStart(parsedStart) : null;
    if (
      selectedType &&
      selectedType.available != null &&
      requestedFyStart === summary?.fyStart &&
      [QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(selectedConfig.quotaPeriod) &&
      days > Number(selectedType.available)
    ) {
      triggerToast(`Only ${selectedType.available} day(s) of ${selectedConfig.name} are available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: selectedConfig.name,
          leaveTypeKey: selectedConfig.key,
          startDate: start,
          endDate: end,
          singleDate: newLeave.singleDate,
          dates: newLeave.isMultiple ? `${formatDate(start)} to ${formatDate(end)}` : formatDate(start),
          compOffWorkedDate: newLeave.compOffWorkedDate || null,
          holidayName: newLeave.holidayName || null,
          reason: newLeave.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit leave");
      triggerToast(
        medicalCertificateRequired
          ? "Leave request submitted. Remember to submit the medical certificate at the office."
          : "Leave request submitted successfully!"
      );
      fetchLeaves();
      setIsApplying(false);
      const firstConfig = configs[0];
      setNewLeave(
        firstConfig
          ? { ...emptyLeave(), leaveTypeKey: firstConfig.key, type: firstConfig.name }
          : emptyLeave()
      );
    } catch (err) {
      triggerToast(err.message || "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  const leavesTaken = summary?.totals?.paidUsed ?? 0;
  const leavesRemaining = summary?.totals?.paidAvailable ?? 0;
  const pendingLeaves = summary?.totals?.paidPending ?? 0;

  return (
    <div className="p-4 sm:p-6 md:p-10 pb-24 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">Self Service</p>
          <h2 className="page-title text-on-surface">Leave Application</h2>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsApplying(true)}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer w-fit"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Apply for Leave
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-5 md:p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Annual Leave Taken</p>
            <h4 className="stat-value mt-2 text-on-surface">{leavesTaken}</h4>
            {pendingLeaves > 0 && (
              <p className="text-[10px] text-amber-700 mt-1">{pendingLeaves} day(s) pending approval</p>
            )}
          </div>
          <div className="p-3 md:p-4 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl">event_available</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-5 md:p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Annual Leave Available</p>
            <h4 className="stat-value mt-2 text-on-surface">{leavesRemaining}</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">Year-end balance does not carry forward</p>
          </div>
          <div className="p-3 md:p-4 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl">event_busy</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-5 md:p-6 rounded-2xl shadow-ambient flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Comp Off Available</p>
            <h4 className="stat-value mt-2 text-on-surface">{summary?.compOff?.available ?? 0}</h4>
            {summary?.compOff?.credits?.some((credit) => credit.status === "Available") && (
              <p className="text-[10px] text-on-surface-variant mt-1">
                Expires{" "}
                {formatDate(
                  summary.compOff.credits
                    .filter((credit) => credit.status === "Available")
                    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))[0]?.expiresAt
                )}
              </p>
            )}
          </div>
          <div className="p-3 md:p-4 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl">sync_alt</span>
          </div>
        </div>
      </div>

      {summary && (
        <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">Leave Balance</h3>
              <p className="text-[10px] text-on-surface-variant mt-1">Annual balances reset each financial year.</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{summary.fyLabel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Object.values(summary.types || {}).map((type) => (
              <div key={type.key} className="border border-outline-variant/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm text-on-surface">
                      {type.name}
                      {type.code ? <span className="text-on-surface-variant font-medium"> ({type.code})</span> : null}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{type.entitlementLabel}</p>
                  </div>
                  {[QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(type.quotaPeriod) ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                      {type.available} left
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-1 rounded-full whitespace-nowrap">
                      {type.quotaPeriod === QUOTA_PERIODS.UNLIMITED ? "Approval" : "Per event"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-on-surface-variant">
                  <span>Used: <strong className="text-on-surface">{type.used}</strong></span>
                  {type.pending > 0 && <span>Pending: <strong className="text-amber-700">{type.pending}</strong></span>}
                  {type.minServiceDays != null && (
                    <span className={type.eligible ? "text-emerald-700" : "text-rose-600"}>
                      {type.eligible ? "Service requirement met" : `${type.minServiceDays}-day service required`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3">
            Maternity extensions are applied separately as Unpaid Leave (LWP). Compensatory leave expires 90 days after the worked date.
          </p>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-xl text-on-surface">My Leave History</h3>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="mobile-card-table w-full min-w-[640px] table-fixed text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                <th className="w-[22%] py-3 px-4">Leave Type</th>
                <th className="w-[26%] py-3 px-4">Requested Dates</th>
                <th className="w-[34%] py-3 px-4">Reason</th>
                <th className="w-[18%] py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedLeaves.map((leave) => (
                <tr key={leave.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                  <td data-label="" className="py-4 px-4 font-bold text-on-surface break-words align-top">
                    <div>{leave.type}</div>
                    {leave.holidayName && (
                      <div className="text-[10px] text-sky-700 font-semibold mt-1">Holiday: {leave.holidayName}</div>
                    )}
                    {leave.medicalCertificateRequired && (
                      <div className="text-[10px] text-amber-700 font-semibold mt-1">Medical certificate required at office</div>
                    )}
                  </td>
                  <td data-label="Requested Dates" className="py-4 px-4 font-mono text-xs text-on-surface-variant break-words align-top">{formatStoredDates(leave.dates)}</td>
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
                </tr>
              ))}
              {leaves.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-on-surface-variant">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalItems={leaves.length} itemsPerPage={10} onPageChange={setCurrentPage} />
      </div>

      {isApplying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-xl p-4 sm:p-8 relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-outline-variant/10 pb-4">
              <h3 className="text-xl sm:text-2xl font-headline font-bold text-on-surface">Apply for Leave</h3>
              <button onClick={() => setIsApplying(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Leave Type</label>
                <select
                  value={newLeave.leaveTypeKey}
                  onChange={(event) => handleLeaveTypeChange(event.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface dark:bg-slate-900 cursor-pointer"
                >
                  {configs.map((config) => (
                    <option key={config.key} value={config.key}>
                      {config.name}{config.code ? ` (${config.code})` : ""}
                    </option>
                  ))}
                </select>
                {selectedConfig?.policyNote && (
                  <p className="text-[11px] leading-relaxed text-on-surface-variant bg-surface-container/60 rounded-lg px-3 py-2">
                    {selectedConfig.policyNote}
                  </p>
                )}
              </div>

              {(selectedConfig?.systemType === "COMP_OFF" || selectedConfig?.key === "COMP_OFF") && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Worked On (Non-Working Day)
                  </label>
                  <DateInput
                    value={newLeave.compOffWorkedDate}
                    max={newLeave.isMultiple ? newLeave.fromDate : newLeave.singleDate}
                    onChange={(event) => setNewLeave({ ...newLeave, compOffWorkedDate: event.target.value })}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface"
                  />
                  <p className="text-[10px] text-on-surface-variant">
                    Compensatory leave must be availed within {selectedConfig.validityDays || 90} days of the worked date. Your approver will verify the official duty.
                  </p>
                </div>
              )}

              {selectedConfig?.holidayNameRequired && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Approved Holiday Name
                  </label>
                  <input
                    type="text"
                    value={newLeave.holidayName}
                    onChange={(event) => setNewLeave({ ...newLeave, holidayName: event.target.value })}
                    placeholder="Enter the holiday from the approved list"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface"
                  />
                  <p className="text-[10px] text-on-surface-variant">
                    Restricted Holidays are subject to program requirements and approver verification.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <input type="checkbox" className="w-5 h-5 accent-primary rounded border-outline-variant cursor-pointer" checked={newLeave.isMultiple} onChange={(event) => setNewLeave({ ...newLeave, isMultiple: event.target.checked })} />
                <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Multiple Days</span>
              </label>

              {newLeave.isMultiple ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From Date</label>
                    <DateInput value={newLeave.fromDate} onChange={(event) => setNewLeave({ ...newLeave, fromDate: event.target.value })} className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To Date</label>
                    <DateInput value={newLeave.toDate} onChange={(event) => setNewLeave({ ...newLeave, toDate: event.target.value })} className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Date</label>
                  <DateInput value={newLeave.singleDate} onChange={(event) => setNewLeave({ ...newLeave, singleDate: event.target.value })} className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface" />
                </div>
              )}

              {requestedDays > 0 && (
                <p className="text-[11px] text-on-surface-variant">
                  Requested duration: <strong className="text-on-surface">{requestedDays} day(s)</strong>
                </p>
              )}

              {consecutiveWarning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 px-3 py-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                  {selectedConfig.name} is normally limited to {selectedConfig.maxConsecutiveDays} consecutive days. This request will be flagged for management approval.
                </div>
              )}

              {medicalCertificateRequired && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30 px-3 py-2.5 text-[11px] text-rose-800 dark:text-rose-300">
                  {selectedConfig.name} exceeding {selectedConfig.medicalCertificateAfterDays} consecutive days requires a medical certificate to be submitted at the office.
                </div>
              )}

              {paidLeaveWarning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 px-3 py-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                  You still have {summary.totals.paidAvailable} day(s) of paid leave available. Unpaid leave is subject to management approval.
                </div>
              )}

              {serviceNotMet && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30 px-3 py-2.5 text-[11px] text-rose-800 dark:text-rose-300">
                  {selectedType.serviceDays == null
                    ? "Your date of joining is not set. Please contact HR before applying for this leave."
                    : `${selectedConfig.name} requires at least ${selectedType.minServiceDays} days of service. You have completed ${selectedType.serviceDays} days.`}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</label>
                <textarea
                  rows="3"
                  value={newLeave.reason}
                  onChange={(event) => setNewLeave({ ...newLeave, reason: event.target.value })}
                  placeholder="Provide details..."
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-4 border-t border-outline-variant/10">
              <button onClick={() => setIsApplying(false)} className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
              <button
                onClick={handleApplyLeave}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-transform flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
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
    </div>
  );
}
