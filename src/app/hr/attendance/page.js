"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import usePagination from "@/lib/usePagination";
import OnLeaveToday from "@/components/OnLeaveToday";
import { SHIFT_LABEL, computeAttendanceMetrics } from "@/lib/attendanceMetrics";
import { formatDate } from "@/lib/date";
import AttendanceLocation from "@/components/AttendanceLocation";
import {
  TASK_TIME_SLOT_CLASSES,
  TASK_TIME_SLOT_LABELS,
  normalizeTaskTimeSlot,
} from "@/lib/taskSlots";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function logRecency(log) {
  return [log?.logdate || "", new Date(log?.checkInAt || log?.createdAt || 0).getTime()];
}

function isNewerLog(candidate, current) {
  const [candidateDate, candidateTime] = logRecency(candidate);
  const [currentDate, currentTime] = logRecency(current);
  if (candidateDate !== currentDate) return candidateDate > currentDate;
  return candidateTime > currentTime;
}

export default function HrAttendanceLogs() {
  const router = useRouter();
  const { token, user } = useAuth();
  const canReview = ["ADMIN", "HR", ...PROGRAM_ROLES].includes(user?.roleName);
  
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Task Modal
  const [selectedTaskLog, setSelectedTaskLog] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [token]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const attRes = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const attData = await attRes.json();
      if (attRes.ok) {
        setAttendanceLogs(attData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [attendanceSearch, setAttendanceSearch] = useState("");



  const handleTaskClick = (log) => {
    setSelectedTaskLog(log);
    setShowTaskModal(true);
  };

  // Group logs by user, keeping each employee's most recent attendance date.
  const groupedAttendance = useMemo(() => {
    const map = new Map();
    attendanceLogs.forEach(log => {
      const existing = map.get(log.userId);
      if (!existing || isNewerLog(log, existing)) {
        map.set(log.userId, log);
      }
    });

    return Array.from(map.values())
      .filter(log => {
        const name = log.user?.name || log.email || "";
        return name.toLowerCase().includes(attendanceSearch.toLowerCase());
      })
      .sort((a, b) => {
        const [aDate, aTime] = logRecency(a);
        const [bDate, bTime] = logRecency(b);
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return bTime - aTime;
      });
  }, [attendanceLogs, attendanceSearch]);

  const { pageItems: pagedAttendance, currentPage, setCurrentPage } = usePagination(groupedAttendance, 10);

  const renderStatusPill = (status) => {
    let dotColor = "bg-emerald-500 animate-pulse";
    let badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
    if (status?.toLowerCase() === "no data" || status?.toLowerCase() === "absent") {
      dotColor = "bg-rose-500";
      badgeClass = "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30";
    } else if (status?.toLowerCase().includes("logged in") || status?.toLowerCase().includes("working") || status?.toLowerCase().includes("check")) {
      dotColor = "bg-blue-500";
      badgeClass = "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        {status || 'Working'}
      </span>
    );
  };

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
            {canReview ? "Human Resources & Personnel" : "My Attendance"}
          </h2>
        </div>
      </div>

      {canReview && <OnLeaveToday className="mb-6" />}

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Loading attendance data...</div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  {canReview ? "Daily Attendance Ledger" : "My Attendance"}
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-1">Standard shift: {SHIFT_LABEL}</p>
              </div>
              {canReview && (
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface"
                />
              )}
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="mobile-card-table w-full min-w-[760px] table-fixed text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                    <th className="w-[26%] py-3 px-4">Employee</th>
                    <th className="w-[14%] py-3 px-4">Status</th>
                    <th className="w-[14%] py-3 px-4">Work Hours</th>
                    <th className="w-[14%] py-3 px-4">Login Time</th>
                    <th className="w-[20%] py-3 px-4">Daily Tasks</th>
                    <th className="w-[12%] py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAttendance.map((log) => {
                    const name = log.user?.name || log.email || "Unknown";
                    const initial = name.charAt(0).toUpperCase();
                    const metrics = computeAttendanceMetrics(log);
                    
                    return (
                      <tr key={log.id} onClick={() => router.push(`/hr/attendance/${log.userId}`)} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                        <td data-label="" className="py-4 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-sm shrink-0">
                              {initial}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-on-surface text-[13px] break-words">{name}</span>
                              <span className="text-[11px] text-on-surface-variant/70 break-words">{log.email}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Status" className="py-4 px-4">{renderStatusPill(log.workstatus)}</td>
                        <td data-label="Work Hours" className="py-4 px-4 text-on-surface font-medium text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span>{metrics?.autoClosed ? "—" : log.workhours || metrics?.workHours || "N/A"}</span>
                            {metrics?.extraSeconds > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600">
                                +{metrics.extraHours} extra
                              </span>
                            )}
                            {metrics?.autoClosed && (
                              <span className="text-[9px] font-semibold text-amber-600">Auto checkout</span>
                            )}
                          </div>
                        </td>
                        <td data-label="Login Time" className="py-4 px-4 text-on-surface text-xs font-semibold">
                          <div className="flex flex-col gap-0.5">
                            <span>{log.intimelog || "N/A"}</span>
                            {log.logdate && (
                              <span className="text-[10px] font-medium text-slate-400">
                                {formatDate(log.logdate)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Daily Tasks" className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            {log.taskDetails && log.taskDetails.length > 0 ? (() => {
                              const completed = log.taskDetails.filter(t => t.completed).length;
                              const pending = log.taskDetails.length - completed;
                              return (
                                <button onClick={(e) => { e.stopPropagation(); handleTaskClick(log); }} className="flex flex-col items-start gap-0.5 cursor-pointer">
                                  <span className="flex items-center gap-1 text-blue-600 hover:underline">
                                    <span className="material-symbols-outlined text-[18px]">check_box</span>
                                    <span>{log.taskDetails.length} {log.taskDetails.length === 1 ? 'task' : 'tasks'}</span>
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    ({pending} pending, {completed} completed)
                                  </span>
                                </button>
                              );
                            })() : (
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                <span>No tasks</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Actions" className="py-4 px-4 text-right">
                          <button 
                            onClick={() => router.push(`/hr/attendance/${log.userId}`)}
                            className="text-blue-600 hover:underline hover:opacity-85 font-bold cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {groupedAttendance.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-on-surface-variant">No attendance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalItems={groupedAttendance.length} itemsPerPage={10} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTaskLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto font-sans">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Daily Tasks{selectedTaskLog.logdate ? ` — ${formatDate(selectedTaskLog.logdate)}` : ""}
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3">
                {(() => {
                  const checklistItems = selectedTaskLog.taskDetails;
                  
                  if (Array.isArray(checklistItems) && checklistItems.length > 0) {
                    return (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Checklist Items:</h4>
                        <ul className="space-y-2">
                          {checklistItems.map((item, index) => {
                            const isCompleted = item.completed;
                            return (
                              <li key={item.id || index} className="flex items-start gap-1">
                                <span className={`mr-2 material-symbols-outlined text-[20px] shrink-0 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                                  {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                                <div className="flex flex-col">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded w-fit mb-1 ${TASK_TIME_SLOT_CLASSES[normalizeTaskTimeSlot(item.timeSlot)]}`}>
                                    {TASK_TIME_SLOT_LABELS[normalizeTaskTimeSlot(item.timeSlot)]}
                                  </span>
                                  <span className={isCompleted ? 'text-gray-600 line-through' : 'text-gray-700'}>
                                    {item.text}
                                  </span>
                                  {item.description && (
                                    <span className="text-xs text-slate-500 mt-0.5">{item.description}</span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  }
                  return <p className="text-gray-500">No checklist items available</p>;
                })()}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Check In</p>
                      <p className="font-bold text-gray-800">{selectedTaskLog.intimelog || 'N/A'}</p>
                      <AttendanceLocation
                        lat={selectedTaskLog.checkInLat}
                        lng={selectedTaskLog.checkInLng}
                        accuracy={selectedTaskLog.checkInAccuracy}
                        className="mt-2"
                      />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Check Out</p>
                      <p className="font-bold text-gray-800">{selectedTaskLog.outtimelog || 'N/A'}</p>
                      <AttendanceLocation
                        lat={selectedTaskLog.checkOutLat}
                        lng={selectedTaskLog.checkOutLng}
                        accuracy={selectedTaskLog.checkOutAccuracy}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
