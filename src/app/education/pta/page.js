"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function PtaPrograms() {
  const { token } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("Program"); // "Program" or "Event"

  const [programs, setPrograms] = useState([]);
  const [events, setEvents] = useState([]);

  // Calendar states and logic
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 3)); // June 2026
  const [selectedCell, setSelectedCell] = useState(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Padding days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Padding days from next month
  const totalCellsNeeded = calendarCells.length <= 35 ? 35 : 42;
  const nextMonthPaddingCount = totalCellsNeeded - calendarCells.length;
  for (let i = 1; i <= nextMonthPaddingCount; i++) {
    calendarCells.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  useEffect(() => {
    async function loadProgramsAndEvents() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/programs", { headers });
        const json = await res.json();
        if (json.success) {
          setPrograms(json.data);
        }
        
        const eventRes = await fetch("/api/events", { headers });
        const eventJson = await eventRes.json();
        if (eventJson.success) {
          setEvents(eventJson.data.map(ev => ({
            id: ev.id,
            title: ev.title,
            status: ev.status,
            statusClass: ev.status === "Completed" ? "bg-surface-container text-on-surface-variant" : "bg-primary-fixed text-on-primary-fixed",
            description: ev.description,
            date: new Date(ev.date).toLocaleDateString() + " • " + new Date(ev.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            location: ev.location,
            programId: ev.programId
          })));
        }
      } catch (err) {
        console.error("Failed to load programs/events:", err);
      }
    }
    loadProgramsAndEvents();
  }, [token]);

  const parseEventDate = (dateStr) => {
    try {
      const parts = dateStr.split(" • ");
      const datePart = parts[0];
      const dateObj = new Date(datePart);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj;
    } catch (e) {
      return null;
    }
  };

  const getEventsForDay = (cell) => {
    return events.filter((e) => {
      const d = parseEventDate(e.date);
      if (!d) return false;
      return (
        d.getDate() === cell.day &&
        d.getMonth() === cell.month &&
        d.getFullYear() === cell.year
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedCell(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedCell(null);
  };

  const formatEventDate = (dateStr, timeStr) => {
    if (!dateStr) return "TBD";
    const dateObj = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const yr = dateObj.getFullYear();
    
    let timeFormatted = "";
    if (timeStr) {
      const [hourStr, minStr] = timeStr.split(":");
      let hour = parseInt(hourStr);
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      hour = hour ? hour : 12;
      timeFormatted = ` • ${hour}:${minStr} ${ampm}`;
    }
    return `${monthName} ${day}, ${yr}${timeFormatted}`;
  };

  const displayedEvents = selectedCell 
    ? getEventsForDay(selectedCell)
    : events.filter((e) => {
        const d = parseEventDate(e.date);
        if (!d) return false;
        return d.getMonth() === month && d.getFullYear() === year;
      });

  // Form states
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newPriority, setNewPriority] = useState("Active");
  const [newProgramId, setNewProgramId] = useState("");

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !newDesc) return;

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      if (modalType === "Program") {
        const res = await fetch("/api/programs", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: newName,
            description: newDesc,
            duration: newDate || "Indefinite",
            participantsText: newLoc || "0 Enrolled",
            status: newPriority || "Planning",
            icon: "campaign",
            iconBg: "bg-primary/10 text-primary"
          })
        });
        const json = await res.json();
        if (json.success) {
          const loadRes = await fetch("/api/programs", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          const loadJson = await loadRes.json();
          if (loadJson.success) {
            setPrograms(loadJson.data);
          }
        } else {
          alert(json.error || "Failed to add program");
        }
      } else {
        let isoDate = new Date().toISOString();
        if (newEventDate && newEventTime) {
          isoDate = new Date(`${newEventDate}T${newEventTime}:00`).toISOString();
        } else if (newEventDate) {
          isoDate = new Date(newEventDate).toISOString();
        }
        
        const res = await fetch("/api/events", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: newName,
            description: newDesc,
            date: isoDate,
            location: newLoc || "TBD",
            status: newPriority === "Active" ? "Scheduled" : "Completed",
            programId: newProgramId || "None"
          })
        });
        const json = await res.json();
        if (json.success) {
          const loadRes = await fetch("/api/events", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          const loadJson = await loadRes.json();
          if (loadJson.success) {
            setEvents(loadJson.data.map(ev => ({
              id: ev.id,
              title: ev.title,
              status: ev.status,
              statusClass: ev.status === "Completed" ? "bg-surface-container text-on-surface-variant" : "bg-primary-fixed text-on-primary-fixed",
              description: ev.description,
              date: new Date(ev.date).toLocaleDateString() + " • " + new Date(ev.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              location: ev.location,
              programId: ev.programId
            })));
          }
        } else {
          alert(json.error || "Failed to add event");
        }
      }
    } catch (err) {
      console.error("Failed to add program/event:", err);
    }

    setNewName("");
    setNewDesc("");
    setNewDate("");
    setNewEventDate("");
    setNewEventTime("");
    setNewLoc("");
    setNewPriority("Active");
    setNewProgramId("");
    setShowAddModal(false);
  };

  return (
    <div className="flex-grow flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col px-6 md:px-12 pt-8 md:pt-12 pb-2 z-10 relative">
        <Link
          href="/education"
          className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
            arrow_back
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
            Back to Education Hub
          </span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2 font-sans">
              Education Module
            </p>
            <h1 className="text-2xl md:text-[2.75rem] font-headline font-semibold text-on-background leading-tight">
              PTA &amp; Programs Hub
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 font-sans shrink-0">
            <button
              onClick={() => {
                setModalType("Event");
                setShowAddModal(true);
              }}
              className="flex-1 md:flex-none bg-surface-container-lowest text-on-surface border border-outline-variant/30 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="whitespace-nowrap">Schedule Meeting</span>
            </button>
            <button
              onClick={() => {
                setModalType("Program");
                setShowAddModal(true);
              }}
              className="flex-1 md:flex-none bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(0,104,87,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="whitespace-nowrap">Launch Program</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="flex-grow px-6 md:px-12 pb-24 md:pb-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* Active Statistics Card */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans mb-4">
            <div className="bg-surface-container-lowest rounded-xl p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
              <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">
                Running Programs
              </p>
              <div className="text-4xl font-headline font-bold text-on-surface">{programs.length} Active</div>
              <p className="text-xs text-on-surface-variant mt-2">Continuous impact assessment</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
              <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">
                Meetings Held (YTD)
              </p>
              <div className="text-4xl font-headline font-bold text-on-surface">{events.filter(e => e.status === "Completed").length + 24}</div>
              <p className="text-xs text-on-surface-variant mt-2">Parent-Teacher linkages complete</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 pt-8 pl-8 ambient-shadow relative overflow-hidden shadow-[0_8px_24px_rgba(25,28,29,0.04)]">
              <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">
                Communication Follow-ups
              </p>
              <div className="text-4xl font-headline font-bold text-primary">4 Pending</div>
              <p className="text-xs text-on-surface-variant mt-2">Requires organizer action</p>
            </div>
          </div>

          {/* Column Left: Long Running Programs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">workspace_premium</span>
                Long-Running Programs
              </h3>
              <div className="space-y-4">
                {programs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/education/pta/program/${p.id}`}
                    className="p-4 bg-surface rounded-lg border border-surface-container hover:bg-surface-container-low transition-colors block group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2 font-sans">
                      <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">{p.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.statusClass || (p.status === "Active" ? "bg-primary-fixed text-on-primary-fixed" : "bg-secondary-container text-on-secondary-fixed")}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{p.description}</p>
                    <div className="flex justify-between text-xs text-slate-500 font-sans mt-2 pt-2 border-t border-surface-container">
                      <span>Duration: {p.duration}</span>
                      <span className="font-semibold text-primary">{p.participantsText || p.participants}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column Right: Events & PTA Meetings Calendar */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">calendar_month</span>
                Events &amp; Meetings Calendar
              </h3>
              
              {/* Calendar Control Header */}
              <div className="flex items-center justify-between mb-4 font-sans">
                <span className="text-md font-semibold text-on-surface">
                  {monthNames[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-surface-container rounded-full text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-surface-container rounded-full text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-sans text-xs mb-6">
                {/* Weekday Labels */}
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                  <div key={dayName} className="font-bold text-on-surface-variant py-2">
                    {dayName}
                  </div>
                ))}
                
                {/* Calendar Cells */}
                {calendarCells.map((cell, idx) => {
                  const dayEvents = getEventsForDay(cell);
                  const isToday = cell.day === 3 && cell.month === 5 && cell.year === 2026; // June 3, 2026
                  const isSelected = selectedCell && 
                                     selectedCell.day === cell.day && 
                                     selectedCell.month === cell.month && 
                                     selectedCell.year === cell.year;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCell(null);
                        } else {
                          setSelectedCell(cell);
                        }
                      }}
                      className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        !cell.isCurrentMonth 
                          ? "text-on-surface-variant/40 hover:bg-surface-container/50" 
                          : "text-on-surface hover:bg-surface-container"
                      } ${isSelected ? "bg-primary text-white hover:bg-primary-container" : ""} ${
                        isToday && !isSelected ? "border border-primary font-bold" : ""
                      }`}
                    >
                      <span>{cell.day}</span>
                      {dayEvents.length > 0 && (
                        <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? "bg-white" : "bg-primary"}`}></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Event Listings for Month/Day */}
              <div className="border-t border-surface-container-highest pt-4">
                <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center justify-between font-sans">
                  <span>
                    {selectedCell 
                      ? `Events on ${monthNames[selectedCell.month]} ${selectedCell.day}, ${selectedCell.year}` 
                      : `Events in ${monthNames[month]} ${year}`}
                  </span>
                  {selectedCell && (
                    <button 
                      onClick={() => setSelectedCell(null)}
                      className="text-primary hover:text-primary-container text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Show All Month
                    </button>
                  )}
                </h4>

                <div className="space-y-3">
                  {displayedEvents.map((e) => (
                    <Link
                      key={e.id}
                      href={`/education/pta/event/${e.id}`}
                      className="p-3 bg-surface rounded-lg border border-surface-container hover:bg-surface-container-low transition-colors block group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1 font-sans">
                        <h5 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{e.title}</h5>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${e.statusClass}`}>
                          {e.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-2">{e.description}</p>
                      <div className="flex justify-between text-[10px] text-slate-500 font-sans mt-1 pt-1 border-t border-surface-container">
                        <span>{e.date}</span>
                        <span className="font-medium">{e.location}</span>
                      </div>
                    </Link>
                  ))}
                  {displayedEvents.length === 0 && (
                    <p className="text-center py-6 text-xs text-slate-400 font-sans">
                      No events scheduled for this period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Launch New {modalType}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Title / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === "Program" ? "Vocational Training Camp" : "PTA Special Assembly"}`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Explain goals, agendas, or outlines."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent resize-none"
                />
              </div>
              {modalType === "Program" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Planned Duration (e.g. 6 Months)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4 Months"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Event Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Event Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {modalType === "Program" ? "Expected Participants (e.g. 150 Enrolled)" : "Location / Venue"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === "Program" ? "80 Enrolled" : "Classroom 4A"}`}
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent"
                />
              </div>
              {modalType === "Event" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Linked Program (Optional)
                  </label>
                  <select
                    value={newProgramId}
                    onChange={(e) => setNewProgramId(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                  >
                    <option value="">None (Independent Event)</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Launch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
