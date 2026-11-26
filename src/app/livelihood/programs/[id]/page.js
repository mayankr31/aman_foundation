"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useLivelihoodTypes } from "@/lib/useLivelihoodTypes";
import DateInput from "@/components/ui/DateInput";
import { formatRoleLabel } from "@/lib/roles";
import PhotoLightbox from "@/components/PhotoLightbox";
import EditProgramModal from "@/components/EditProgramModal";
import ProgramComponentPanel from "@/components/livelihood/ProgramComponentPanel";

const CATEGORY_META = {
  FARM: {
    label: "Farm",
    back: "/livelihood/farm",
    backLabel: "Farm Programs",
    badge: "bg-emerald-100 text-emerald-700",
    backHover: "hover:text-emerald-600",
    accent: "emerald",
  },
  NON_FARM: {
    label: "Non-Farm",
    back: "/livelihood/non-farm",
    backLabel: "Non-Farm Programs",
    badge: "bg-amber-100 text-amber-700",
    backHover: "hover:text-amber-600",
    accent: "amber",
  },
  MIXED: {
    label: "Integrated",
    back: "/livelihood/integrated",
    backLabel: "Integrated Programs",
    badge: "bg-indigo-100 text-indigo-700",
    backHover: "hover:text-indigo-600",
    accent: "indigo",
  },
};

function buildDefaultAttrs(config) {
  const attrs = {};
  (config?.fields || []).forEach((field) => {
    if (field.type === "number") attrs[field.name] = "";
    else if (field.type === "select") attrs[field.name] = field.options?.[0] || "";
    else attrs[field.name] = "";
  });
  return attrs;
}

