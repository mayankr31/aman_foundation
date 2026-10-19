"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/date";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

export default function TravelManagePage() {
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "" });

  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState("All");

  const staffOptions = useMemo(
    () => Array.from(new Set(requests.map(r => r.user?.name).filter(Boolean))).sort(),
    [requests]
  );
  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter(r => {
      const matchesSearch =
        !q ||
        (r.destination || "").toLowerCase().includes(q) ||
        (r.purpose || "").toLowerCase().includes(q) ||
        (r.user?.name || "").toLowerCase().includes(q);
      const matchesStaff = staffFilter === "All" || r.user?.name === staffFilter;
      return matchesSearch && matchesStaff;
    });
  }, [requests, searchQuery, staffFilter]);
  const { pageItems: pagedRequests, currentPage, setCurrentPage } = usePagination(filteredRequests, 10);

  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  useEffect(() => {
    if (!isInitializing && user && user.roleName !== "ADMIN" && !PROGRAM_ROLES.includes(user.roleName)) {
      router.replace("/");
      return;
    }
    if (token && user) {
      fetchRequests();
    }
  }, [token, user, isInitializing]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/travel-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setRequests(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/travel-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "APPROVED" })
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.map(r => r.id === id ? json.data : r));
        triggerToast("Request approved!");
      } else {
        triggerToast(json.error || "Failed to approve");
      }
    } catch (e) {
      triggerToast("An error occurred");
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!showRejectModal || !rejectionReason.trim()) return;
    try {
      const res = await fetch(`/api/travel-requests/${showRejectModal}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "REJECTED", rejectionReason })
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.map(r => r.id === showRejectModal ? json.data : r));
        triggerToast("Request rejected");
        setShowRejectModal(null);
        setRejectionReason("");
      } else {
        triggerToast(json.error || "Failed to reject");
      }
    } catch (e) {
      triggerToast("An error occurred");
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      const res = await fetch(`/api/travel-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "COMPLETED" })
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => prev.map(r => r.id === id ? json.data : r));
        triggerToast("Marked as completed");
      } else {
        triggerToast(json.error || "Failed");
      }
    } catch (e) {
      triggerToast("An error occurred");
    }
  };

  const statusBadge = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-emerald-100 text-emerald-800",
      REJECTED: "bg-rose-100 text-rose-800",
      COMPLETED: "bg-blue-100 text-blue-800"
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full font-sans">
      <div className="mb-8">
        <h2 className="page-title text-on-surface mb-2">Travel Management</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-on-surface-variant">Review and approve travel requests.</p>
          {pendingCount > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Search</label>
          <div className="relative">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination, purpose or staff..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Staff</label>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
          >
            <option value="All">All Staff</option>
            {staffOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        {(searchQuery || staffFilter !== "All") && (
          <button
            onClick={() => { setSearchQuery(""); setStaffFilter("All"); }}
            className="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors text-xs font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">flight</span>
            <p className="text-on-surface-variant font-medium">No travel requests found.</p>
          </div>
        ) : (
          pagedRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-on-surface">{req.destination}</h3>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-sm text-on-surface-variant">{req.purpose}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Requested by: <span className="font-semibold text-on-surface">{req.user?.name}</span>
                    {req.user?.department && <span> • {req.user.department}</span>}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    {formatDate(req.startDate)} - {formatDate(req.endDate)}
                  </p>
                  <p className="font-bold text-on-surface mt-1">
                    Est: {req.expectedExpenses?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "N/A"}
                  </p>
                </div>
              </div>

              {req.status === "PENDING" && (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { setShowRejectModal(req.id); setRejectionReason(""); }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              )}

              {req.status === "REJECTED" && req.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                  <p className="text-xs font-bold text-rose-700 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-rose-800">{req.rejectionReason}</p>
                  {req.approver && (
                    <p className="text-xs text-rose-600 mt-1">
                      Rejected by {req.approver.name} on {formatDate(req.approvedAt)}
                    </p>
                  )}
                </div>
              )}

              {req.status === "APPROVED" && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-600 font-semibold">
                    Approved by {req.approver?.name || "Manager"} on {formatDate(req.approvedAt)}
                  </span>
                  <button
                    onClick={() => handleMarkCompleted(req.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Mark as Completed
                  </button>
                </div>
              )}

              {req.status === "COMPLETED" && req.expenses && req.expenses.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-2">Actual Expense Report</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-on-surface">
                        {req.expenses[0].actualExpense?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </p>
                      <p className="text-xs text-slate-500">Total Actual Expense</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface">
                        {req.expectedExpenses?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500">Expected Expense</p>
                    </div>
                  </div>
                  {req.expenses[0].expenseDetails && Array.isArray(req.expenses[0].expenseDetails) && (
                    <div className="mt-3 space-y-1">
                      {req.expenses[0].expenseDetails.map((d, idx) => (
                        <div key={idx} className="flex justify-between gap-3 text-sm text-slate-600">
                          <span className="min-w-0 break-words">{d.category} - {d.description}</span>
                          <span className="font-semibold shrink-0">{parseFloat(d.amount)?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(req.expenses[0].receiptFiles) && req.expenses[0].receiptFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {req.expenses[0].receiptFiles.map((file, idx) => (
                        <a key={idx} href={file} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline bg-white px-2 py-1 rounded border border-gray-200">
                          Receipt {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {req.expenses[0].notes && (
                    <p className="text-xs text-slate-500 mt-2">Notes: {req.expenses[0].notes}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <Pagination currentPage={currentPage} totalItems={filteredRequests.length} itemsPerPage={10} onPageChange={setCurrentPage} />
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Reject Travel Request</h3>
              <button onClick={() => setShowRejectModal(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleReject} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Rejection Reason</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRejectModal(null)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[400]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
