"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
          <h3 className="text-lg font-bold font-headline text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function PtaProgramDetail() {
  const { id } = useParams();
  const { token, isInitializing } = useAuth();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'editProgram' | 'addSchool'
  const [saving, setSaving] = useState(false);
  const [allSchools, setAllSchools] = useState([]);
  const [searchQ, setSearchQ] = useState("");

  const [editForm, setEditForm] = useState({});
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", time: "", location: "", status: "Scheduled" });

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const loadProgram = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (json.success) {
        setProgram(json.data);
        setEditForm({
          title: json.data.title || "",
          description: json.data.description || "",
          duration: json.data.duration || "",
          participantsText: json.data.participantsText || "",
          status: json.data.status || "Planning",
        });
      }
    } catch (err) { console.error("Failed to load program:", err); }
    finally { setLoading(false); }
  }, [id, token]);

  useEffect(() => {
    if (!isInitializing) {
      loadProgram();
    }
  }, [loadProgram, isInitializing]);

  useEffect(() => {
    if (modal !== "addSchool") return;
    fetch("/api/schools", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(j => { if (j.success) setAllSchools(j.data); })
      .catch(console.error);
  }, [modal, token]);

  async function handleEditSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/programs/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(editForm) });
      const json = await res.json();
      if (json.success) { await loadProgram(); setModal(null); }
      else alert(json.error || "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleAddEvent(e) {
    e.preventDefault(); setSaving(true);
    try {
      let isoDate = new Date().toISOString();
      if (eventForm.date && eventForm.time) {
        isoDate = new Date(`${eventForm.date}T${eventForm.time}:00`).toISOString();
      } else if (eventForm.date) {
        isoDate = new Date(eventForm.date).toISOString();
      }
      
      const res = await fetch("/api/events", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          date: isoDate,
          location: eventForm.location || "TBD",
          status: eventForm.status,
          programId: id
        })
      });
      const json = await res.json();
      if (json.success) {
        await loadProgram();
        setModal(null);
        setEventForm({ title: "", description: "", date: "", time: "", location: "", status: "Scheduled" });
      } else {
        alert(json.error || "Failed to add event");
      }
    } finally { setSaving(false); }
  }

  async function handleAssignSchool(schoolId) {
    await fetch(`/api/schools/${schoolId}/programs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ programId: id })
    });
    await loadProgram();
  }

  async function handleRemoveSchool(schoolId) {
    if (!confirm("Remove this school from the program?")) return;
    await fetch(`/api/schools/${schoolId}/programs`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ programId: id })
    });
    await loadProgram();
  }

  if (isInitializing || loading) return (
    <div className="p-8 flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!program) return <div className="p-8 text-center text-on-surface-variant font-medium">Program not found</div>;

  const assignedSchoolIds = new Set((program.schools || []).map(s => s.schoolId));
  const filteredSchools = allSchools.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()));

  // Aggregate students from all schools in this program
  const totalStudents = (program.schools || []).reduce((acc, sp) => acc + (sp.school?._count?.students || 0), 0);

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back */}
      <Link href="/education/pta" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to PTA Hub</span>
      </Link>

      {/* Hero */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 ${program.iconBg || "bg-primary/10 text-primary"}`}>
            <span className="material-symbols-outlined text-3xl">{program.icon || "campaign"}</span>
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">{program.title}</h2>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${program.status === "Active" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container text-on-surface-variant"}`}>
                {program.status}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">schedule</span>
              {program.duration || "Duration TBD"} • {program.participantsText || "Participants TBD"}
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">{program.description || "No description provided."}</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button onClick={() => setModal("editProgram")}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Program
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Description, Schools */}
        <div className="lg:col-span-8 space-y-8">

          {/* Schools in this Program */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Schools in this Program ({program.schools?.length || 0})
              </h3>
              <button onClick={() => { setModal("addSchool"); setSearchQ(""); }}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">add</span> Add School
              </button>
            </div>
            {(!program.schools || program.schools.length === 0) ? (
              <p className="text-center py-8 text-on-surface-variant text-sm">No schools assigned to this program yet.</p>
            ) : (
              <div className="space-y-4">
                {program.schools.map(sp => (
                  <div key={sp.schoolId} className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{sp.school.name}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{sp.school.location} • {sp.school.status}</p>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                      <Link href={`/education/schools/${sp.schoolId}`} className="text-xs text-primary hover:underline font-medium">View School</Link>
                      <button onClick={() => handleRemoveSchool(sp.schoolId)} className="p-1.5 hover:bg-error-container rounded-full cursor-pointer text-error">
                        <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Events */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">event</span>
                Program Events
              </h3>
              <button onClick={() => { setModal("addEvent"); }}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Event
              </button>
            </div>
            {(!program.events || program.events.length === 0) ? (
              <p className="text-center py-8 text-on-surface-variant text-sm">No events scheduled for this program yet.</p>
            ) : (
              <div className="space-y-4">
                {program.events.map(ev => (
                  <Link key={ev.id} href={`/education/pta/event/${ev.id}`}
                    className="p-4 bg-surface-container-low rounded-lg flex justify-between items-start hover:bg-surface-container transition-colors block group">
                    <div>
                      <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">{ev.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{ev.location} • {new Date(ev.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ev.status === "Scheduled" ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container text-on-surface-variant"}`}>
                      {ev.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Program Details</h3>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Duration</span>
                <span className="font-semibold text-on-surface">{program.duration || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Status</span>
                <span className={`font-semibold ${program.status === "Active" ? "text-primary" : "text-on-surface"}`}>{program.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Schools Enrolled</span>
                <span className="font-semibold text-on-surface">{program.schools?.length || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Events</span>
                <span className="font-semibold text-on-surface">{program.events?.length || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-on-surface-variant">Participants</span>
                <span className="font-semibold text-on-surface">{program.participantsText || "—"}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-2">Created</h3>
            <p className="text-sm text-on-surface-variant font-sans">
              {program.createdAt ? new Date(program.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────────────── */}

      {/* Edit Program Modal */}
      {modal === "editProgram" && (
        <Modal title="Edit Program" onClose={() => setModal(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Title</label>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows="3"
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Duration</label>
                <input value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 6 Months"
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
                  {["Planning", "Active", "On Hold", "Completed", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Participants Text</label>
              <input value={editForm.participantsText} onChange={e => setEditForm(f => ({ ...f, participantsText: e.target.value }))}
                placeholder="e.g. 200 Students enrolled"
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add School to Program */}
      {modal === "addSchool" && (
        <Modal title="Assign School to Program" onClose={() => setModal(null)}>
          <p className="text-sm text-on-surface-variant mb-4">Search and assign a school to this program.</p>
          <input type="text" placeholder="Search schools..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4" />
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredSchools.map(s => {
              const isAssigned = assignedSchoolIds.has(s.id);
              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"}`}>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{s.name}</p>
                    <p className="text-xs text-on-surface-variant">{s.location} • {s.status}</p>
                  </div>
                  <button
                    onClick={() => isAssigned ? handleRemoveSchool(s.id) : handleAssignSchool(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${isAssigned ? "bg-error-container text-on-error-container hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                  >
                    {isAssigned ? "Remove" : "Assign"}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Add Event Modal */}
      {modal === "addEvent" && (
        <Modal title="Schedule Program Event" onClose={() => setModal(null)}>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Event Title</label>
              <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Kickoff Meeting"
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Description</label>
              <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required rows="3" placeholder="Explain the event's agenda..."
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Date</label>
                <input type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} required
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Time</label>
                <input type="time" value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))} required
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Location / Venue</label>
                <input value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Auditorium"
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Status</label>
                <select value={eventForm.status} onChange={e => setEventForm(f => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
                  {["Scheduled", "Completed", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModal(null)} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50">
                {saving ? "Scheduling..." : "Schedule Event"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
