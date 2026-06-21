"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function AttendanceModal({ isOpen, onClose }) {
  const { token, user } = useAuth();
  
  const [currentLog, setCurrentLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (isOpen && token && user) {
      fetchTodayLog();
    }
  }, [isOpen, token, user]);

  const fetchTodayLog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;
        
        const log = data.data.find(l => l.userId === user.id && l.logdate === today);
        if (log) {
          setCurrentLog(log);
          if (log.ef1) {
            try { 
              const parsed = JSON.parse(log.ef1); 
              if (Array.isArray(parsed)) {
                setTasks(parsed);
              } else if (parsed.checklistItems && Array.isArray(parsed.checklistItems)) {
                setTasks(parsed.checklistItems);
              } else {
                setTasks([]);
              }
            } catch (e) {
              setTasks([]);
            }
          }
        } else {
          setCurrentLog(null);
          setTasks([]);
        }
      }
    } catch (error) {
      triggerToast("Error fetching attendance");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US'); // Ensure consistent AM/PM
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

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
          logininfo: navigator.userAgent
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        triggerToast("Checked in successfully!");
      }
    } catch (e) {
      triggerToast("Check in failed");
    }
  };

  const handleCheckOut = async () => {
    if (!currentLog) return;
    
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

    const formattedEf1 = JSON.stringify({
      action: "Check Out",
      submittedAt: outTimeStr,
      checklistItems: tasks,
      checkoutData: {
        completedItems: tasks.filter(t => t.completed).map(t => t.id),
        notes: "Completed daily tasks",
        submittedAt: outTimeStr
      }
    });

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
          ef1: formattedEf1
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLog(data.data);
        triggerToast("Checked out successfully!");
      }
    } catch (e) {
      triggerToast("Check out failed");
    }
  };

  const addTask = () => {
    if (newTask.trim() === "") return;
    const newTasks = [...tasks, { id: Date.now().toString(), text: newTask, completed: false }];
    setTasks(newTasks);
    setNewTask("");
    saveTasks(newTasks);
  };

  const toggleTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const removeTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const saveTasks = async (updatedTasks) => {
    if (!currentLog) return;
    
    const interimEf1 = JSON.stringify({
      action: "Check In",
      submittedAt: currentLog.intimelog,
      checklistItems: updatedTasks
    });

    try {
      await fetch('/api/attendance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: currentLog.id,
          ef1: interimEf1
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const isCheckedIn = !!currentLog;
  const isCheckedOut = currentLog && currentLog.outtimelog;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-10 relative mt-10 md:mt-0 font-sans">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="mb-8">
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 font-sans">Fellow Workspace</p>
          <h2 className="text-3xl font-headline font-semibold tracking-tight text-on-surface">Daily Attendance</h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {/* Status Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
              <h3 className="font-bold text-lg mb-4 text-on-surface">Current Status</h3>
              
              <div className="space-y-4 mb-6">
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
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Check In
                </button>
              ) : !isCheckedOut ? (
                <button
                  onClick={handleCheckOut}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Check Out
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg text-center border border-slate-200">
                  Shift Completed ({currentLog.workhours})
                </div>
              )}
            </div>

            {/* Tasks Card */}
            <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 flex flex-col ${!isCheckedIn ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-lg mb-4 text-on-surface">Daily Tasks</h3>
              
              <div className="flex gap-2 mb-4 shrink-0">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What are you working on?"
                  className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-transparent text-sm text-on-surface"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-bold shadow-md shadow-blue-600/20 transition-colors">
                  Add
                </button>
              </div>

              <div className="space-y-2 flex-grow overflow-y-auto pr-2 no-scrollbar">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg group border border-transparent hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer border-slate-300"
                      />
                      <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-on-surface font-medium'}`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-white rounded-md p-1 shadow-sm border border-slate-200"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">delete</span>
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-200">checklist</span>
                    <p className="text-sm text-on-surface-variant font-medium">No tasks added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[300]">
            <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
