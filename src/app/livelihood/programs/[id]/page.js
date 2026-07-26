"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { getTypeConfig } from "@/lib/livelihoodTypes";

export default function ProgramDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [program, setProgram] = useState(null);
  const [allBeneficiaries, setAllBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedBenId, setSelectedBenId] = useState("");
  const [enrollNotes, setEnrollNotes] = useState("");
  const [enrollAttrs, setEnrollAttrs] = useState({});

  // Edit assignment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAssignId, setEditAssignId] = useState(null);
  const [editAttrs, setEditAttrs] = useState({});
  const [editNotes, setEditNotes] = useState("");

  // Delete assignment
  const [deleteAssignId, setDeleteAssignId] = useState(null);
  const [deleteAssignName, setDeleteAssignName] = useState("");

  // Delete program
  const [showDeleteProgram, setShowDeleteProgram] = useState(false);

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventLivelihoodId, setEventLivelihoodId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventQuantity, setEventQuantity] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [eventRecordedBy, setEventRecordedBy] = useState("");
  const [eventPhoto, setEventPhoto] = useState(null);

  // Edit event
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editEventId, setEditEventId] = useState(null);
  const [editEventType, setEditEventType] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventQuantity, setEditEventQuantity] = useState("");
  const [editEventNotes, setEditEventNotes] = useState("");
  const [editEventRecordedBy, setEditEventRecordedBy] = useState("");

  // Expanded rows for events
  const [expandedAssignId, setExpandedAssignId] = useState(null);

  const config = program ? getTypeConfig(program.type) : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [progRes, benRes] = await Promise.all([
          fetch(`/api/livelihood/programs/${id}`, { headers }),
          fetch("/api/beneficiaries", { headers }),
        ]);
        const progJson = await progRes.json();
        const benJson = await benRes.json();

        if (progJson.success) setProgram(progJson.data);
        if (benJson.success) setAllBeneficiaries(benJson.data);
      } catch (err) {
        console.error("Failed to load program detail:", err);
      }
      setLoading(false);
    }
    load();
  }, [token, id, refreshTrigger]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedBenId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/assignments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ beneficiaryId: selectedBenId, attributes: enrollAttrs, notes: enrollNotes || null }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEnrollModal(false);
        setSelectedBenId(""); setEnrollNotes(""); setEnrollAttrs({});
        setRefreshTrigger((p) => p + 1);
        alert("Beneficiary enrolled successfully");
      } else {
        alert(json.error || "Failed to enroll beneficiary");
      }
    } catch (err) {
      console.error("Enroll error:", err);
    }
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    if (!editAssignId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/assignments/${editAssignId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ attributes: editAttrs, notes: editNotes }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        setRefreshTrigger((p) => p + 1);
        alert("Assignment updated");
      } else {
        alert(json.error || "Failed to update assignment");
      }
    } catch (err) {
      console.error("Edit assignment error:", err);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deleteAssignId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/${id}/assignments/${deleteAssignId}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        setDeleteAssignId(null); setDeleteAssignName("");
        setRefreshTrigger((p) => p + 1);
        alert("Assignment removed");
      } else {
        alert(json.error || "Failed to remove assignment");
      }
    } catch (err) {
      console.error("Delete assignment error:", err);
    }
  };

  const handleDeleteProgram = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/${id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        router.push(program.category === "FARM" ? "/livelihood/farm" : "/livelihood/non-farm");
      } else {
        alert(json.error || "Failed to delete program");
      }
    } catch (err) {
      console.error("Delete program error:", err);
    }
  };

  const handleLogEvent = async (e) => {
    e.preventDefault();
    if (!eventLivelihoodId || !eventType) return;
    try {
      const formData = new FormData();
      formData.append("livelihoodId", eventLivelihoodId);
      formData.append("eventType", eventType);
      formData.append("eventDate", eventDate);
      if (eventQuantity) formData.append("quantity", eventQuantity);
      if (eventNotes) formData.append("notes", eventNotes);
      if (eventRecordedBy) formData.append("recordedBy", eventRecordedBy);
      if (eventPhoto) formData.append("photo", eventPhoto);

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/livelihood/events", { method: "POST", headers, body: formData });
      const json = await res.json();
      if (json.success) {
        setShowEventModal(false);
        setEventType(""); setEventQuantity(""); setEventNotes(""); setEventRecordedBy(""); setEventPhoto(null);
        setRefreshTrigger((p) => p + 1);
        alert("Event logged");
      } else {
        alert(json.error || "Failed to log event");
      }
    } catch (err) {
      console.error("Log event error:", err);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    if (!editEventId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/events/${editEventId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          eventType: editEventType,
          eventDate: editEventDate,
          quantity: editEventQuantity || null,
          notes: editEventNotes || null,
          recordedBy: editEventRecordedBy || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEditEventModal(false);
        setRefreshTrigger((p) => p + 1);
        alert("Event updated");
      } else {
        alert(json.error || "Failed to update event");
      }
    } catch (err) {
      console.error("Edit event error:", err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Delete this event?")) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/events/${eventId}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        setRefreshTrigger((p) => p + 1);
        alert("Event deleted");
      } else {
        alert(json.error || "Failed to delete event");
      }
    } catch (err) {
      console.error("Delete event error:", err);
    }
  };

  const openEnrollModal = () => {
    if (config) {
      const defaults = {};
      config.fields.forEach((f) => {
        defaults[f.name] = f.type === "number" ? "" : (f.type === "select" ? f.options[0] : "");
      });
      setEnrollAttrs(defaults);
    }
    setSelectedBenId("");
    setEnrollNotes("");
    setShowEnrollModal(true);
  };

  const openEditModal = (assign) => {
    setEditAssignId(assign.id);
    setEditAttrs({ ...(assign.attributes || {}) });
    setEditNotes(assign.notes || "");
    setShowEditModal(true);
  };

  const openEventModal = (livelihoodId) => {
    setEventLivelihoodId(livelihoodId);
    setEventType(config?.eventTypes?.[0] || "");
    setEventDate(new Date().toISOString().split("T")[0]);
    setEventQuantity("");
    setEventNotes("");
    setEventRecordedBy("");
    setEventPhoto(null);
    setShowEventModal(true);
  };

  const openEditEventModal = (ev) => {
    setEditEventId(ev.id);
    setEditEventType(ev.eventType);
    setEditEventDate(ev.eventDate ? ev.eventDate.split("T")[0] : "");
    setEditEventQuantity(ev.quantity || "");
    setEditEventNotes(ev.notes || "");
    setEditEventRecordedBy(ev.recordedBy || "");
    setShowEditEventModal(true);
  };

  // Unenrolled beneficiaries (not already in this program)
  const assignedBenIds = new Set((program?.assignments || []).map((a) => a.beneficiaryId));
  const unenrolledBens = allBeneficiaries.filter((b) => !assignedBenIds.has(b.id));

  // KPI aggregates
  const assignments = program?.assignments || [];
  const getSum = (key) => assignments.reduce((s, a) => s + (Number(a.attributes?.[key]) || 0), 0);
  const getAvg = (key) => {
    const vals = assignments.map((a) => Number(a.attributes?.[key])).filter((v) => !isNaN(v));
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };

  if (loading) {
    return (
      <div className="p-8 flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">Loading program...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-8 flex-1 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-4xl text-slate-400">error</span>
        <p className="text-on-surface-variant">Program not found.</p>
        <Link href="/livelihood" className="text-primary text-sm font-semibold hover:underline">Back to Livelihood Hub</Link>
      </div>
    );
  }

  const backLink = program.category === "FARM" ? "/livelihood/farm" : "/livelihood/non-farm";
  const accentColor = program.category === "FARM" ? "emerald" : "amber";

  return (
    <div className="p-8 flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full pb-24">
      {/* Back */}
      <Link href={backLink} className={`flex items-center gap-2 text-slate-500 hover:text-${accentColor}-600 transition-colors mb-6 group w-fit`}>
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to {program.category === "FARM" ? "Farm" : "Non-Farm"} Programs</span>
      </Link>

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-0.5 rounded text-[9px] bg-${accentColor}-100 text-${accentColor}-700 uppercase tracking-wider font-bold`}>
              {config?.label || program.type}
            </span>
            <span className="text-xs text-on-surface-variant">{program.category === "FARM" ? "Farm" : "Non-Farm"}</span>
          </div>
          <h2 className="text-[2.5rem] font-headline tracking-[-0.02em] leading-tight text-on-surface font-bold">{program.name}</h2>
          <p className="text-on-surface-variant font-body text-sm mt-1">{program.description || "No description"}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setShowDeleteProgram(true)}
            className="text-red-600 hover:bg-red-50 px-4 py-3 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer border border-red-200 bg-transparent"
          >
            <span className="material-symbols-outlined text-sm">delete</span>Delete Program
          </button>
          <button
            onClick={openEnrollModal}
            className={`bg-${accentColor}-700 text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-${accentColor}-800 transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer border-none`}
            style={{ backgroundColor: program.category === "FARM" ? "#047857" : "#d97706" }}
          >
            <span className="material-symbols-outlined text-sm">person_add</span>Add Beneficiary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {config?.kpiCards && (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(config.kpiCards.length, 4)} gap-6`}>
          {config.kpiCards.map((kpi) => {
            let value;
            if (kpi.aggregate === "sum") value = getSum(kpi.key);
            else if (kpi.aggregate === "avg") value = getAvg(kpi.key);
            else value = getSum(kpi.key);

            let display = value;
            if (kpi.format === "currency") display = `₹${Number(value).toLocaleString("en-IN")}`;
            else if (kpi.format === "percent") display = `${Math.round(value)}%`;
            else if (kpi.unit) display = `${Number(value).toLocaleString("en-IN")} ${kpi.unit}`;
            else display = Number(value).toLocaleString("en-IN");

            return (
              <div key={kpi.key} className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
                <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">{kpi.label}</span>
                <span className="text-4xl font-headline font-bold text-on-surface">{display}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-6 text-xs font-semibold text-on-surface-variant">
        <span><strong className="text-on-surface">{assignments.length}</strong> Enrolled Families</span>
        {program.totalTarget && <span>Target: <strong className="text-on-surface">{program.totalTarget} {config?.programTargetUnit || "units"}</strong></span>}
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface">Enrolled Beneficiaries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant text-left font-bold">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Participant</th>
                {config?.tableColumns?.map((col) => (
                  <th key={col.key} className="px-6 py-3">{col.label}</th>
                ))}
                <th className="px-6 py-3">Enrolled</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={4 + (config?.tableColumns?.length || 0)} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                    No beneficiaries enrolled yet. Click "Add Beneficiary" to get started.
                  </td>
                </tr>
              ) : (
                assignments.map((assign, idx) => {
                  const b = assign.beneficiary || {};
                  const isExpanded = expandedAssignId === assign.id;
                  return (
                    <><tr key={assign.id} className={`hover:bg-surface-container-low transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-surface-container-lowest"}`}>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface">
                            {b.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface text-sm">{b.name || "—"}</p>
                            <p className="text-xs text-slate-400">{b.enrolmentId || ""} {b.address ? `· ${b.address}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      {config?.tableColumns?.map((col) => {
                        const val = assign.attributes?.[col.key];
                        let display = val ?? "—";
                        if (col.type === "currency" && val) display = `₹${Number(val).toLocaleString("en-IN")}`;
                        else if (col.type === "number" && val != null) {
                          display = Number(val).toLocaleString("en-IN");
                          if (col.unit) display += ` ${col.unit}`;
                        } else if (col.type === "badge") {
                          const colors = { "Planting": "bg-blue-100 text-blue-700", "Growing": "bg-green-100 text-green-700", "Harvesting": "bg-amber-100 text-amber-700", "Preparation": "bg-slate-100 text-slate-700", "Post-Harvest": "bg-purple-100 text-purple-700", "Nursery": "bg-teal-100 text-teal-700", "Transplanting": "bg-lime-100 text-lime-700", "Tillering": "bg-cyan-100 text-cyan-700", "Flowering": "bg-pink-100 text-pink-700" };
                          return <td key={col.key} className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[val] || "bg-slate-100 text-slate-700"}`}>{val || "—"}</span></td>;
                        }
                        return <td key={col.key} className="px-6 py-3 text-sm">{display}</td>;
                      })}
                      <td className="px-6 py-3 text-xs text-slate-400">{new Date(assign.enrolledAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {config?.eventTypes?.length > 0 && (
                            <button onClick={() => openEventModal(assign.id)} className="p-1.5 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent" title="Log event">
                              <span className="material-symbols-outlined text-sm">add_circle</span>
                            </button>
                          )}
                          <button onClick={() => setExpandedAssignId(isExpanded ? null : assign.id)} className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent ${isExpanded ? "text-blue-600" : "text-slate-400"}`} title="View events">
                            <span className="material-symbols-outlined text-sm">{isExpanded ? "expand_less" : "expand_more"}</span>
                          </button>
                          <button onClick={() => openEditModal(assign)} className="p-1.5 rounded-full hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer border-none bg-transparent" title="Edit">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => { setDeleteAssignId(assign.id); setDeleteAssignName(b.name || "Unknown"); }} className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent" title="Remove">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                          <Link href={`/beneficiaries/${b.id}`} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-on-surface transition-colors" title="View profile">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${assign.id}-events`}>
                        <td colSpan={4 + (config?.tableColumns?.length || 0)} className="px-6 py-4 bg-surface-container-low border-b">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Events</p>
                            {(assign.events || []).length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No events logged yet.</p>
                            ) : (
                              <div className="grid gap-2">
                                {(assign.events || []).map((ev) => (
                                  <div key={ev.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-outline-variant/10 text-xs">
                                    <span className={`px-2 py-0.5 rounded font-semibold ${
                                      ev.eventType === "Death" ? "bg-red-100 text-red-700" :
                                      ev.eventType === "Pregnancy" ? "bg-purple-100 text-purple-700" :
                                      ev.eventType === "ChildBirth" ? "bg-green-100 text-green-700" :
                                      ev.eventType === "Harvest" || ev.eventType === "Final Harvest" ? "bg-amber-100 text-amber-700" :
                                      ev.eventType === "Vaccination" || ev.eventType === "Health Check" ? "bg-blue-100 text-blue-700" :
                                      "bg-slate-100 text-slate-700"
                                    }`}>{ev.eventType}</span>
                                    <span className="text-slate-400">{new Date(ev.eventDate).toLocaleDateString("en-IN")}</span>
                                    {ev.quantity != null && <span className="font-semibold">x{ev.quantity}</span>}
                                    {ev.notes && <span className="text-slate-500 truncate max-w-xs">{ev.notes}</span>}
                                    {ev.photoUrl && (
                                      <img src={ev.photoUrl} alt="Event" className="w-8 h-8 rounded object-cover cursor-pointer" onClick={() => setLightboxPhoto(ev.photoUrl)} />
                                    )}
                                    <div className="ml-auto flex gap-1">
                                      <button onClick={() => openEditEventModal(ev)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600 cursor-pointer border-none bg-transparent">
                                        <span className="material-symbols-outlined text-xs">edit</span>
                                      </button>
                                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 cursor-pointer border-none bg-transparent">
                                        <span className="material-symbols-outlined text-xs">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MODALS ====== */}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowEnrollModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Enroll Beneficiary — {program.name}</h3>
              <button onClick={() => setShowEnrollModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            <form onSubmit={handleEnroll} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Beneficiary</label>
                <select value={selectedBenId} onChange={(e) => setSelectedBenId(e.target.value)} required className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans">
                  <option value="">Select beneficiary...</option>
                  {unenrolledBens.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.enrolmentId})</option>
                  ))}
                </select>
              </div>
              {config?.fields?.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{field.label}</label>
                  {field.type === "select" ? (
                    <select value={enrollAttrs[field.name] || ""} onChange={(e) => setEnrollAttrs({ ...enrollAttrs, [field.name]: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans">
                      {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={enrollAttrs[field.name] || ""} onChange={(e) => setEnrollAttrs({ ...enrollAttrs, [field.name]: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="2" placeholder={field.label} />
                  ) : (
                    <input type={field.type} step={field.step || "1"} value={enrollAttrs[field.name] || ""} onChange={(e) => setEnrollAttrs({ ...enrollAttrs, [field.name]: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" placeholder={field.label} />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea value={enrollNotes} onChange={(e) => setEnrollNotes(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="2" placeholder="Optional notes..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none">Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Assignment</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            <form onSubmit={handleEditAssignment} className="space-y-4 text-sm">
              {config?.fields?.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{field.label}</label>
                  {field.type === "select" ? (
                    <select value={editAttrs[field.name] || ""} onChange={(e) => setEditAttrs({ ...editAttrs, [field.name]: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans">
                      {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={editAttrs[field.name] || ""} onChange={(e) => setEditAttrs({ ...editAttrs, [field.name]: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="2" />
                  ) : (
                    <input type={field.type} step={field.step || "1"} value={editAttrs[field.name] || ""} onChange={(e) => setEditAttrs({ ...editAttrs, [field.name]: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="2" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Assignment Confirmation */}
      {deleteAssignId && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4" onClick={() => { setDeleteAssignId(null); setDeleteAssignName(""); }}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Remove Assignment</h3>
            <p className="text-sm text-on-surface-variant">Remove <strong>{deleteAssignName}</strong> from this program? Their events will also be deleted.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setDeleteAssignId(null); setDeleteAssignName(""); }} className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent">Cancel</button>
              <button onClick={handleDeleteAssignment} className="px-5 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Program Confirmation */}
      {showDeleteProgram && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4" onClick={() => setShowDeleteProgram(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-on-surface">Delete Program</h3>
            <p className="text-sm text-on-surface-variant">Delete <strong>{program.name}</strong> permanently? This removes all {assignments.length} assignments and their events.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowDeleteProgram(false)} className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent">Cancel</button>
              <button onClick={handleDeleteProgram} className="px-5 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowEventModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Log Event</h3>
              <button onClick={() => setShowEventModal(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            <form onSubmit={handleLogEvent} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Type</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} required className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans">
                  {(config?.eventTypes || []).map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Date</label>
                <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity</label>
                <input type="number" step="0.1" value={eventQuantity} onChange={(e) => setEventQuantity(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="2" placeholder="Optional notes..." />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recorded By</label>
                <input type="text" value={eventRecordedBy} onChange={(e) => setEventRecordedBy(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" placeholder="Name of recorder" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setEventPhoto(e.target.files[0] || null)} className="text-xs" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none">Log Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowEditEventModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Event</h3>
              <button onClick={() => setShowEditEventModal(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            <form onSubmit={handleEditEvent} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Type</label>
                <input type="text" value={editEventType} onChange={(e) => setEditEventType(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Date</label>
                <input type="date" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity</label>
                <input type="number" step="0.1" value={editEventQuantity} onChange={(e) => setEditEventQuantity(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea value={editEventNotes} onChange={(e) => setEditEventNotes(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="2" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recorded By</label>
                <input type="text" value={editEventRecordedBy} onChange={(e) => setEditEventRecordedBy(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditEventModal(false)} className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto} alt="Event" className="max-w-full max-h-[90vh] rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
