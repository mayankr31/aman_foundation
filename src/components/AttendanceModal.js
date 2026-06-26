"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

function TaskCommentsModal({ task, onClose, token }) {
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
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
                  <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
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

export default function AttendanceModal({ isOpen, onClose }) {
  const { token, user } = useAuth();
  
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

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (isOpen && token && user) {
      fetchTodayLogAndTasks();
      setCheckoutMode(false);
    }
  }, [isOpen, token, user]);

  const fetchTodayLogAndTasks = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const today = `${yyyy}-${mm}-${dd}`;

      // Fetch Attendance Log
      const resLog = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataLog = await resLog.json();
      if (resLog.ok && dataLog.data) {
        const log = dataLog.data.find(l => l.userId === user.id && l.logdate === today);
        setCurrentLog(log || null);
      }

      // Fetch Tasks
      if (user.fellowId) {
        const resTasks = await fetch(`/api/fellows/${user.fellowId}/tasks?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataTasks = await resTasks.json();
        if (dataTasks.success) {
          setTasks(dataTasks.data);
        }
      }
    } catch (error) {
      triggerToast("Error fetching attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US');
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

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
          checkInLng: lng
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
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
    
    const now = new Date();
    const outTimeStr = now.toLocaleTimeString('en-US');
    
    let workhours = "0 hrs";
    if (currentLog.intimelog) {
      try {
        const parts = currentLog.intimelog.split(" ");
        let timePart = parts[0];
        let modifier = parts[1] || "";
        let [hours, minutes] = timePart.split(":");
        hours = parseInt(hours || 0, 10);
        minutes = parseInt(minutes || 0, 10);
        
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
        
        const inDate = new Date();
        inDate.setHours(hours, minutes, 0, 0);
        
        const diffMs = now - inDate;
        if (diffMs > 0) {
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.floor((diffMs % 3600000) / 60000);
          workhours = `${diffHrs}h ${diffMins}m`;
        }
      } catch (err) {
        console.error("Time parsing error", err);
      }
    }

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
          outtimelog: outTimeStr,
          workhours,
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
    if (!user.fellowId) return;
    
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const today = `${yyyy}-${mm}-${dd}`;

      const res = await fetch(`/api/fellows/${user.fellowId}/tasks`, {
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
      await fetch(`/api/tasks/${taskId}`, {
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

  if (!isOpen) return null;

  const isCheckedIn = !!currentLog;
  const isCheckedOut = currentLog && currentLog.outtimelog;
  
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const pendingTasks = tasks.length - completedTasks;

  const todayStr = new Date().toDateString();

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-10 relative mt-10 md:mt-0 font-sans">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>

        <div className="mb-8">
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 font-sans">Fellow Workspace</p>
          <h2 className="text-3xl font-headline font-semibold tracking-tight text-on-surface">Daily Attendance & Tasks</h2>
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
              <h4 className="font-bold mb-3">Today's Tasks Overview</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === "Completed"}
                        onChange={() => toggleTaskStatus(task.id, task.status)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer border-slate-300"
                      />
                      <span className={`text-sm ${task.status === "Completed" ? 'line-through text-slate-400' : 'text-on-surface font-medium'}`}>
                        {task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedTaskForComments(task)}
                      className="text-primary hover:bg-primary/10 transition-colors cursor-pointer rounded-md px-2 py-1 flex items-center gap-1 text-xs font-semibold"
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
                className="px-6 py-3 border rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCheckOut}
                disabled={isCheckingOut}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/20 flex justify-center items-center gap-2"
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
                  <span className="font-semibold text-on-surface text-sm">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-container">
                  <span className="text-on-surface-variant font-medium text-sm">Check-in Time</span>
                  <span className="font-semibold text-emerald-600 text-sm">{currentLog?.intimelog || "Not checked in"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-container">
                  <span className="text-on-surface-variant font-medium text-sm">Check-out Time</span>
                  <span className="font-semibold text-rose-600 text-sm">{currentLog?.outtimelog || "--:--"}</span>
                </div>
              </div>

              {!isCheckedIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex justify-center items-center gap-2"
                >
                  {isCheckingIn && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                  {isCheckingIn ? "Checking in..." : "Check In"}
                </button>
              ) : !isCheckedOut ? (
                <button
                  onClick={() => setCheckoutMode(true)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/20"
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
              
              {!isCheckedIn && (
                <div className="flex gap-2 mb-4 shrink-0">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add an unplanned task..."
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
                  const isCarriedForward = new Date(task.plannedDate).toDateString() !== todayStr;
                  return (
                    <div key={task.id} className="flex flex-col p-3 bg-surface-container rounded-lg border border-slate-200 transition-colors group">
                      <div className="flex items-center gap-2 mb-2">
                        {isCarriedForward && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">Carried Forward</span>
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
                          {isCheckedIn && !isCheckedOut ? (
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
                          <div>
                            <span className={`text-sm ${task.status === "Completed" ? 'line-through text-slate-400' : 'text-on-surface font-medium'}`}>
                              {task.title}
                            </span>
                            {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedTaskForComments(task)}
                          className="text-slate-400 hover:text-primary transition-colors cursor-pointer rounded-md p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100"
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
          </div>
        )}

        {showToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[400]">
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
          />
        )}
      </div>
    </div>
  );
}
