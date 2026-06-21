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

export default function PtaEventDetail() {
  const { id } = useParams();
  const { token, isInitializing } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const loadEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json();
      if (json.success) {
        setEvent(json.data);
        const ev = json.data;
        const dt = ev.date ? new Date(ev.date) : null;
        setEditForm({
          title: ev.title || "",
          description: ev.description || "",
          date: dt ? dt.toISOString().split("T")[0] : "",
          time: dt ? dt.toTimeString().substring(0, 5) : "",
          location: ev.location || "",
          status: ev.status || "Scheduled"
        });
      }
    } catch (err) { console.error("Failed to load event:", err); }
    finally { setLoading(false); }
  }, [id, token]);

  useEffect(() => {
    if (!isInitializing) {
      loadEvent();
    }
  }, [loadEvent, isInitializing]);

  async function handleEditSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      const dateTime = editForm.date && editForm.time
        ? new Date(`${editForm.date}T${editForm.time}:00`).toISOString()
        : editForm.date ? new Date(editForm.date).toISOString() : undefined;
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ title: editForm.title, description: editForm.description, date: dateTime, location: editForm.location, status: editForm.status })
      });
      const json = await res.json();
      if (json.success) { await loadEvent(); setModal(null); }
      else alert(json.error || "Failed to save");
    } finally { setSaving(false); }
  }

  if (isInitializing || loading) return (
    <div className="p-8 flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!event) return <div className="p-8 text-center text-on-surface-variant font-medium">Meeting/Event not found</div>;

  const eventDate = event.date ? new Date(event.date) : null;
  const dateFormatted = eventDate ? eventDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "TBD";
  const timeFormatted = eventDate ? eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const statusClass = event.status === "Completed"
    ? "bg-surface-container text-on-surface-variant"
    : event.status === "Cancelled"
      ? "bg-error-container text-on-error-container"
      : "bg-primary-fixed text-on-primary-fixed";

  const linkedSchools = event.program?.schools || [];

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
          <div className="w-16 h-16 rounded-full bg-secondary-fixed text-on-secondary-container flex items-center justify-center text-3xl font-bold shrink-0">
            <span className="material-symbols-outlined text-3xl">diversity_3</span>
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">{event.title}</h2>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}>{event.status}</span>
            </div>
            <p className="text-on-surface-variant font-medium mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
              {dateFormatted}{timeFormatted ? ` • ${timeFormatted}` : ""}
              {event.location ? ` at ${event.location}` : ""}
            </p>
            {event.program && (
              <p className="text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">campaign</span>
                Part of:&nbsp;
                <Link href={`/education/pta/program/${event.programId}`} className="text-primary hover:underline font-semibold">
                  {event.program.title}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button onClick={() => setModal("edit")}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Meeting
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Description, Agenda */}
        <div className="lg:col-span-8 space-y-8">

          {/* Meeting Description */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-4">Meeting Agenda &amp; Focus</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {event.description || "No agenda recorded for this meeting."}
            </p>
          </div>

          {/* Schools Involved */}
          {linkedSchools.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Schools Involved
              </h3>
              <div className="space-y-3">
                {linkedSchools.map(sp => (
                  <Link key={sp.schoolId} href={`/education/schools/${sp.schoolId}`}
                    className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors group">
                    <div>
                      <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{sp.school.name}</p>
                      <p className="text-xs text-on-surface-variant">{sp.school.location}</p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Event Details */}
        <div className="lg:col-span-4 space-y-8">

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Event Details</h3>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Date</span>
                <span className="font-semibold text-on-surface">{dateFormatted}</span>
              </div>
              {timeFormatted && (
                <div className="flex justify-between py-2 border-b border-surface-container">
                  <span className="text-on-surface-variant">Time</span>
                  <span className="font-semibold text-on-surface">{timeFormatted}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Location</span>
                <span className="font-semibold text-on-surface">{event.location || "TBD"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>{event.status}</span>
              </div>
              {event.program && (
                <div className="flex justify-between py-2">
                  <span className="text-on-surface-variant">Program</span>
                  <Link href={`/education/pta/program/${event.programId}`} className="font-semibold text-primary hover:underline text-right">
                    {event.program.title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-2">Created</h3>
            <p className="text-sm text-on-surface-variant font-sans">
              {event.createdAt ? new Date(event.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODAL: Edit Meeting ──────────────────────────────────────────────────── */}
      {modal === "edit" && (
        <Modal title="Edit Meeting" onClose={() => setModal(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Title</label>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Description / Agenda</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows="4"
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Date</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Time</label>
                <input type="time" value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Location</label>
                <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Classroom 4A"
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
                  {["Scheduled", "Completed", "Cancelled", "Postponed"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
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
    </div>
  );
}
