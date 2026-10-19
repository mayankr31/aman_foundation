"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/date";
import { formatINR, REIMBURSEMENT_STATUSES } from "@/lib/reimbursementCategories";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import ReimbursementStatusBadge from "@/components/reimbursements/ReimbursementStatusBadge";
import ReimbursementSummary from "@/components/reimbursements/ReimbursementSummary";

const FILTERS = ["ALL", ...REIMBURSEMENT_STATUSES];

function claimYear(claim) {
  const date = new Date(claim?.createdAt || Date.now());
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

export default function ReimbursementsPage() {
  const { token, user, isInitializing, can } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [claimToDelete, setClaimToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const canWrite = can("reimbursements", "WRITE");

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.replace("/");
      return;
    }
    if (user.roleName === "ADMIN") {
      router.replace("/reimbursements/manage");
      return;
    }
    if (!can("reimbursements")) {
      router.replace("/");
      return;
    }
    if (!token) return;

    let cancelled = false;
    const loadClaims = async () => {
      try {
        const res = await fetch("/api/reimbursements", {
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
        console.error("Fetch reimbursements error:", error);
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

  const filteredClaims = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return claims.filter((claim) => {
      const matchesStatus = statusFilter === "ALL" || claim.status === statusFilter;
      const matchesSearch =
        !query ||
        (claim.title || "").toLowerCase().includes(query) ||
        (claim.purpose || "").toLowerCase().includes(query) ||
        claimYear(claim).includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [claims, statusFilter, searchQuery]);

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

  const handleDelete = async () => {
    if (!claimToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reimbursements/${claimToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete claim.");
      }
      setClaims((previous) => previous.filter((claim) => claim.id !== claimToDelete.id));
      if (selected?.id === claimToDelete.id) setSelected(null);
      setClaimToDelete(null);
      toast.success("Reimbursement claim deleted.");
    } catch (error) {
      console.error("Delete reimbursement error:", error);
      toast.error(error.message || "Failed to delete claim.");
    } finally {
      setDeleting(false);
    }
  };

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Staff Expenses
          </p>
          <h1 className="page-title text-on-surface">Reimbursements</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Submit expense claims and track their approval and payment.
          </p>
        </div>
        {canWrite && (
          <Link
            href="/reimbursements/new"
            className="gradient-primary bg-primary text-on-primary px-4 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-glow w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Claim
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pending Claims</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">{formatINR(totals.pending)}</p>
          <p className="text-xs text-amber-700 mt-1">{totals.pendingCount} awaiting review</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Approved</p>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{formatINR(totals.approved)}</p>
          <p className="text-xs text-emerald-700 mt-1">{totals.approvedCount} awaiting payment</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Reimbursed</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{formatINR(totals.reimbursed)}</p>
          <p className="text-xs text-blue-700 mt-1">Total paid out to you</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-ambient border border-outline-variant/10 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
        <div className="relative w-full lg:w-72">
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

      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">receipt_long</span>
            <p className="text-on-surface-variant font-medium">
              {claims.length === 0 ? "No reimbursement claims yet." : "No claims match this filter."}
            </p>
            {claims.length === 0 && canWrite && (
              <Link href="/reimbursements/new" className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">
                Submit your first claim
              </Link>
            )}
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div key={claim.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface truncate">{claim.title}</h3>
                    <ReimbursementStatusBadge status={claim.status} />
                  </div>
                  {claim.purpose && (
                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{claim.purpose}</p>
                  )}
                  <p className="text-xs text-on-surface-variant mt-2">
                    Submitted {formatDate(claim.createdAt)} · {claim.items?.length || 0} expense line{(claim.items?.length || 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Claimed</p>
                  <p className="text-lg font-bold text-on-surface">{formatINR(claim.totalClaimed)}</p>
                  {claim.status === "REIMBURSED" && (
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      {formatINR(claim.totalReimbursed ?? claim.totalApproved)} reimbursed
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setSelected(claim)}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  View Details
                </button>
                {canWrite && claim.status === "PENDING" && (
                  <>
                    <Link
                      href={`/reimbursements/new?id=${claim.id}`}
                      className="px-3 py-1.5 rounded-full border border-outline-variant text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setClaimToDelete(claim)}
                      className="px-3 py-1.5 rounded-full border border-error/20 text-error text-xs font-semibold hover:bg-error-container/20 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-outline-variant/10">
            <div className="flex items-center justify-between border-b border-surface-container-high px-6 py-4">
              <h3 className="text-lg font-bold text-on-surface">Reimbursement Details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              <ReimbursementSummary reimbursement={selected} />
            </div>
            <div className="flex justify-end gap-2 border-t border-surface-container-high px-6 py-4">
              {canWrite && selected.status === "PENDING" && (
                <Link
                  href={`/reimbursements/new?id=${selected.id}`}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors"
                >
                  Edit Claim
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={Boolean(claimToDelete)}
        onClose={() => setClaimToDelete(null)}
        onConfirm={handleDelete}
        title="Delete reimbursement claim?"
        message={`This will permanently delete "${claimToDelete?.title || "this claim"}". This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
