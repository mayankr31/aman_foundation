"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function MonthlyPlanner({ fellowId }) {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const res = await fetch(`/api/fellows/${fellowId}/tasks?month=${year}-${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fellowId && token) {
      fetchTasks();
    }
  }, [fellowId, currentDate, token]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handleDayClick = (date) => {
    if (!date) return;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setShowDayModal(true);
    setShowAddForm(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/fellows/${fellowId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          plannedDate: selectedDate,
          isPlanned: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setTasks([...tasks, data.data]);
        setShowAddForm(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    const completionDate = newStatus === "Completed" ? new Date().toISOString() : null;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, completionDate } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, completionDate: data.data.completionDate } : t));
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: currentStatus, completionDate: currentStatus === "Completed" ? t.completionDate : null } : t));
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getIsSunday = (dateStr) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getDay() === 0;
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline font-bold text-xl text-on-surface">Monthly Planner</h3>
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-bold text-on-surface w-32 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-surface-container-high border border-surface-container-high rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-surface-container-low p-2 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="bg-surface-container-lowest min-h-[100px]"></div>;
            
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => {
              const td = new Date(t.plannedDate);
              return td.getFullYear() === date.getFullYear() && td.getMonth() === date.getMonth() && td.getDate() === date.getDate();
            });
            const isSunday = date.getDay() === 0;
            const bgClass = isSunday ? "bg-slate-50/70" : "bg-surface-container-lowest";

            return (
              <div 
                key={i} 
                onClick={() => handleDayClick(date)}
                className={`min-h-[120px] p-2 hover:bg-slate-50 cursor-pointer transition-colors relative group flex flex-col ${bgClass}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                    date.toDateString() === new Date().toDateString() ? 'bg-primary text-white' : 'text-on-surface'
                  }`}>
                    {date.getDate()}
                  </span>
                  {!isSunday && (
                    <button className="opacity-0 group-hover:opacity-100 text-primary hover:bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center items-center h-full pb-2 mt-2 w-full">
                  {dayTasks.length > 0 ? (() => {
                    const completedCount = dayTasks.filter(t => t.status === "Completed").length;
                    const pendingCount = dayTasks.length - completedCount;
                    return (
                      <div className="flex flex-col gap-1 w-full text-[11px] font-bold text-center">
                        {pendingCount > 0 && (
                          <div className="bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 px-1.5 py-0.5 rounded-md">
                            {pendingCount} Pending
                          </div>
                        )}
                        {completedCount > 0 && (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 px-1.5 py-0.5 rounded-md">
                            {completedCount} Completed
                          </div>
                        )}
                      </div>
                    );
                  })() : isSunday ? (
                    <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-center px-1">
                      Weekend
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center px-1">
                      No task added
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDayModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Tasks for {new Date(selectedDate).toLocaleDateString()}</h3>
              <button onClick={() => setShowDayModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px] leading-none">close</span>
              </button>
            </div>
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
              {tasks.filter(t => {
                const td = new Date(t.plannedDate);
                const sd = new Date(selectedDate);
                return td.getFullYear() === sd.getFullYear() && td.getMonth() === sd.getMonth() && td.getDate() === sd.getDate();
              }).map(task => (
                <div key={task.id} className="p-3 bg-surface-container rounded-lg border border-slate-200 flex justify-between items-center group/taskitem">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.status === "Completed"}
                      onChange={() => toggleTaskStatus(task.id, task.status)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer border-slate-300"
                    />
                    <div>
                      <div className={`text-sm font-semibold ${task.status === "Completed" ? 'line-through text-slate-400 font-normal' : 'text-on-surface font-semibold'}`}>{task.title}</div>
                      {task.status === "Completed" && task.completionDate && (
                        <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          Completed on {formatDate(task.completionDate)}
                        </div>
                      )}
                      {task.description && <div className="text-xs text-slate-500 mt-1">{task.description}</div>}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover/taskitem:opacity-100 transition-opacity cursor-pointer flex shrink-0"
                    title="Delete Task"
                  >
                    <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
                  </button>
                </div>
              ))}
              {tasks.filter(t => {
                const td = new Date(t.plannedDate);
                const sd = new Date(selectedDate);
                return td.getFullYear() === sd.getFullYear() && td.getMonth() === sd.getMonth() && td.getDate() === sd.getDate();
              }).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No tasks planned for this day.</p>
              )}
            </div>

            {getIsSunday(selectedDate) ? (
              <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-4 text-center text-sm font-semibold">
                Task addition is disabled on Sunday (Weekend/Holiday).
              </div>
            ) : !showAddForm ? (
              <button 
                onClick={() => setShowAddForm(true)} 
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm font-bold text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add</span> Add New Task
              </button>
            ) : (
              <form onSubmit={handleAddTask} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-sm text-slate-700">Create New Task</h4>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary text-sm bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description (Optional)</label>
                  <textarea
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary text-sm bg-white"
                    rows="2"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium rounded-full border hover:bg-slate-200 cursor-pointer transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium rounded-full bg-primary text-white cursor-pointer hover:bg-primary-container shadow-md shadow-primary/20 transition-all">
                    Save Task
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
