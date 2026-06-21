"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function LeaveApplication() {
  const { token, user: currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newLeave, setNewLeave] = useState({
    type: "Sick Leave",
    isMultiple: false,
    singleDate: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (token) {
      fetchLeaves();
    }
  }, [token]);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // filter for just this user's leaves to be safe
        const myLeaves = (data.data || []).filter(l => l.userId === currentUser?.id);
        setLeaves(myLeaves);
      }
    } catch (err) {
      triggerToast("Error fetching leaves");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    const dates = newLeave.isMultiple
      ? `${newLeave.fromDate} to ${newLeave.toDate}`
      : newLeave.singleDate;

    if (!dates || (newLeave.isMultiple && (!newLeave.fromDate || !newLeave.toDate))) {
      triggerToast("Please select valid dates.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: newLeave.type,
          dates,
          reason: newLeave.reason,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit leave");
      triggerToast("Leave request submitted successfully!");
      fetchLeaves();
      setIsApplying(false);
      setNewLeave({ type: "Sick Leave", isMultiple: false, singleDate: "", fromDate: "", toDate: "", reason: "" });
    } catch (err) {
      triggerToast("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  // Assume user object from context might not have updated leavesRemaining instantly unless we fetch it,
  // but we can use currentUser.leavesRemaining and currentUser.leavesTaken if they exist, or defaults.
  // Actually, we'll fetch full user details if needed, but let's just use the context or defaults.
  // The first leave's user object has the updated counts.
  const latestLeave = leaves[0];
  const leavesTaken = latestLeave ? latestLeave.user.leavesTaken : (currentUser.leavesTaken || 0);
  const leavesRemaining = latestLeave ? latestLeave.user.leavesRemaining : (currentUser.leavesRemaining ?? 15);

  return (
    <div className="p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">Self Service</p>
          <h2 className="text-3xl md:text-[2.75rem] font-headline font-semibold tracking-tight leading-none text-on-surface">Leave Application</h2>
        </div>
        <button 
          onClick={() => setIsApplying(true)}
          className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Apply for Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Leaves Taken</p>
            <h4 className="text-4xl font-headline font-bold mt-2 text-on-surface">{leavesTaken}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            <span className="material-symbols-outlined text-3xl">event_available</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-2xl shadow-ambient flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Leaves Remaining</p>
            <h4 className="text-4xl font-headline font-bold mt-2 text-on-surface">{leavesRemaining}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <span className="material-symbols-outlined text-3xl">event_busy</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-xl text-on-surface">My Leave History</h3>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Requested Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-on-surface">{leave.type}</td>
                  <td className="py-4 px-4 font-mono text-xs text-on-surface-variant">{leave.dates}</td>
                  <td className="py-4 px-4 text-xs text-on-surface-variant max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      leave.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      leave.status === "REJECTED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {leave.status}
                    </span>
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
      </div>

      {isApplying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-[2rem] shadow-2xl w-full max-w-xl p-8 relative">
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/10 pb-4">
              <h3 className="text-2xl font-headline font-bold text-on-surface">Apply for Leave</h3>
              <button onClick={() => setIsApplying(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6 mb-8 font-sans">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Leave Type</label>
                <select 
                  value={newLeave.type} 
                  onChange={e => setNewLeave({...newLeave, type: e.target.value})} 
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface dark:bg-slate-900 cursor-pointer"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <input type="checkbox" className="w-5 h-5 accent-primary rounded border-outline-variant cursor-pointer" checked={newLeave.isMultiple} onChange={e => setNewLeave({...newLeave, isMultiple: e.target.checked})} />
                <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Multiple Days</span>
              </label>

              {newLeave.isMultiple ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From Date</label>
                    <input type="date" value={newLeave.fromDate} onChange={e => setNewLeave({...newLeave, fromDate: e.target.value})} className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To Date</label>
                    <input type="date" value={newLeave.toDate} onChange={e => setNewLeave({...newLeave, toDate: e.target.value})} className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Date</label>
                  <input type="date" value={newLeave.singleDate} onChange={e => setNewLeave({...newLeave, singleDate: e.target.value})} className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</label>
                <textarea 
                  rows="3" 
                  value={newLeave.reason} 
                  onChange={e => setNewLeave({...newLeave, reason: e.target.value})} 
                  placeholder="Provide details..." 
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-outline-variant/10">
              <button onClick={() => setIsApplying(false)} className="px-6 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
              <button 
                onClick={handleApplyLeave} 
                disabled={isSubmitting} 
                className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-transform flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
