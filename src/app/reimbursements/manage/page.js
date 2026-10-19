"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/date";
import { formatINR, PAYMENT_MODES, REIMBURSEMENT_STATUSES, formatRoleLabel } from "@/lib/reimbursementCategories";
import usePagination from "@/lib/usePagination";
import Pagination from "@/components/ui/Pagination";
import ReimbursementStatusBadge from "@/components/reimbursements/ReimbursementStatusBadge";
import ReimbursementSummary from "@/components/reimbursements/ReimbursementSummary";

const FILTERS = ["ALL", ...REIMBURSEMENT_STATUSES];

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ReimbursementManagementPage() {
  const { token, user, isInitializing, can } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [approvedAmounts, setApprovedAmounts] = useState({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    reimbursedAmount: "",
    paymentMode: "Bank Transfer",
    reimbursedAt: todayInput(),
    paymentReference: "",
    paymentNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const canAct = can("reimbursement-management", "WRITE");

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.replace("/");
      return;
    }
    if (!can("reimbursement-management")) {
      router.replace("/");
      return;
    }
    if (!token) return;

    let cancelled = false;
    const loadClaims = async () => {
      try {
        const res = await fetch("/api/reimbursements?scope=manage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setClaims(json.data || []);
        } else {
          toast.error(json.error || "Failed to load reimbursement claims.");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Fetch reimbursement management error:", error);
        toast.error("Failed to load reimbursement claims.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadClaims();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, isInitializing]);

  const staffOptions = useMemo(
    () => Array.from(new Set(claims.map((claim) => claim.user?.name).filter(Boolean))).sort(),
    [claims]
  );

  const filteredClaims = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return claims.filter((claim) => {
      const matchesStatus = statusFilter === "ALL" || claim.status === statusFilter;
      const matchesStaff = staffFilter === "All" || claim.user?.name === staffFilter;
      const matchesSearch =
        !query ||
        (claim.title || "").toLowerCase().includes(query) ||
        (claim.purpose || "").toLowerCase().includes(query) ||
        (claim.user?.name || "").toLowerCase().includes(query);
      return matchesStatus && matchesStaff && matchesSearch;
    });
  }, [claims, statusFilter, staffFilter, searchQuery]);

  const { pageItems, currentPage, setCurrentPage } = usePagination(filteredClaims, 10);

  const totals = useMemo(() => {
    return claims.reduce(
      (accumulator, claim) => {
        const claimed = Number(claim.totalClaimed || 0);
        if (claim.status === "PENDING") {
          accumulator.pending += claimed;
          accumulator.pendingCount += 1;
        }
        if (claim.status === "APPROVED") {
          accumulator.approved += Number(claim.totalApproved ?? claimed);
          accumulator.approvedCount += 1;
        }
        if (claim.status === "REIMBURSED") {
          accumulator.reimbursed += Number(claim.totalReimbursed ?? claim.totalApproved ?? claimed);
        }
        return accumulator;
      },
      { pending: 0, pendingCount: 0, approved: 0, approvedCount: 0, reimbursed: 0 }
    );
  }, [claims]);

  const openClaim = (claim) => {
    const amounts = {};
    (claim.items || []).forEach((item) => {
      amounts[item.id] = item.approvedAmount ?? item.amount;
    });

    setSelected(claim);
    setActionMode(null);
    setApprovedAmounts(amounts);
    setRejectionReason("");
    setPaymentForm({
      reimbursedAmount: claim.totalApproved ?? claim.totalClaimed ?? "",
      paymentMode: "Bank Transfer",
      reimbursedAt: todayInput(),
      paymentReference: "",
      paymentNotes: "",
    });
  };

  const closeClaim = () => {
    setSelected(null);
    setActionMode(null);
  };

  const submitAction = async (payload, successMessage) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reimbursements/${selected.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Action failed.");
      }

      setClaims((previous) => previous.map((claim) => (
        claim.id === json.data.id ? json.data : claim
      )));
      setSelected(json.data);
      setActionMode(null);
      toast.success(successMessage);
    } catch (error) {
      console.error("Reimbursement action error:", error);
      toast.error(error.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = () => {
    if (!selected) return;
    const items = [];
    for (const item of selected.items || []) {
      const amount = Number.parseFloat(approvedAmounts[item.id]);
      if (!Number.isFinite(amount) || amount < 0) {
        toast.error(`Enter a valid approved amount for "${item.description}".`);
        return;
      }
      if (amount > Number(item.amount)) {
        toast.error(`Approved amount for "${item.description}" cannot exceed the claimed amount.`);
        return;
      }
      items.push({ id: item.id, approvedAmount: amount });
    }

    const total = items.reduce((sum, item) => sum + item.approvedAmount, 0);
    if (total <= 0) {
      toast.error("The total approved amount must be greater than zero.");
      return;
    }

    submitAction({ action: "APPROVE", items }, "Reimbursement claim approved.");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Enter a reason for rejecting this claim.");
      return;
    }
    submitAction({ action: "REJECT", rejectionReason }, "Reimbursement claim rejected.");
  };

  const handleReimburse = () => {
    if (!selected) return;
    const amount = Number.parseFloat(paymentForm.reimbursedAmount);
    const maximum = Number(selected.totalApproved ?? selected.totalClaimed);
    if (!Number.isFinite(amount) || amount <= 0 || amount > maximum) {
      toast.error(`Enter an amount between ₹1 and ${formatINR(maximum)}.`);
      return;
    }
    if (!paymentForm.paymentMode) {
      toast.error("Select a payment mode.");
      return;
    }
    if (paymentForm.paymentMode !== "Cash" && !paymentForm.paymentReference.trim()) {
      toast.error("Enter a payment reference for non-cash payments.");
      return;
    }
    if (!paymentForm.reimbursedAt) {
      toast.error("Select the payment date.");
      return;
    }

    submitAction(
      {
        action: "REIMBURSE",
        reimbursedAmount: amount,
        paymentMode: paymentForm.paymentMode,
        reimbursedAt: paymentForm.reimbursedAt,
        paymentReference: paymentForm.paymentReference,
        paymentNotes: paymentForm.paymentNotes,
      },
      "Claim marked as reimbursed."
    );
  };

  const approvedTotal = selected
    ? (selected.items || []).reduce((sum, item) => sum + (Number.parseFloat(approvedAmounts[item.id]) || 0), 0)
    : 0;

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full font-sans">
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
          Staff Expenses
        </p>
        <h1 className="page-title text-on-surface">Reimbursement Management</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review claims, approve or reject expenses, and record reimbursements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pending Review</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{formatINR(totals.pending)}</p>
          <p className="text-xs text-amber-700 mt-1">{totals.pendingCount} claim{totals.pendingCount === 1 ? "" : "s"} waiting</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Approved · Awaiting Payment</p>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{formatINR(totals.approved)}</p>
          <p className="text-xs text-emerald-700 mt-1">{totals.approvedCount} claim{totals.approvedCount === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Reimbursed</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{formatINR(totals.reimbursed)}</p>
          <p className="text-xs text-blue-700 mt-1">Total paid out</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient border border-outline-variant/10 mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((status) => {
            const count = status === "ALL" ? claims.length : claims.filter((claim) => claim.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === status
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {status === "ALL" ? "All" : status.toLowerCase()} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <select
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
            className="px-3 py-2 rounded-full border border-outline-variant bg-transparent text-sm text-on-surface outline-none focus:border-primary cursor-pointer"
          >
            <option value="All">All staff</option>
            {staffOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search claims..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-outline-variant bg-transparent text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">approval</span>
            <p className="text-on-surface-variant font-medium">
              {claims.length === 0 ? "No reimbursement claims to review." : "No claims match this filter."}
            </p>
          </div>
        ) : (
          pageItems.map((claim) => (
            <div key={claim.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface truncate">{claim.title}</h3>
                    <ReimbursementStatusBadge status={claim.status} />
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {claim.user?.name || "Staff member"}
                    {claim.user?.department ? ` · ${claim.user.department}` : ""}
                    {claim.user?.role?.name ? ` · ${formatRoleLabel(claim.user.role.name)}` : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Submitted {formatDate(claim.createdAt)} · {claim.items?.length || 0} expense line{(claim.items?.length || 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Claimed</p>
                  <p className="text-lg font-bold text-on-surface">{formatINR(claim.totalClaimed)}</p>
                  {claim.status === "APPROVED" && (
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      {formatINR(claim.totalApproved)} approved
                    </p>
                  )}
                  {claim.status === "REIMBURSED" && (
                    <p className="text-[11px] font-semibold text-blue-700 mt-1">
                      {formatINR(claim.totalReimbursed)} reimbursed
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => openClaim(claim)}
                  className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {claim.status === "PENDING" ? "rate_review" : "visibility"}
                  </span>
                  {claim.status === "PENDING" ? "Review Claim" : "View Details"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredClaims.length}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        className="mt-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10"
      />

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-outline-variant/10">
            <div className="flex items-center justify-between border-b border-surface-container-high px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Review Reimbursement</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Submitted by {selected.user?.name || "staff member"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeClaim}
                className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              <ReimbursementSummary reimbursement={selected} />

              {!canAct && (selected.status === "PENDING" || selected.status === "APPROVED") && (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low/20 p-3 text-xs text-on-surface-variant">
                  You have view-only access to this claim. An approver with write access can take action.
                </div>
              )}

              {canAct && selected.status === "PENDING" && (
                <div className="border-t border-surface-container-high pt-5">
                  {!actionMode && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActionMode("reject")}
                        className="px-4 py-2 rounded-full border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionMode("approve");
                          const amounts = {};
                          (selected.items || []).forEach((item) => {
                            amounts[item.id] = item.amount;
                          });
                          setApprovedAmounts(amounts);
                        }}
                        className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        Approve Claim
                      </button>
                    </div>
                  )}

                  {actionMode === "approve" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-on-surface">Approved Amounts</h4>
                        <p className="text-xs text-on-surface-variant">Adjust an item if only part of it is approved.</p>
                      </div>

                      <div className="space-y-2">
                        {(selected.items || []).map((item) => (
                          <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-2 items-center rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-3">
                            <div>
                              <p className="text-xs font-semibold text-on-surface">{item.description}</p>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">
                                {item.category} · claimed {formatINR(item.amount)}
                              </p>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={item.amount}
                              step="0.01"
                              value={approvedAmounts[item.id] ?? ""}
                              onChange={(event) => setApprovedAmounts((previous) => ({
                                ...previous,
                                [item.id]: event.target.value,
                              }))}
                              className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-surface-container-low/30 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Approved</p>
                        <p className="text-lg font-bold text-emerald-700">{formatINR(approvedTotal)}</p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActionMode(null)}
                          className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleApprove}
                          className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? "Approving..." : "Confirm Approval"}
                        </button>
                      </div>
                    </div>
                  )}

                  {actionMode === "reject" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-on-surface">Rejection Reason</h4>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        placeholder="Explain why this claim is being rejected..."
                        className="w-full px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActionMode(null)}
                          className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleReject}
                          className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? "Rejecting..." : "Confirm Rejection"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canAct && selected.status === "APPROVED" && (
                <div className="border-t border-surface-container-high pt-5">
                  {!actionMode && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActionMode("reimburse")}
                        className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Mark as Reimbursed
                      </button>
                    </div>
                  )}

                  {actionMode === "reimburse" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-on-surface">Payment Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Reimbursed Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            max={selected.totalApproved ?? selected.totalClaimed}
                            step="0.01"
                            value={paymentForm.reimbursedAmount}
                            onChange={(event) => setPaymentForm((previous) => ({ ...previous, reimbursedAmount: event.target.value }))}
                            className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Date</label>
                          <input
                            type="date"
                            value={paymentForm.reimbursedAt}
                            onChange={(event) => setPaymentForm((previous) => ({ ...previous, reimbursedAt: event.target.value }))}
                            className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Mode</label>
                          <select
                            value={paymentForm.paymentMode}
                            onChange={(event) => setPaymentForm((previous) => ({ ...previous, paymentMode: event.target.value }))}
                            className="px-3 py-2 border rounded-lg bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                          >
                            {PAYMENT_MODES.map((mode) => (
                              <option key={mode} value={mode}>{mode}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Reference</label>
                          <input
                            type="text"
                            value={paymentForm.paymentReference}
                            onChange={(event) => setPaymentForm((previous) => ({ ...previous, paymentReference: event.target.value }))}
                            placeholder={paymentForm.paymentMode === "Cash" ? "Optional for cash" : "UPI / UTR / cheque number"}
                            className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Notes</label>
                          <textarea
                            rows={2}
                            value={paymentForm.paymentNotes}
                            onChange={(event) => setPaymentForm((previous) => ({ ...previous, paymentNotes: event.target.value }))}
                            placeholder="Optional notes about this payment..."
                            className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActionMode(null)}
                          className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleReimburse}
                          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? "Saving..." : "Confirm Reimbursement"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-surface-container-high px-6 py-4">
              <button
                type="button"
                onClick={closeClaim}
                className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
