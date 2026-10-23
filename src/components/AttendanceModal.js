"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { formatDate, formatDateTime } from "@/lib/date";
import { getISTDateKey } from "@/lib/time";
import AttendanceTimer from "@/components/AttendanceTimer";

function TaskCommentsModal({ task, onClose, token, commentsBase = "/api/tasks" }) {
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${commentsBase}/${task.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.data]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative font-sans max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-2">
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>
        <h3 className="text-xl font-bold mb-2 pr-8">{task.title}</h3>
        <div className="flex gap-2 mb-4">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${task.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}`}>
            {task.status}
          </span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${task.isPlanned ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
            {task.isPlanned ? "Planned" : "Unplanned"}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No comments yet.</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-white p-3 rounded shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-slate-700">{c.author?.name || "User"}</span>
                  <span className="text-[10px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600">{c.text}</p>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleAddComment} className="flex gap-2 mt-auto">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors">
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AttendanceModal({ isOpen, onClose, onStatusChange }) {
  const { token, user, can } = useAuth();

  const isFellow = user?.roleName === "FELLOW";
  const canWrite = can("self-attendance", "WRITE");
  const tasksBase = "/api/tasks";
  const taskItemBase = "/api/tasks";

  const workspaceLabel = (() => {
    const roleName = user?.roleName;
    if (!roleName) return "Workspace";
    if (roleName === "FELLOW") return "Fellow Workspace";
    if (roleName === "PROGRAM_MANAGER") return "PM Workspace";
    const pretty = roleName
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `${pretty} Workspace`;
  })();

  const [currentLog, setCurrentLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [checkoutMode, setCheckoutMode] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [lessonPlanText, setLessonPlanText] = useState("");
  const [lessonPlanFiles, setLessonPlanFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingLP, setIsUploadingLP] = useState(false);
  const [isTeachingDay, setIsTeachingDay] = useState(true);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchTodayLogAndTasks = async () => {
    setIsLoading(true);
    try {
      const today = getISTDateKey();

      // Fetch Attendance Log
      const resLog = await fetch('/api/attendance?includeDrafts=1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataLog = await resLog.json();
      if (resLog.ok && dataLog.data) {
        const log = dataLog.data.find(l => l.userId === user.id && l.logdate === today);
        setCurrentLog(log || null);
        if (log) {
          setLessonPlanText(log.lessonPlanText || "");
          setLessonPlanFiles(Array.isArray(log.lessonPlanFiles) ? log.lessonPlanFiles : []);
          setIsTeachingDay(log.isTeachingDay !== false);
        } else {
          setLessonPlanText("");
          setLessonPlanFiles([]);
          setIsTeachingDay(true);
        }
      }

      // Fetch Tasks (today's planned/assigned + carried forward).
      const resTasks = await fetch(`${tasksBase}?daily=1&date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataTasks = await resTasks.json();
      if (dataTasks.success) {
        setTasks(dataTasks.data);
      }
    } catch (error) {
      triggerToast("Error fetching attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token && user) {
      fetchTodayLogAndTasks();
      setCheckoutMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token, user]);

  const handleCheckIn = async () => {
    if (isFellow && tasks.length === 0) {
      triggerToast("Add at least one task for today before checking in.");
      return;
    }
    setIsCheckingIn(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US');
    const dateString = getISTDateKey(now);

    let lat = null;
    let lng = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("Geolocation failed or denied:", err);
      }
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          logdate: dateString,
          intimelog: timeString,
          workstatus: `Logged in at ${timeString}`,
          logininfo: navigator.userAgent,
          checkInLat: lat,
          checkInLng: lng,
          isTeachingDay: isFellow ? isTeachingDay : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        onStatusChange?.(data.data);
        triggerToast("Checked in successfully!");
      }
    } catch (e) {
      triggerToast("Check in failed");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleConfirmCheckOut = async () => {
    if (!currentLog) return;
    setIsCheckingOut(true);
    
    let lat = null;
    let lng = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("Geolocation failed or denied:", err);
      }
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: currentLog.id,
          checkout: true,
          workstatus: "Checked out",
          logoutinfo: navigator.userAgent,
          checkOutLat: lat,
          checkOutLng: lng
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        setCheckoutMode(false);
        onStatusChange?.(data.data);
        triggerToast("Checked out successfully!");
      }
    } catch (e) {
      triggerToast("Check out failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const addTask = async () => {
    if (newTask.trim() === "") return;
    if (!tasksBase) return;

    try {
      const today = getISTDateKey();

      const res = await fetch(tasksBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTask,
          plannedDate: today,
          isPlanned: false // Unplanned task added on the day
        })
      });
      const data = await res.json();
      if (data.success) {
        setTasks([...tasks, data.data]);
        setNewTask("");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to add task");
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch(`${taskItemBase}/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
    }
  };

  const handleTeachingDayChange = async (next) => {
    if (!canWrite || next === isTeachingDay) return;
    setIsTeachingDay(next);
    if (!currentLog) return;
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: currentLog.id, isTeachingDay: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        onStatusChange?.(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLessonPlan = async () => {
    if (!lessonPlanText.trim() && selectedFiles.length === 0) return;
    setIsUploadingLP(true);
    try {
      const formData = new FormData();
      if (currentLog?.id) formData.append("logId", currentLog.id);
      formData.append("logdate", getISTDateKey());
      formData.append("lessonPlanText", lessonPlanText);
      formData.append("isTeachingDay", String(isTeachingDay));
      selectedFiles.forEach((file, idx) => {
        formData.append(`file_${idx}`, file);
      });

      const res = await fetch("/api/attendance/lesson-plan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        setLessonPlanText(data.data.lessonPlanText || "");
        setLessonPlanFiles(Array.isArray(data.data.lessonPlanFiles) ? data.data.lessonPlanFiles : []);
        setSelectedFiles([]);
        triggerToast("Lesson plan saved!");
      }
    } catch (e) {
      triggerToast("Failed to save lesson plan");
    } finally {
      setIsUploadingLP(false);
    }
  };

  const handleRemoveFile = async (fileIndex) => {
    if (!currentLog) return;
    try {
      const res = await fetch(`/api/attendance/lesson-plan?logId=${currentLog.id}&fileIndex=${fileIndex}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        setLessonPlanFiles(Array.isArray(data.data.lessonPlanFiles) ? data.data.lessonPlanFiles : []);
      }
    } catch (e) {
      triggerToast("Failed to remove file");
    }
  };

  if (!isOpen) return null;

  const isCheckedIn = !!currentLog?.intimelog;
  const isCheckedOut = !!currentLog?.outtimelog;
  
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const pendingTasks = tasks.length - completedTasks;

  const todayKey = getISTDateKey();

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-10 relative mt-10 md:mt-0 font-sans max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>

        <div className="mb-8 pr-10">
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 font-sans">{workspaceLabel}</p>
          <h2 className="text-2xl sm:text-3xl font-headline font-semibold tracking-tight text-on-surface">Daily Attendance & Tasks</h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : checkoutMode ? (
          // CHECKOUT SUMMARY SCREEN
          <div className="space-y-8 font-sans">
            <h3 className="text-2xl font-bold border-b pb-4">Checkout Summary</h3>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-3xl font-black text-slate-800">{tasks.length}</p>
                <p className="text-xs font-bold uppercase text-slate-500 mt-1">Total Tasks</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-3xl font-black text-emerald-600">{completedTasks}</p>
                <p className="text-xs font-bold uppercase text-emerald-600 mt-1">Completed</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                <p className="text-3xl font-black text-rose-600">{pendingTasks}</p>
                <p className="text-xs font-bold uppercase text-rose-600 mt-1">Pending</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-3">Today&apos;s Tasks Overview</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.status === "Completed"}
                        onChange={() => toggleTaskStatus(task.id, task.status)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer border-slate-300 shrink-0"
                      />
                      <span className={`text-sm break-words ${task.status === "Completed" ? 'line-through text-slate-400' : 'text-on-surface font-medium'}`}>
                        {task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedTaskForComments(task)}
                      className="text-primary hover:bg-primary/10 transition-colors cursor-pointer rounded-md px-2 py-1 flex items-center gap-1 text-xs font-semibold shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                      Comments ({task.comments?.length || 0})
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
              <button
                onClick={() => setCheckoutMode(false)}
                className="px-4 py-2 border rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCheckOut}
                disabled={isCheckingOut}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/20 flex justify-center items-center gap-2"
              >
                {isCheckingOut && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                {isCheckingOut ? "Checking out..." : "Confirm Check Out"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {/* Status Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 flex flex-col">
              <h3 className="font-bold text-lg mb-4 text-on-surface">Current Status</h3>
              
              <div className="space-y-4 mb-6 flex-grow">
                <div className="flex justify-between items-center py-2 border-b border-surface-container">
                  <span className="text-on-surface-variant font-medium text-sm">Date</span>
                  <span className="font-semibold text-on-surface text-sm">{formatDate(new Date())}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-container">
                  <span className="text-on-surface-variant font-medium text-sm">Check-in Time</span>
                  <span className="font-semibold text-emerald-600 text-sm">{currentLog?.intimelog || "Not checked in"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-container">
                  <span className="text-on-surface-variant font-medium text-sm">Check-out Time</span>
                  <span className="font-semibold text-rose-600 text-sm">{currentLog?.outtimelog || "--:--"}</span>
                </div>
                {isFellow && (
                  <div className="py-2 border-b border-surface-container">
                    <span className="text-on-surface-variant font-medium text-sm">Day Type</span>
                    <div className="grid grid-cols-2 gap-1 mt-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                      <button
                        type="button"
                        onClick={() => handleTeachingDayChange(true)}
                        disabled={!canWrite}
                        className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isTeachingDay
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        Teaching Day
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTeachingDayChange(false)}
                        disabled={!canWrite}
                        className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          !isTeachingDay
                            ? "bg-slate-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        Non-teaching
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {currentLog && <div className="mb-4"><AttendanceTimer log={currentLog} /></div>}

              {!isCheckedIn ? (
                <>
                  {isFellow && canWrite && tasks.length === 0 && (
                    <p className="mb-2 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-center">
                      Add at least one task for today to enable check-in.
                    </p>
                  )}
                  <button
                    onClick={handleCheckIn}
                    disabled={!canWrite || isCheckingIn || (isFellow && tasks.length === 0)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex justify-center items-center gap-2"
                  >
                    {isCheckingIn && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                    {isCheckingIn ? "Checking in..." : "Check In"}
                  </button>
                </>
              ) : !isCheckedOut ? (
                <button
                  onClick={() => setCheckoutMode(true)}
                  disabled={!canWrite}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Initiate Check Out
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg text-center border border-slate-200">
                  Shift Completed ({currentLog.workhours})
                </div>
              )}
            </div>

            {/* Tasks Card */}
            <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 flex flex-col`}>
              <h3 className="font-bold text-lg mb-4 text-on-surface">Daily Tasks</h3>
              
              {canWrite && (
                <div className="flex gap-2 mb-4 shrink-0">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task for today..."
                    className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-transparent text-sm text-on-surface"
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <button onClick={addTask} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-bold shadow-md shadow-blue-600/20 transition-colors">
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-3 flex-grow overflow-y-auto pr-2 no-scrollbar">
                {tasks.map((task) => {
                  const taskDate = task.plannedDate || task.deadline;
                  const taskDateKey = taskDate ? getISTDateKey(new Date(taskDate)) : null;
                  const isCarriedForward = taskDateKey && taskDateKey < todayKey;
                  return (
                    <div key={task.id} className="flex flex-col p-3 bg-surface-container rounded-lg border border-slate-200 transition-colors group">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {isCarriedForward && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                            {task.deadline && !task.assignedBy ? "Overdue" : "Carried Forward"}
                          </span>
                        )}
                        {task.assignedBy && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">Assigned</span>
                        )}
                        {task.priority && task.priority !== "Medium" && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === "Urgent" ? "bg-rose-100 text-rose-800" :
                            task.priority === "High" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-700"
                          }`}>{task.priority}</span>
                        )}
                        {task.isPlanned ? (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Planned</span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">Unplanned</span>
                        )}
                        {task.status === "Completed" ? (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 ml-auto">Completed</span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 ml-auto">Pending</span>
                        )}
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {canWrite && isCheckedIn && !isCheckedOut ? (
                            <input
                              type="checkbox"
                              checked={task.status === "Completed"}
                              onChange={() => toggleTaskStatus(task.id, task.status)}
                              className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary cursor-pointer border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${task.status === "Completed" ? "bg-primary border-primary text-white" : "border-slate-300"}`}>
                              {task.status === "Completed" && <span className="material-symbols-outlined text-[12px]">check</span>}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className={`text-sm break-words ${task.status === "Completed" ? 'line-through text-slate-400' : 'text-on-surface font-medium'}`}>
                              {task.title}
                            </span>
                            {task.description && <p className="text-xs text-slate-500 mt-1 break-words">{task.description}</p>}
                            {task.deadline && (
                              <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                                Due {formatDate(task.deadline)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedTaskForComments(task)}
                          className="text-slate-400 hover:text-primary transition-colors cursor-pointer rounded-md p-1 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Comments"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                          <span className="text-xs">{task.comments?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-200">checklist</span>
                    <p className="text-sm text-on-surface-variant font-medium">No tasks found for today.</p>
                  </div>
                )}
              </div>
            </div>

            {isFellow && isTeachingDay && (
            <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 mt-2">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-lg text-on-surface">Daily Lesson Plan</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">Teaching Day</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Lesson Plan Notes</label>
                    <textarea
                      value={lessonPlanText}
                      onChange={(e) => setLessonPlanText(e.target.value)}
                      placeholder="Write your daily lesson plan here..."
                      rows={4}
                      disabled={!canWrite}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface resize-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Upload Files</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {canWrite && (
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-md shadow-blue-600/20">
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Choose Files
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)])}
                        />
                      </label>
                    )}
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {selectedFiles.map((file, idx) => (
                          <div key={`new-${idx}`} className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-[14px]">description</span>
                            <span className="flex-1 truncate">{file.name}</span>
                            <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} className={`text-red-500 hover:text-red-700 ${canWrite ? "" : "hidden"}`}>
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {lessonPlanFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Uploaded Files</p>
                        <div className="space-y-1">
                          {lessonPlanFiles.map((fileUrl, idx) => (
                            <div key={`existing-${idx}`} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">description</span>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-blue-600 hover:underline">
                                {fileUrl.split("/").pop()}
                              </a>
                              <button onClick={() => handleRemoveFile(idx)} className={`text-red-500 hover:text-red-700 ${canWrite ? "" : "hidden"}`}>
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {canWrite && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveLessonPlan}
                        disabled={isUploadingLP || (!lessonPlanText.trim() && selectedFiles.length === 0)}
                        className="px-4 py-2 bg-primary hover:bg-primary-container text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isUploadingLP && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                        {isUploadingLP ? "Saving..." : "Save Lesson Plan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[400]">
            <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
            {toastMessage}
          </div>
        )}

        {selectedTaskForComments && (
          <TaskCommentsModal 
            task={selectedTaskForComments} 
            onClose={() => {
              setSelectedTaskForComments(null);
              fetchTodayLogAndTasks(); // Refresh tasks to update comment count
            }} 
            token={token} 
            commentsBase={taskItemBase}
          />
        )}
      </div>
    </div>
  );
}