function FieldInputs({ config, values, onChange }) {
  return (
    <>
      {(config?.fields || []).map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {field.label}
          </label>
          {field.type === "select" ? (
            <select
              value={values[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
            >
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={values[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
              rows="2"
              placeholder={field.label}
            />
          ) : (
            <input
              type={field.type}
              step={field.step || "1"}
              value={values[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
              placeholder={field.label}
            />
          )}
        </div>
      ))}
    </>
  );
}

export default function ProgramDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user, canDeleteRecords } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { getTypeConfig } = useLivelihoodTypes(token);
  const isAdmin = user?.roleName === "ADMIN";

  const [program, setProgram] = useState(null);
  const [allBeneficiaries, setAllBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedBenId, setSelectedBenId] = useState("");
  const [enrollNotes, setEnrollNotes] = useState("");
  const [enrollTypeKeys, setEnrollTypeKeys] = useState([]);
  const [enrollAttrs, setEnrollAttrs] = useState({});

  // Edit assignment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAssignId, setEditAssignId] = useState(null);
  const [editTypeKey, setEditTypeKey] = useState("");
  const [editAttrs, setEditAttrs] = useState({});
  const [editNotes, setEditNotes] = useState("");

  // Delete assignment
  const [deleteAssignId, setDeleteAssignId] = useState(null);
  const [deleteAssignName, setDeleteAssignName] = useState("");

  // Delete / edit program
  const [showDeleteProgram, setShowDeleteProgram] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventLivelihoodId, setEventLivelihoodId] = useState("");
  const [eventTypeKey, setEventTypeKey] = useState("");
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

  // Program managers
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [allProgramManagers, setAllProgramManagers] = useState([]);
  const [searchManagerQ, setSearchManagerQ] = useState("");

  // Fellows
  const [showFellowModal, setShowFellowModal] = useState(false);
  const [allFellows, setAllFellows] = useState([]);
  const [searchFellowQ, setSearchFellowQ] = useState("");

  const components =
    program?.components?.length > 0
      ? program.components
      : program?.type
        ? [{ typeKey: program.type, target: program.totalTarget }]
        : [];

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

  const effectiveTypeKey = (assign) =>
    assign.typeKey || program?.type || components[0]?.typeKey || "";

  const assignments = program?.assignments || [];
  const assignmentsByType = {};
  components.forEach((component) => {
    assignmentsByType[component.typeKey] = [];
  });
  assignments.forEach((assign) => {
    const key = effectiveTypeKey(assign);
    if (!assignmentsByType[key]) assignmentsByType[key] = [];
    assignmentsByType[key].push(assign);
  });

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedBenId || enrollTypeKeys.length === 0) {
      toast.error("Select a participant and at least one activity");
      return;
    }
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/assignments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          beneficiaryId: selectedBenId,
          components: enrollTypeKeys.map((typeKey) => ({
            typeKey,
            attributes: enrollAttrs[typeKey] || {},
            notes: enrollNotes || null,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEnrollModal(false);
        setSelectedBenId("");
        setEnrollNotes("");
        setEnrollTypeKeys([]);
        setEnrollAttrs({});
        setRefreshTrigger((p) => p + 1);
        toast.success("Participant enrolled successfully");
      } else {
        toast.error(json.error || "Failed to enroll participant");
      }
    } catch (err) {
      console.error("Enroll error:", err);
      toast.error("Failed to enroll participant");
    }
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    if (!editAssignId) return;
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/assignments/${editAssignId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ attributes: editAttrs, notes: editNotes }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        setRefreshTrigger((p) => p + 1);
        toast.success("Assignment updated");
      } else {
        toast.error(json.error || "Failed to update assignment");
      }
    } catch (err) {
      console.error("Edit assignment error:", err);
      toast.error("Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deleteAssignId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/${id}/assignments/${deleteAssignId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setDeleteAssignId(null);
        setDeleteAssignName("");
        setRefreshTrigger((p) => p + 1);
        toast.success("Assignment removed");
      } else {
        toast.error(json.error || "Failed to remove assignment");
      }
    } catch (err) {
      console.error("Delete assignment error:", err);
      toast.error("Failed to remove assignment");
    }
  };

  const handleDeleteProgram = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/${id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        toast.success("Program deleted");
        const meta = CATEGORY_META[program.category] || CATEGORY_META.FARM;
        router.push(meta.back);
      } else {
        toast.error(json.error || "Failed to delete program");
      }
    } catch (err) {
      console.error("Delete program error:", err);
      toast.error("Failed to delete program");
    }
  };

  const openManagerModal = async () => {
    setShowManagerModal(true);
    setSearchManagerQ("");
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/users?permission=livelihood", { headers });
      const json = await res.json();
      if (json.success) setAllProgramManagers(json.data);
    } catch (err) {
      console.error("Load program managers error:", err);
    }
  };

  const handleAssignManager = async (userId) => {
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/program-managers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error || "Failed to assign staff");
      else toast.success("Staff member assigned");
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      console.error("Assign program manager error:", err);
    }
  };

  const handleRemoveManager = async (userId) => {
    const confirmed = await confirm({
      title: "Remove Staff Member",
      message: "Remove this staff member from the program?",
      confirmText: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/program-managers`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error || "Failed to remove staff");
      else toast.success("Staff member removed");
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      console.error("Remove program manager error:", err);
    }
  };

  const openFellowModal = async () => {
    setShowFellowModal(true);
    setSearchFellowQ("");
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/fellows?all=1", { headers });
      const json = await res.json();
      if (json.success) setAllFellows(json.data);
    } catch (err) {
      console.error("Load fellows error:", err);
    }
  };

  const handleAssignFellow = async (fellowId) => {
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/fellows`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fellowId }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error || "Failed to assign Fellow");
      else toast.success("Fellow assigned");
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      console.error("Assign fellow error:", err);
    }
  };

  const handleRemoveFellow = async (fellowId) => {
    const confirmed = await confirm({
      title: "Remove Fellow",
      message: "Remove this Fellow from the program?",
      confirmText: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`/api/livelihood/programs/${id}/fellows`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ fellowId }),
      });
      const json = await res.json();
      if (!json.success) toast.error(json.error || "Failed to remove Fellow");
      else toast.success("Fellow removed");
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      console.error("Remove fellow error:", err);
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
      const res = await fetch("/api/livelihood/events", {
        method: "POST",
        headers,
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setShowEventModal(false);
        setEventType("");
        setEventQuantity("");
        setEventNotes("");
        setEventRecordedBy("");
        setEventPhoto(null);
        setRefreshTrigger((p) => p + 1);
        toast.success("Event logged");
      } else {
        toast.error(json.error || "Failed to log event");
      }
    } catch (err) {
      console.error("Log event error:", err);
      toast.error("Failed to log event");
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    if (!editEventId) return;
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
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
        toast.success("Event updated");
      } else {
        toast.error(json.error || "Failed to update event");
      }
    } catch (err) {
      console.error("Edit event error:", err);
      toast.error("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmed = await confirm({
      title: "Delete Event",
      message: "Delete this event?",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/events/${eventId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setRefreshTrigger((p) => p + 1);
        toast.success("Event deleted");
      } else {
        toast.error(json.error || "Failed to delete event");
      }
    } catch (err) {
      console.error("Delete event error:", err);
      toast.error("Failed to delete event");
    }
  };

  const openEnrollModal = () => {
    const typeKeys = components.map((c) => c.typeKey);
    const attrs = {};
    typeKeys.forEach((typeKey) => {
      attrs[typeKey] = buildDefaultAttrs(getTypeConfig(typeKey));
    });
    setEnrollTypeKeys(typeKeys);
    setEnrollAttrs(attrs);
    setSelectedBenId("");
    setEnrollNotes("");
    setShowEnrollModal(true);
  };

  const toggleEnrollType = (typeKey) => {
    if (enrollTypeKeys.includes(typeKey)) {
      setEnrollTypeKeys((prev) => prev.filter((k) => k !== typeKey));
      return;
    }
    setEnrollTypeKeys((prev) => [...prev, typeKey]);
    setEnrollAttrs((prev) => ({
      ...prev,
      [typeKey]: prev[typeKey] || buildDefaultAttrs(getTypeConfig(typeKey)),
    }));
  };

  const setEnrollField = (typeKey, name, value) => {
    setEnrollAttrs((prev) => ({
      ...prev,
      [typeKey]: { ...(prev[typeKey] || {}), [name]: value },
    }));
  };

  const openEditModal = (assign) => {
    setEditAssignId(assign.id);
    setEditTypeKey(effectiveTypeKey(assign));
    setEditAttrs({ ...(assign.attributes || {}) });
    setEditNotes(assign.notes || "");
    setShowEditModal(true);
  };

  const openEventModal = (assign) => {
    const typeKey = effectiveTypeKey(assign);
    const config = getTypeConfig(typeKey);
    setEventLivelihoodId(assign.id);
    setEventTypeKey(typeKey);
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
        <Link href="/livelihood" className="text-primary text-sm font-semibold hover:underline">
          Back to Livelihood Hub
        </Link>
      </div>
    );
  }

  const meta = CATEGORY_META[program.category] || CATEGORY_META.FARM;
  const assignedManagers = program.programManagers || [];
  const canManagePeople =
    isAdmin || assignedManagers.some((manager) => manager.userId === user?.id);
  const programManagerIds = new Set(assignedManagers.map((m) => m.userId));
  const filteredManagers = allProgramManagers.filter(
    (m) =>
      m.id !== user?.id &&
      ((m.name || "").toLowerCase().includes(searchManagerQ.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(searchManagerQ.toLowerCase()))
  );

  const assignedFellows = program.fellows || [];
  const assignedFellowIds = new Set(assignedFellows.map((f) => f.fellowId));
  const filteredFellows = allFellows.filter(
    (f) =>
      (f.name || "").toLowerCase().includes(searchFellowQ.toLowerCase()) ||
      (f.email || "").toLowerCase().includes(searchFellowQ.toLowerCase())
  );

  const eventConfig = getTypeConfig(eventTypeKey);
  const editConfig = getTypeConfig(editTypeKey);

  return (
    <div className="p-4 sm:p-6 md:p-10 flex-1 max-w-7xl mx-auto w-full pb-24">
      {/* Back */}
      <Link
        href={meta.back}
        className={`flex items-center gap-2 text-slate-500 ${meta.backHover} transition-colors mb-4 group w-fit`}
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to {meta.backLabel}
        </span>
      </Link>

      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {components.map((component) => {
                const config = getTypeConfig(component.typeKey);
                return (
                  <span
                    key={component.typeKey}
                    className={`px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${meta.badge}`}
                  >
                    {config?.label || component.typeKey}
                  </span>
                );
              })}
              <span className="text-xs text-on-surface-variant">
                {components.length > 1
                  ? program.category === "MIXED"
                    ? "Integrated Program"
                    : "Combined Program"
                  : meta.label}
              </span>
            </div>
            <h2 className="page-title text-on-surface break-words">{program.name}</h2>
            <p className="page-description mt-2">{program.description || "No description"}</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {(isAdmin || canManagePeople) && (
              <button
                onClick={() => setShowEditProgram(true)}
                className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-sm">edit</span>Edit Program
              </button>
            )}
            {canDeleteRecords && (
              <button
                onClick={() => setShowDeleteProgram(true)}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer border border-red-200 bg-transparent"
              >
                <span className="material-symbols-outlined text-sm">delete</span>Delete Program
              </button>
            )}
            <button
              onClick={openEnrollModal}
              className="bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>Add Participant
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-on-surface-variant">
          <span><strong className="text-on-surface">{assignments.length}</strong> Enrollments</span>
          <span><strong className="text-on-surface">{components.length}</strong> Activities</span>
          {components.map((component) => {
            const config = getTypeConfig(component.typeKey);
            const count = (assignmentsByType[component.typeKey] || []).length;
            return (
              <span key={component.typeKey}>
                {config?.label || component.typeKey}: <strong className="text-on-surface">{count}</strong>
                {component.target ? ` / ${component.target} ${config?.programTargetUnit || ""}` : ""}
              </span>
            );
          })}
        </div>

        {/* Assigned Staff */}
        <div className="bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">supervisor_account</span>
              Assigned Staff ({assignedManagers.length})
            </h3>
            {isAdmin && (
              <button
                onClick={openManagerModal}
                className="text-primary hover:bg-primary/10 px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Manage
              </button>
            )}
          </div>
          {assignedManagers.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No staff assigned to this program yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {assignedManagers.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center gap-3 bg-surface-container-low rounded-full pl-1 pr-3 py-1 border border-outline-variant/20 max-w-full min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
                    {pm.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{pm.user?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{pm.user?.email || ""}</p>
                    {pm.user?.role?.name && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold uppercase tracking-wide">
                        {formatRoleLabel(pm.user.role)}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveManager(pm.userId)}
                      className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error border-none bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fellows */}
        <div className="bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">school</span>
              Fellows ({assignedFellows.length})
            </h3>
            {canManagePeople && (
              <button
                onClick={openFellowModal}
                className="text-primary hover:bg-primary/10 px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Manage
              </button>
            )}
          </div>
          {assignedFellows.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No Fellows assigned to this program yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {assignedFellows.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 bg-surface-container-low rounded-full pl-1 pr-3 py-1 border border-outline-variant/20 max-w-full min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {f.fellow?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{f.fellow?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{f.fellow?.email || ""}</p>
                  </div>
                  {canManagePeople && (
                    <button
                      onClick={() => handleRemoveFellow(f.fellowId)}
                      className="p-1 hover:bg-error-container rounded-full cursor-pointer text-error border-none bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-component panels */}
        {components.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-outline-variant/10 text-sm text-on-surface-variant italic">
            This program has no activity types configured. Edit the program to add one.
          </div>
        ) : (
          components.map((component) => (
            <ProgramComponentPanel
              key={component.typeKey}
              component={component}
              config={getTypeConfig(component.typeKey)}
              assignments={assignmentsByType[component.typeKey] || []}
              expandedId={expandedAssignId}
              onToggleExpand={(assignId) =>
                setExpandedAssignId((prev) => (prev === assignId ? null : assignId))
              }
              onLogEvent={openEventModal}
              onEdit={openEditModal}
              onRemove={(assign) => {
                setDeleteAssignId(assign.id);
                setDeleteAssignName(assign.beneficiary?.name || "Unknown");
              }}
              onEditEvent={openEditEventModal}
              onDeleteEvent={handleDeleteEvent}
              onPhoto={setLightboxPhoto}
            />
          ))
        )}

        {/* ====== MODALS ====== */}

        {/* Enroll Modal */}
        {showEnrollModal && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowEnrollModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Enroll Participant — {program.name}</h3>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined font-bold">close</span>
                </button>
              </div>
              <form onSubmit={handleEnroll} className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Participant
                  </label>
                  <select
                    value={selectedBenId}
                    onChange={(e) => setSelectedBenId(e.target.value)}
                    required
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  >
                    <option value="">Select participant...</option>
                    {allBeneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.enrolmentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Activities
                  </label>
                  <div className="grid gap-2">
                    {components.map((component) => {
                      const config = getTypeConfig(component.typeKey);
                      const checked = enrollTypeKeys.includes(component.typeKey);
                      return (
                        <label
                          key={component.typeKey}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer ${
                            checked ? "border-primary/40 bg-primary/5" : "border-outline-variant/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEnrollType(component.typeKey)}
                          />
                          <span className="text-sm font-semibold text-on-surface">
                            {config?.label || component.typeKey}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {enrollTypeKeys.map((typeKey) => {
                  const config = getTypeConfig(typeKey);
                  return (
                    <div key={typeKey} className="border border-outline-variant/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-primary">
                          {config?.icon || "category"}
                        </span>
                        {config?.label || typeKey}
                      </p>
                      <FieldInputs
                        config={config}
                        values={enrollAttrs[typeKey] || {}}
                        onChange={(name, value) => setEnrollField(typeKey, name, value)}
                      />
                    </div>
                  );
                })}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={enrollNotes}
                    onChange={(e) => setEnrollNotes(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
                    rows="2"
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none"
                  >
                    Enroll
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Assignment Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Edit Assignment</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {editConfig?.label || editTypeKey}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined font-bold">close</span>
                </button>
              </div>
              <form onSubmit={handleEditAssignment} className="space-y-4 text-sm">
                <FieldInputs
                  config={editConfig}
                  values={editAttrs}
                  onChange={(name, value) =>
                    setEditAttrs((prev) => ({ ...prev, [name]: value }))
                  }
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
                    rows="2"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Assignment Confirmation */}
        {deleteAssignId && (
          <div
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => {
              setDeleteAssignId(null);
              setDeleteAssignName("");
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-4 sm:p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold">Remove Assignment</h3>
              <p className="text-sm text-on-surface-variant">
                Remove <strong>{deleteAssignName}</strong> from this activity? Their events will also be deleted.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setDeleteAssignId(null);
                    setDeleteAssignName("");
                  }}
                  className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAssignment}
                  className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Program */}
        {showEditProgram && program && (
          <EditProgramModal
            program={program}
            onClose={() => setShowEditProgram(false)}
            onSaved={() => setRefreshTrigger((p) => p + 1)}
          />
        )}

        {/* Delete Program Confirmation */}
        {showDeleteProgram && (
          <div
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => setShowDeleteProgram(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-4 sm:p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-on-surface">Delete Program</h3>
              <p className="text-sm text-on-surface-variant">
                Delete <strong>{program.name}</strong> permanently? This removes all {assignments.length}{" "}
                assignments and their events.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteProgram(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProgram}
                  className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Log Event Modal */}
        {showEventModal && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Log Event</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {eventConfig?.label || eventTypeKey}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-full cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined font-bold">close</span>
                </button>
              </div>
              <form onSubmit={handleLogEvent} className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    required
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  >
                    {(eventConfig?.eventTypes || []).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Date</label>
                  <DateInput
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={eventQuantity}
                    onChange={(e) => setEventQuantity(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                    placeholder="Optional"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
                    rows="2"
                    placeholder="Optional notes..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recorded By</label>
                  <input
                    type="text"
                    value={eventRecordedBy}
                    onChange={(e) => setEventRecordedBy(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                    placeholder="Name of recorder"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEventPhoto(e.target.files[0] || null)}
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none"
                  >
                    Log Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditEventModal && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowEditEventModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit Event</h3>
                <button
                  onClick={() => setShowEditEventModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-full cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined font-bold">close</span>
                </button>
              </div>
              <form onSubmit={handleEditEvent} className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Type</label>
                  <input
                    type="text"
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Date</label>
                  <DateInput
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editEventQuantity}
                    onChange={(e) => setEditEventQuantity(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={editEventNotes}
                    onChange={(e) => setEditEventNotes(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans resize-none"
                    rows="2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recorded By</label>
                  <input
                    type="text"
                    value={editEventRecordedBy}
                    onChange={(e) => setEditEventRecordedBy(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface font-sans"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditEventModal(false)}
                    className="px-4 py-2 rounded-full border border-outline-variant cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors cursor-pointer border-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Assigned Staff */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
                <h3 className="text-lg font-bold text-on-surface">Manage Assigned Staff</h3>
                <button
                  onClick={() => setShowManagerModal(false)}
                  className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-on-surface-variant mb-4">
                  Assign or remove staff for this program. Assigned staff can manage the participants enrolled in it.
                </p>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchManagerQ}
                  onChange={(e) => setSearchManagerQ(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4"
                />
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredManagers.length === 0 && (
                    <p className="text-sm text-on-surface-variant text-center py-4">No staff accounts found.</p>
                  )}
                  {filteredManagers.map((m) => {
                    const isAssigned = programManagerIds.has(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"}`}
                      >
                        <div>
                          <p className="font-semibold text-on-surface text-sm">{m.name}</p>
                          <p className="text-xs text-on-surface-variant">{m.email}</p>
                          {m.role?.name && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                              {formatRoleLabel(m.role)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => (isAssigned ? handleRemoveManager(m.id) : handleAssignManager(m.id))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border-none ${isAssigned ? "bg-error-container text-on-error-container hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                        >
                          {isAssigned ? "Remove" : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Fellows */}
        {showFellowModal && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
                <h3 className="text-lg font-bold text-on-surface">Manage Fellows</h3>
                <button
                  onClick={() => setShowFellowModal(false)}
                  className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-on-surface-variant mb-4">
                  Assign or remove Fellows for this program. Fellows can view the program and its participants.
                </p>
                <input
                  type="text"
                  placeholder="Search fellows..."
                  value={searchFellowQ}
                  onChange={(e) => setSearchFellowQ(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface text-sm text-on-surface focus:outline-none focus:border-primary mb-4"
                />
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredFellows.length === 0 && (
                    <p className="text-sm text-on-surface-variant text-center py-4">No Fellows found.</p>
                  )}
                  {filteredFellows.map((f) => {
                    const isAssigned = assignedFellowIds.has(f.id);
                    return (
                      <div
                        key={f.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-outline-variant hover:bg-surface-container"}`}
                      >
                        <div>
                          <p className="font-semibold text-on-surface text-sm">{f.name}</p>
                          <p className="text-xs text-on-surface-variant">{f.email || ""}</p>
                        </div>
                        <button
                          onClick={() => (isAssigned ? handleRemoveFellow(f.id) : handleAssignFellow(f.id))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border-none ${isAssigned ? "bg-error-container text-on-error-container hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                        >
                          {isAssigned ? "Remove" : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <PhotoLightbox
          src={lightboxPhoto}
          alt="Event photo"
          onClose={() => setLightboxPhoto(null)}
        />
      </div>
    </div>
  );
}
