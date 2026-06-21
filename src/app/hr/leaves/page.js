"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function LeaveWorkflow() {
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (currentUser && currentUser.roleName !== "ADMIN" && currentUser.roleName !== "HR") {
      router.push("/hr/leaves/apply");
    } else if (token) {
      fetchLeaves();
    }
  }, [token, currentUser, router]);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        headers: { Authorization: `Bearer ${token}` }
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

  const handleUpdateStatus = async (leaveId, newStatus) => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
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

  if (currentUser && currentUser.roleName !== "ADMIN" && currentUser.roleName !== "HR") {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">Administration Module</p>
          <h2 className="text-3xl md:text-[2.75rem] font-headline font-semibold tracking-tight leading-none text-on-surface">Human Resources &amp; Personnel</h2>
        </div>
      </div>

      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        <Link href="/hr" className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent">
          Team Directory
        </Link>
        <Link href="/hr/attendance" className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent">
          Attendance Logs
        </Link>
        <div className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-semibold text-primary border-b-2 border-primary cursor-default">
          Leave Workflow
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-xl text-on-surface">Leave Requests</h3>
          <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
            {leaves.length} Request{leaves.length !== 1 && "s"}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4 px-4 font-bold text-on-surface">{leave.user?.name || "Unknown"}</td>
                  <td className="py-4 px-4 text-xs font-semibold text-slate-500">{leave.user?.role?.name?.replace("_", " ")}</td>
                  <td className="py-4 px-4 text-xs text-on-surface-variant">{leave.type}</td>
                  <td className="py-4 px-4 font-mono text-xs">{leave.dates}</td>
                  <td className="py-4 px-4 text-xs text-on-surface-variant max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      leave.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      leave.status === "REJECTED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 flex gap-2">
                    {leave.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(leave.id, "APPROVED")}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg text-xs font-bold transition-colors"
                          title="Approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(leave.id, "REJECTED")}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg text-xs font-bold transition-colors"
                          title="Reject"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-on-surface-variant">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
