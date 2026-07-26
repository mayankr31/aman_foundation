"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function TravelPage() {
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "" });

  const [showNewModal, setShowNewModal] = useState(false);
  const [newDestination, setNewDestination] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newExpectedExpenses, setNewExpectedExpenses] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState([{ category: "", amount: "", description: "" }]);
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseFiles, setExpenseFiles] = useState([]);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  useEffect(() => {
    if (!isInitializing && (!user || user.roleName !== "FELLOW")) {
      router.replace("/");
      return;
    }
    if (token && user?.roleName === "FELLOW") {
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

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newDestination || !newPurpose || !newStartDate || !newEndDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/travel-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: newDestination,
          purpose: newPurpose,
          startDate: newStartDate,
          endDate: newEndDate,
          expectedExpenses: parseFloat(newExpectedExpenses) || 0
        })
      });
      const json = await res.json();
      if (json.success) {
        setRequests(prev => [json.data, ...prev]);
        setShowNewModal(false);
        setNewDestination("");
        setNewPurpose("");
        setNewStartDate("");
        setNewEndDate("");
        setNewExpectedExpenses("");
        triggerToast("Travel request submitted!");
      } else {
        triggerToast(json.error || "Failed to submit");
      }
    } catch (e) {
      triggerToast("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!showExpenseModal) return;
    setSubmittingExpense(true);
    try {
      const validDetails = expenseDetails.filter(d => d.category && d.amount);
      const totalAmount = validDetails.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

      const formData = new FormData();
      formData.append("actualExpense", totalAmount);
      formData.append("expenseDetails", JSON.stringify(validDetails));
      formData.append("notes", expenseNotes);
      expenseFiles.forEach((file, idx) => {
        formData.append(`receipt_${idx}`, file);
      });

      const res = await fetch(`/api/travel-requests/${showExpenseModal.id}/expenses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setShowExpenseModal(null);
        setExpenseDetails([{ category: "", amount: "", description: "" }]);
        setExpenseNotes("");
        setExpenseFiles([]);
        triggerToast("Expense submitted!");
        fetchRequests();
      } else {
        triggerToast(json.error || "Failed to submit expense");
      }
    } catch (e) {
      triggerToast("An error occurred");
    } finally {
      setSubmittingExpense(false);
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

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-headline font-black text-on-surface mb-2">Travel Requests</h2>
          <p className="text-sm text-on-surface-variant">Submit and manage your travel requests.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Travel Request
        </button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">flight</span>
            <p className="text-on-surface-variant font-medium">No travel requests yet.</p>
            <p className="text-xs text-slate-400 mt-1">Submit a new travel request to get started.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-on-surface">{req.destination}</h3>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-sm text-on-surface-variant">{req.purpose}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                  </p>
                  <p className="font-bold text-on-surface mt-1">
                    Estimated: {req.expectedExpenses?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "N/A"}
                  </p>
                </div>
              </div>

              {req.status === "REJECTED" && req.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                  <p className="text-xs font-bold text-rose-700 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-rose-800">{req.rejectionReason}</p>
                </div>
              )}

              {req.status === "APPROVED" && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-600 font-semibold">
                    Approved by {req.approver?.name || "Manager"} on {new Date(req.approvedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setShowExpenseModal(req)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Submit Actual Expenses
                  </button>
                </div>
              )}

              {req.status === "COMPLETED" && req.expenses && req.expenses.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-2">Actual Expense Report</p>
                  <p className="font-bold text-lg text-on-surface">
                    Total: {req.expenses[0].actualExpense?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </p>
                  {req.expenses[0].expenseDetails && Array.isArray(req.expenses[0].expenseDetails) && (
                    <div className="mt-2 space-y-1">
                      {req.expenses[0].expenseDetails.map((d, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-600">
                          <span>{d.category} - {d.description}</span>
                          <span className="font-semibold">{parseFloat(d.amount)?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
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
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Travel Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">New Travel Request</h3>
              <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Destination</label>
                <input type="text" required placeholder="e.g. Guwahati, Assam"
                  value={newDestination} onChange={e => setNewDestination(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Purpose</label>
                <input type="text" required placeholder="e.g. Teacher training workshop"
                  value={newPurpose} onChange={e => setNewPurpose(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
                  <input type="date" required value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
                  <input type="date" required value={newEndDate} onChange={e => setNewEndDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Expected Expenses (INR)</label>
                <input type="number" placeholder="e.g. 5000"
                  value={newExpectedExpenses} onChange={e => setNewExpectedExpenses(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Expenses Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Submit Actual Expenses</h3>
              <button onClick={() => setShowExpenseModal(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitExpense} className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Expense Items</label>
                  <button type="button" onClick={() => setExpenseDetails([...expenseDetails, { category: "", amount: "", description: "" }])}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer">
                    + Add Item
                  </button>
                </div>
                {expenseDetails.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-start">
                    <div className="flex-1 flex flex-col gap-1">
                      <input type="text" placeholder="Category" value={item.category}
                        onChange={e => {
                          const updated = [...expenseDetails];
                          updated[idx] = { ...updated[idx], category: e.target.value };
                          setExpenseDetails(updated);
                        }}
                        className="px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-primary" />
                      <div className="flex gap-2">
                        <input type="number" placeholder="Amount" value={item.amount}
                          onChange={e => {
                            const updated = [...expenseDetails];
                            updated[idx] = { ...updated[idx], amount: e.target.value };
                            setExpenseDetails(updated);
                          }}
                          className="flex-1 px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-primary" />
                        <input type="text" placeholder="Description" value={item.description}
                          onChange={e => {
                            const updated = [...expenseDetails];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setExpenseDetails(updated);
                          }}
                          className="flex-1 px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    {expenseDetails.length > 1 && (
                      <button type="button" onClick={() => setExpenseDetails(expenseDetails.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 mt-1">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Notes (optional)</label>
                <textarea rows={2} value={expenseNotes} onChange={e => setExpenseNotes(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Upload Receipts</label>
                <input type="file" multiple onChange={e => setExpenseFiles([...expenseFiles, ...Array.from(e.target.files)])}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-xs" />
                {expenseFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expenseFiles.map((f, idx) => (
                      <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                        {f.name}
                        <button type="button" onClick={() => setExpenseFiles(expenseFiles.filter((_, i) => i !== idx))} className="text-red-500">
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(null)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submittingExpense}
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50">
                  {submittingExpense ? "Submitting..." : "Submit Expenses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[400]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
