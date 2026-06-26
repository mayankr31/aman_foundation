"use client";

import Link from "next/link";
import { useState, useEffect, use, Fragment } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

export default function GoatRearingProgramDetail({ params }) {
  const { id } = use(params);
  const { token } = useAuth();
  const toast = useToast();
  
  const [program, setProgram] = useState(null);
  const [allBens, setAllBens] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");

  // Enroll Modal States
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedExistingBenId, setSelectedExistingBenId] = useState("");
  const [newGoats, setNewGoats] = useState("");
  const [newInvestment, setNewInvestment] = useState("");

  // Edit Assignment Modal States
  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editFarmerId, setEditFarmerId] = useState("");
  const [editFarmerName, setEditFarmerName] = useState("");
  const [editGoats, setEditGoats] = useState("");
  const [editInvestment, setEditInvestment] = useState("");
  const [editReturns, setEditReturns] = useState("");
  const [editRoi, setEditRoi] = useState("");
  const [editAdvantages, setEditAdvantages] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Log Event Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventAssignmentId, setEventAssignmentId] = useState("");
  const [eventBeneficiaryName, setEventBeneficiaryName] = useState("");
  const [eventType, setEventType] = useState("Death");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventQuantity, setEventQuantity] = useState("1");
  const [eventNotes, setEventNotes] = useState("");
  const [eventPhoto, setEventPhoto] = useState(null);
  const [eventRecordedBy, setEventRecordedBy] = useState("");

  // Expanded rows for event history
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Photo lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [progRes, bensRes] = await Promise.all([
          fetch(`/api/livelihood/programs/goat/${id}`, { headers }),
          fetch(`/api/beneficiaries`, { headers })
        ]);
        
        const progJson = await progRes.json();
        const bensJson = await bensRes.json();

        if (progJson.success) {
          setProgram(progJson.data);
        }
        if (bensJson.success) {
          setAllBens(bensJson.data);
        }
      } catch (err) {
        console.error("Failed to load program data:", err);
      }
    }
    loadData();
  }, [id, token, refreshTrigger]);

  if (!program) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="text-on-surface-variant text-sm font-semibold animate-pulse">Loading program details...</div>
      </div>
    );
  }

  // Calculate statistics from the nested beneficiary array
  const enrolledFarmers = program.beneficiaries || [];
  
  const mappedFarmers = enrolledFarmers.map(assign => {
    const b = assign.beneficiary;
    const initials = b.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    return {
      id: b.id,
      assignmentId: assign.id,
      name: b.name,
      initials,
      bgInitials: "bg-secondary-container text-on-secondary-container",
      location: b.address || "Unknown",
      goats: assign.goatsAssigned || 0,
      investment: assign.investment || 0,
      returns: assign.returnsAmount || 0,
      roi: assign.roiPercentage || 0,
      advantages: assign.advantagesLog || "",
      notes: assign.notes || "",
      events: assign.events || [],
      rawAssignment: assign
    };
  });

  const locations = ["All", ...new Set(mappedFarmers.map((f) => f.location.split(",")[0].trim()))];

  const filteredFarmers = mappedFarmers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "All" || f.location.includes(selectedLocation);
    return matchesSearch && matchesLocation;
  });

  const unenrolledBens = allBens.filter(b => !mappedFarmers.some(mf => mf.id === b.id));

  const totalGoats = mappedFarmers.reduce((sum, f) => sum + f.goats, 0);
  const totalInvestment = mappedFarmers.reduce((sum, f) => sum + f.investment, 0);
  const totalReturns = mappedFarmers.reduce((sum, f) => sum + f.returns, 0);
  
  const bensWithRoi = mappedFarmers.filter(b => b.roi > 0);
  const avgRoi = bensWithRoi.length > 0 
    ? Math.round(bensWithRoi.reduce((acc, b) => acc + b.roi, 0) / bensWithRoi.length) 
    : 0;

  const handleEnrollFarmer = async (e) => {
    e.preventDefault();
    if (!selectedExistingBenId || !newGoats) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/goat/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          beneficiaryId: selectedExistingBenId,
          assignment: {
            goatsAssigned: parseInt(newGoats),
            investment: newInvestment ? parseFloat(newInvestment) : null,
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Beneficiary successfully enrolled in the program.");
        setRefreshTrigger(prev => prev + 1);
        setShowEnrollModal(false);
        setSelectedExistingBenId("");
        setNewGoats("");
        setNewInvestment("");
      } else {
        toast.error(json.error || "Failed to enroll beneficiary");
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("An error occurred during enrollment.");
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!editFarmerId) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/goat/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          beneficiaryId: editFarmerId,
          assignment: {
            goatsAssigned: parseInt(editGoats || 0),
            investment: editInvestment !== "" ? parseFloat(editInvestment) : null,
            returnsAmount: editReturns !== "" ? parseFloat(editReturns) : null,
            roiPercentage: editRoi !== "" ? parseFloat(editRoi) : null,
            advantagesLog: editAdvantages,
            notes: editNotes,
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Assignment updated successfully.");
        setRefreshTrigger(prev => prev + 1);
        setShowEditAssignModal(false);
      } else {
        toast.error(json.error || "Failed to update assignment");
      }
    } catch (err) {
      console.error("Update assignment error:", err);
      toast.error("An error occurred while updating the assignment.");
    }
  };

  const handleLogEvent = async (e) => {
    e.preventDefault();
    if (!eventAssignmentId || !eventType) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const formData = new FormData();
      formData.append("beneficiaryGoatRearingId", eventAssignmentId);
      formData.append("eventType", eventType);
      formData.append("eventDate", eventDate);
      formData.append("quantity", eventQuantity);
      if (eventNotes) formData.append("notes", eventNotes);
      if (eventRecordedBy) formData.append("recordedBy", eventRecordedBy);
      if (eventPhoto) formData.append("photo", eventPhoto);

      const res = await fetch("/api/livelihood/goat-events", {
        method: "POST",
        headers,
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${eventType} event logged successfully.`);
        setRefreshTrigger(prev => prev + 1);
        setShowEventModal(false);
      } else {
        toast.error(json.error || "Failed to log event");
      }
    } catch (err) {
      console.error("Log event error:", err);
      toast.error("An error occurred while logging the event.");
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "Death": return "skull";
      case "Pregnancy": return "pregnant_woman";
      case "ChildBirth": return "crib";
      default: return "event";
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case "Death": return "text-red-500 bg-red-50";
      case "Pregnancy": return "text-amber-500 bg-amber-50";
      case "ChildBirth": return "text-green-500 bg-green-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Header */}
      <div>
        <Link
          href="/livelihood/goat-rearing"
          className="flex items-center gap-2 text-slate-500 hover:text-secondary transition-colors mb-6 group w-fit"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
            arrow_back
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
            Back to Goat Rearing
          </span>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-secondary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
              Program Details
            </span>
            <h2 className="text-4xl md:text-5xl font-headline tracking-[-0.02em] font-semibold text-on-surface">
              {program.name}
            </h2>
            <p className="text-on-surface-variant mt-2 max-w-2xl text-body font-body leading-relaxed text-sm">
              {program.description}
            </p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="bg-secondary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-secondary-container transition-all flex items-center gap-2 shadow-lg shadow-secondary/30 active:scale-95 font-sans cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Beneficiary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        <div className="md:col-span-3 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Enrolled Families
            </span>
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {mappedFarmers.length}
          </div>
          <p className="text-sm text-on-surface-variant">Active participants</p>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Goats Assigned
            </span>
            <span className="material-symbols-outlined text-primary">pets</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            {totalGoats}
          </div>
          <p className="text-sm text-on-surface-variant">Total livestock distributed</p>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Total Investment
            </span>
            <span className="material-symbols-outlined text-tertiary">payments</span>
          </div>
          <div className="text-4xl font-headline font-bold text-on-surface mb-1">
            ₹{totalInvestment.toLocaleString()}
          </div>
          <p className="text-sm text-on-surface-variant">Capital utilized</p>
        </div>

        <div className="md:col-span-3 bg-secondary rounded-lg p-6 shadow-ambient pt-8 pl-8 border border-outline-variant/10 text-white">
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/80 text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Avg. ROI Rate
            </span>
            <span className="material-symbols-outlined text-white/90">monitoring</span>
          </div>
          <div className="text-4xl font-headline font-bold text-white mb-1">
            {avgRoi}%
          </div>
          <p className="text-sm text-white/80">Calculated program return</p>
        </div>

        {/* Beneficiaries Table */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden border border-outline-variant/10">
          <div className="p-6 pb-4 pt-8 pl-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-surface-container-lowest border-b border-surface-container-highest">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Program Beneficiaries</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Families actively participating in this program.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search families..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-1.5 rounded-full border border-outline-variant text-xs focus:outline-none focus:border-secondary w-full md:w-48 font-sans bg-transparent text-on-surface font-semibold"
              />
              
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-1.5 bg-surface-container text-on-surface rounded-full border-none focus:ring-1 focus:ring-secondary text-xs cursor-pointer appearance-none font-sans font-bold"
                >
                  <option value="All" className="bg-surface-container text-on-surface">All Villages</option>
                  {locations.filter(loc => loc !== "All").map((loc) => (
                    <option key={loc} value={loc} className="bg-surface-container text-on-surface">
                      {loc}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container-highest">
                  <th className="px-8 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Participant Name
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Goats Assigned
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Investment Value
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    Returns Realized
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans">
                    ROI %
                  </th>
                  <th className="px-8 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant font-sans text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredFarmers.map((f, i) => (
                  <Fragment key={f.id}>
                  <tr
                    className="border-b border-surface-container-highest hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const next = new Set(expandedRows);
                            if (next.has(f.assignmentId)) next.delete(f.assignmentId);
                            else next.add(f.assignmentId);
                            setExpandedRows(next);
                          }}
                          className="p-1 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">
                            {expandedRows.has(f.assignmentId) ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${f.bgInitials}`}
                        >
                          {f.initials}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{f.name}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">{f.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface">{f.goats} Goats</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{f.investment ? `₹${f.investment.toLocaleString()}` : "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-on-surface font-bold">{f.returns ? `₹${f.returns.toLocaleString()}` : "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="text-secondary font-bold">
                        {f.roi ? `${f.roi}%` : "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <button
                          onClick={() => {
                            setEventAssignmentId(f.assignmentId);
                            setEventBeneficiaryName(f.name);
                            setEventType("Death");
                            setEventDate(new Date().toISOString().split("T")[0]);
                            setEventQuantity("1");
                            setEventNotes("");
                            setEventPhoto(null);
                            setEventRecordedBy("");
                            setShowEventModal(true);
                          }}
                          className="text-tertiary hover:text-tertiary-container transition-colors cursor-pointer font-sans text-xs font-bold hover:underline bg-transparent border-none"
                        >
                          Log Event
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => {
                            setEditFarmerId(f.id);
                            setEditFarmerName(f.name);
                            setEditGoats(f.goats);
                            setEditInvestment(f.investment || "");
                            setEditReturns(f.returns || "");
                            setEditRoi(f.roi || "");
                            setEditAdvantages(f.advantages || "");
                            setEditNotes(f.notes || "");
                            setShowEditAssignModal(true);
                          }}
                          className="text-secondary hover:text-secondary-container transition-colors cursor-pointer font-sans text-xs font-bold hover:underline bg-transparent border-none"
                        >
                          Edit Assignment
                        </button>
                        <span className="text-slate-300">|</span>
                        <Link
                          href={`/beneficiaries/${f.id}`}
                          className="text-primary hover:text-primary-container transition-colors cursor-pointer font-sans text-xs font-bold hover:underline"
                        >
                          View Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(f.assignmentId) && (
                    <tr key={`events-${f.assignmentId}`} className="bg-surface-container-lowest">
                      <td colSpan="7" className="px-8 py-4">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Goat Lifecycle Events
                          </h4>
                          {(!f.events || f.events.length === 0) ? (
                            <p className="text-xs text-on-surface-variant/60 italic">
                              No events logged yet for this beneficiary.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {f.events.map((evt) => (
                                <div
                                  key={evt.id}
                                  className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant/10"
                                >
                                  <span
                                    className={`material-symbols-outlined text-lg p-1.5 rounded-full ${getEventColor(evt.eventType)}`}
                                  >
                                    {getEventIcon(evt.eventType)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-on-surface">
                                        {evt.eventType}
                                      </span>
                                      <span className="text-[10px] text-on-surface-variant">
                                        {new Date(evt.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                      <span className="text-[10px] text-on-surface-variant">
                                        Qty: {evt.quantity}
                                      </span>
                                    </div>
                                    {evt.notes && (
                                      <p className="text-xs text-on-surface-variant mt-1">{evt.notes}</p>
                                    )}
                                    {evt.recordedBy && (
                                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                                        Recorded by: {evt.recordedBy}
                                      </p>
                                    )}
                                  </div>
                                  {evt.photoUrl && (
                                    <button
                                      onClick={() => setLightboxPhoto(evt.photoUrl)}
                                      className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-outline-variant/20 cursor-pointer bg-transparent p-0"
                                    >
                                      <img
                                        src={evt.photoUrl}
                                        alt={`${evt.eventType} evidence`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-xs text-slate-400 font-sans font-semibold">
                      No beneficiaries match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Beneficiary to Program</h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEnrollFarmer} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Select Beneficiary
                </label>
                <select
                  required
                  value={selectedExistingBenId}
                  onChange={(e) => setSelectedExistingBenId(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface cursor-pointer"
                >
                  <option value="">-- Select Beneficiary --</option>
                  {unenrolledBens.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.enrolmentId})
                    </option>
                  ))}
                  {unenrolledBens.length === 0 && (
                    <option disabled>No unenrolled beneficiaries found</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Goats Assigned
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2"
                    value={newGoats}
                    onChange={(e) => setNewGoats(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Initial Investment (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8000"
                    value={newInvestment}
                    onChange={(e) => setNewInvestment(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-secondary text-white font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none"
                >
                  Add Beneficiary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Edit Goat Rearing Assignment</h3>
                <p className="text-xs text-on-surface-variant mt-1">Update number of goats distributed and realized return metrics for {editFarmerName}.</p>
              </div>
              <button
                onClick={() => setShowEditAssignModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateAssignment} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Goats Assigned
                  </label>
                  <input
                    type="number"
                    required
                    value={editGoats}
                    onChange={(e) => setEditGoats(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Total Investment Value (₹)
                  </label>
                  <input
                    type="number"
                    value={editInvestment}
                    onChange={(e) => setEditInvestment(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cumulative Realized Returns (₹)
                  </label>
                  <input
                    type="number"
                    value={editReturns}
                    onChange={(e) => setEditReturns(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Return Rate (ROI %)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editRoi}
                    onChange={(e) => setEditRoi(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Advantages Logged
                  </label>
                  <input
                    type="text"
                    value={editAdvantages}
                    onChange={(e) => setEditAdvantages(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Program Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface resize-none font-sans"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowEditAssignModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-secondary text-white font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none shadow-glow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Log Goat Lifecycle Event</h3>
                <p className="text-xs text-on-surface-variant mt-1">Record death, pregnancy, or child birth of goats for {eventBeneficiaryName}.</p>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleLogEvent} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Event Type
                </label>
                <select
                  required
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface cursor-pointer"
                >
                  <option value="Death">Death</option>
                  <option value="Pregnancy">Pregnancy</option>
                  <option value="ChildBirth">Child Birth</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    No. of Goats
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={eventQuantity}
                    onChange={(e) => setEventQuantity(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface resize-none font-sans"
                  rows="2"
                  placeholder="Optional details about the event..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Photo Evidence
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEventPhoto(e.target.files?.[0] || null)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-white file:cursor-pointer"
                />
                {eventPhoto && (
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Selected: {eventPhoto.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Recorded By
                </label>
                <input
                  type="text"
                  value={eventRecordedBy}
                  onChange={(e) => setEventRecordedBy(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-outline-variant bg-transparent text-on-surface"
                  placeholder="Name of the staff member"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-tertiary text-white font-semibold hover:bg-tertiary-container transition-colors cursor-pointer border-none shadow-glow"
                >
                  Log Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer border-none text-white"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <img
            src={lightboxPhoto}
            alt="Event evidence"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
