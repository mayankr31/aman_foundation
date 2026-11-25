"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import Pagination from "@/components/ui/Pagination";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/date";
import DateInput from "@/components/ui/DateInput";
import { validateDateOrder } from "@/lib/validation";
import LeaveBalanceOverview from "@/components/leaves/LeaveBalanceOverview";
import {
  POLICY_FLAGS,
  QUOTA_PERIODS,
  daysInclusive,
  formatQuarterKey,
  getMaxEndDateForMonths,
  getPolicyWarnings,
  parseDateOnly,
  parseLegacyLeaveRange,
  splitDaysByQuarter,
} from "@/lib/leavePolicy";

const NO_SELF_APPLY_ROLES = ["ADMIN", "EXECUTIVE_DIRECTOR", "SUPER_ADMIN"];

function formatStoredDates(value) {
  return String(value || "").replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match) => formatDate(match));
}

function toDateKey(value) {
  const parsed = parseDateOnly(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
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
  const [holidayDateKeys, setHolidayDateKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLeave, setNewLeave] = useState(emptyLeave());
  const [editingLeave, setEditingLeave] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const holidayYear = new Date().getFullYear();
      const [res, configRes, summaryRes, holidayRes, prevHolidayRes] = await Promise.all([
        fetch("/api/leaves", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/leaves/config", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/leaves/summary", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/holidays?year=${holidayYear}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/holidays?year=${holidayYear - 1}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const data = await res.json();
      const configData = await configRes.json();
      const summaryData = await summaryRes.json();
      const holidayData = holidayRes.ok ? await holidayRes.json() : null;
      const prevHolidayData = prevHolidayRes.ok ? await prevHolidayRes.json() : null;

      const holidayKeys = [
        ...(holidayData?.data || []),
        ...(prevHolidayData?.data || []),
      ]
        .filter((holiday) => holiday.type === "PUBLIC")
        .map((holiday) => holiday.dateKey)
        .filter(Boolean);
      setHolidayDateKeys([...new Set(holidayKeys)]);

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

  const defaultLeaveForm = () => {
    const firstConfig = configs[0];
    return firstConfig
      ? { ...emptyLeave(), leaveTypeKey: firstConfig.key, type: firstConfig.name }
      : emptyLeave();
  };

  const leaveToForm = (leave) => {
    const config =
      configs.find((item) => item.key === leave.leaveTypeKey) ||
      configs.find((item) => item.name === leave.type) ||
      null;
    const fallbackRange = parseLegacyLeaveRange(leave.dates);
    const start = parseDateOnly(leave.startDate) || fallbackRange.startDate;
    const end = parseDateOnly(leave.endDate) || fallbackRange.endDate || start;
    const isMultiple = Boolean(start && end && start.getTime() !== end.getTime());

    return {
      type: config?.name || leave.type || "",
      leaveTypeKey: config?.key || leave.leaveTypeKey || "",
      isMultiple,
      singleDate: !isMultiple && start ? toDateKey(start) : "",
      fromDate: isMultiple && start ? toDateKey(start) : "",
      toDate: isMultiple && end ? toDateKey(end) : "",
      compOffWorkedDate: leave.compOffWorkedDate ? toDateKey(leave.compOffWorkedDate) : "",
      holidayName: leave.holidayName || "",
      reason: leave.reason || "",
    };
  };

  const openApplyForm = () => {
    setEditingLeave(null);
    setNewLeave(defaultLeaveForm());
    setIsApplying(true);
  };

  const openEditForm = (leave) => {
    setEditingLeave(leave);
    setNewLeave(leaveToForm(leave));
    setIsApplying(true);
  };

  const closeApplyForm = () => {
    setIsApplying(false);
    setEditingLeave(null);
  };

  const handleDeleteLeave = async (leave) => {
    if (!leave) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leaves/${leave.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete leave request");
      triggerToast("Leave request deleted successfully.");
      if (editingLeave?.id === leave.id) closeApplyForm();
      fetchLeaves();
    } catch (err) {
      triggerToast(err.message || "Failed to delete leave request");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const selectedConfig = configs.find((config) => config.key === newLeave.leaveTypeKey) || null;
  const selectedType = selectedConfig ? summary?.types?.[selectedConfig.key] : null;
  const isCompOffSelected =
    selectedConfig?.systemType === "COMP_OFF" || selectedConfig?.key === "COMP_OFF";
  const startDate = parseDateOnly(newLeave.isMultiple ? newLeave.fromDate : newLeave.singleDate);
  const endDate = parseDateOnly(newLeave.isMultiple ? newLeave.toDate : newLeave.singleDate);
  const requestedDays =
    startDate && endDate && endDate >= startDate ? daysInclusive(startDate, endDate) : 0;
  const leaveStartKey = startDate ? startDate.toISOString().slice(0, 10) : "";
  const holidayKeySet = new Set(holidayDateKeys);
  const availableCompOffCredits = (summary?.compOff?.credits || []).filter((credit) => {
    const isCurrentReservation =
      editingLeave?.compOffCreditId &&
      credit.id === editingLeave.compOffCreditId &&
      credit.status === "Reserved";
    if (credit.status !== "Available" && !isCurrentReservation) return false;
    const workedKey = toDateKey(credit.workedDate);
    if (!workedKey) return false;
    if (leaveStartKey && workedKey >= leaveStartKey) return false;
    const workedDate = parseDateOnly(credit.workedDate);
    return !!workedDate && (workedDate.getUTCDay() === 0 || holidayKeySet.has(workedKey));
  });
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
    if (isCompOffSelected) {
      if (!newLeave.compOffWorkedDate) {
        triggerToast("Select the comp-off credit you want to use.");
        return;
      }
      const creditIsEligible = availableCompOffCredits.some(
        (credit) => toDateKey(credit.workedDate) === newLeave.compOffWorkedDate
      );
      if (!creditIsEligible) {
        triggerToast("No comp-off credit is available for that day.");
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
    const requestedYear = parsedStart ? parsedStart.getUTCFullYear() : null;
    if (
      selectedType &&
      selectedType.available != null &&
      requestedYear === summary?.year &&
      [QUOTA_PERIODS.FINANCIAL_YEAR, QUOTA_PERIODS.CALENDAR_YEAR].includes(selectedConfig.quotaPeriod) &&
      days > Number(selectedType.available)
    ) {
      triggerToast(`Only ${selectedType.available} day(s) of ${selectedConfig.name} are available.`);
      return;
    }
    if (!editingLeave && selectedType?.quarters?.length && requestedYear === summary?.year) {
      const requestedQuarterSplit = splitDaysByQuarter(parseDateOnly(start), parseDateOnly(end));
      for (const [quarterKey, requestedQty] of Object.entries(requestedQuarterSplit)) {
        const [quarterYear, rawQuarter] = quarterKey.split("-");
        if (Number(quarterYear) !== summary?.year) continue;
        const quarterData = selectedType.quarters[Number(String(rawQuarter).replace("Q", "")) - 1];
        if (!quarterData || quarterData.available == null) continue;
        if (requestedQty > quarterData.available) {
          triggerToast(
            `Only ${quarterData.available} day(s) of ${selectedConfig.name} are available in ${formatQuarterKey(quarterKey)}.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const isEditing = Boolean(editingLeave);
      const res = await fetch(isEditing ? `/api/leaves/${editingLeave.id}` : "/api/leaves", {
        method: isEditing ? "PUT" : "POST",
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
      if (!res.ok) {
        throw new Error(data.error || (isEditing ? "Failed to update leave" : "Failed to submit leave"));
      }
      if (isEditing) {
        triggerToast("Leave request updated successfully!");
      } else {
        triggerToast(
          medicalCertificateRequired
            ? "Leave request submitted. Remember to submit the medical certificate at the office."
            : "Leave request submitted successfully!"
        );
      }
      fetchLeaves();
      setIsApplying(false);
      setEditingLeave(null);
      setNewLeave(defaultLeaveForm());
    } catch (err) {
      triggerToast(err.message || "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="p-4 sm:p-6 md:p-10 pb-24 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">Self Service</p>
          <h2 className="page-title text-on-surface">Leave Application</h2>
        </div>
        {canWrite && !NO_SELF_APPLY_ROLES.includes(currentUser?.roleName) && (
          <button
            onClick={openApplyForm}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer w-fit"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Apply for Leave
          </button>
        )}
      </div>

      <LeaveBalanceOverview summary={summary} className="mb-8" />

      <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-xl text-on-surface">My Leave History</h3>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="mobile-card-table w-full min-w-[760px] table-fixed text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                <th className="w-[20%] py-3 px-4">Leave Type</th>
                <th className="w-[24%] py-3 px-4">Requested Dates</th>
                <th className="w-[26%] py-3 px-4">Reason</th>
                <th className="w-[16%] py-3 px-4">Status</th>
                <th className="w-[14%] py-3 px-4">Actions</th>
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
                  <td data-label="Actions" className="py-4 px-4 align-top">
                    {leave.status === "PENDING" && leave.userId === currentUser?.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(leave)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(leave)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-on-surface-variant">No leave requests found.</td>
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
              <h3 className="text-xl sm:text-2xl font-headline font-bold text-on-surface">
                {editingLeave ? "Edit Leave Request" : "Apply for Leave"}
              </h3>
              <button onClick={closeApplyForm} className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface">
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

              {isCompOffSelected && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Worked On (Non-Working Day)
                  </label>
                  {availableCompOffCredits.length > 0 ? (
                    <select
                      value={newLeave.compOffWorkedDate}
                      onChange={(event) =>
                        setNewLeave({ ...newLeave, compOffWorkedDate: event.target.value })
                      }
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface"
                    >
                      <option value="">Select a worked day</option>
                      {availableCompOffCredits.map((credit) => (
                        <option key={credit.id} value={toDateKey(credit.workedDate)}>
                          {formatDate(credit.workedDate)} · expires {formatDate(credit.expiresAt)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                      No comp-off credit is available
                      {leaveStartKey ? " before the selected leave date" : ""}. Comp-off is
                      granted automatically when you check in on a Sunday or public holiday.
                    </div>
                  )}
                  <p className="text-[10px] text-on-surface-variant">
                    {availableCompOffCredits.length > 0
                      ? "Pick the day you worked on a weekly off or public holiday. Your approver verifies official duty."
                      : `Compensatory leave must be availed within ${selectedConfig.validityDays || 90} days of the worked date.`}
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
              <button onClick={closeApplyForm} className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
              <button
                onClick={handleApplyLeave}
                disabled={isSubmitting || (isCompOffSelected && availableCompOffCredits.length === 0)}
                className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting
                  ? editingLeave
                    ? "Saving..."
                    : "Submitting..."
                  : editingLeave
                    ? "Save Changes"
                    : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDeleteLeave(deleteTarget)}
        title="Delete Leave Request"
        message={
          deleteTarget
            ? `Delete your ${deleteTarget.type || "leave"} request for ${formatStoredDates(deleteTarget.dates)}? This cannot be undone.`
            : "Delete this leave request? This cannot be undone."
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
      />

      {showToast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg shrink-0">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
