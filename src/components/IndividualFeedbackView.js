"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import IndividualFeedbackForm from "@/components/IndividualFeedbackForm";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Section({ label, value, tone }) {
  if (!value) return null;
  return (
    <div className={`p-4 rounded-lg border ${tone.bg} ${tone.border}`}>
      <p className={`text-xs uppercase tracking-widest font-bold mb-1.5 ${tone.text}`}>
        {label}
      </p>
      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

export default function IndividualFeedbackView({ fellowId, token, canManage = false }) {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!fellowId || !token) return;
    let cancelled = false;
    async function loadRecords() {
      try {
        const res = await fetch(`/api/fellows/${fellowId}/individual-feedback`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setRecords(json.data || []);
        } else {
          toast.error(json.error || "Failed to load feedback");
        }
      } catch (err) {
        console.error("Failed to load individual feedback:", err);
        if (!cancelled) toast.error("An error occurred while loading feedback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRecords();
    return () => {
      cancelled = true;
    };
  }, [fellowId, token, toast]);

  const handleSaved = (record, isNew) => {
    setRecords((prev) => {
      if (isNew) return [record, ...prev];
      const idx = prev.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/fellows/${fellowId}/individual-feedback/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (json.success) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        toast.success("Feedback deleted successfully!");
      } else {
        toast.error(json.error || "Failed to delete feedback");
      }
    } catch (err) {
      console.error("Failed to delete feedback:", err);
      toast.error("An error occurred while deleting feedback");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-headline font-bold text-xl text-on-surface">
          Individual Feedback Tracking
        </h3>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Feedback
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
          No individual feedback has been recorded yet.
          {canManage && " Click \u201cAdd Feedback\u201d to create the first entry."}
        </div>
      ) : (
        <div className="space-y-5">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 hover:border-primary/30 transition-colors font-sans"
            >
              <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    calendar_today
                  </span>
                  <h4 className="font-bold text-on-surface text-lg">
                    {formatDate(record.date)}
                  </h4>
                  <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {record.subject === "Other"
                      ? record.subjectOther || "Other"
                      : record.subject}
                  </span>
                  {record.classroomLevel && (
                    <span className="bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      {record.classroomLevel}
                    </span>
                  )}
                  {record.classGroup && (
                    <span className="bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">groups</span>
                      {record.classGroup}
                    </span>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(record);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Edit feedback"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(record)}
                      className="p-2 rounded-full text-on-surface-variant hover:text-red-600 hover:bg-surface-container transition-colors cursor-pointer"
                      title="Delete feedback"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                {record.lessonPlanLink && (
                  <a
                    href={record.lessonPlanLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs text-blue-600 dark:text-blue-400 font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    View Lesson Plan
                  </a>
                )}
                {record.lessonPlanFeedback && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Lesson Plan Feedback Provided
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Section
                  label="Strengths"
                  value={record.strengths}
                  tone={{ bg: "bg-emerald-50/60", border: "border-emerald-100", text: "text-emerald-700" }}
                />
                <Section
                  label="Areas of Development"
                  value={record.areasOfDevelopment}
                  tone={{ bg: "bg-amber-50/60", border: "border-amber-100", text: "text-amber-700" }}
                />
                <Section
                  label="Next Steps for Fellow"
                  value={record.nextStepsFellow}
                  tone={{ bg: "bg-blue-50/60", border: "border-blue-100", text: "text-blue-700" }}
                />
                <Section
                  label="Next Step for PM"
                  value={record.nextStepPM}
                  tone={{ bg: "bg-violet-50/60", border: "border-violet-100", text: "text-violet-700" }}
                />
              </div>

              <div className="text-xs text-slate-400 mt-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">person</span>
                Added by:{" "}
                <span className="font-semibold text-on-surface">
                  {record.author?.name || "Unknown"}
                </span>
                <span className="w-1 h-1 bg-surface-container-highest rounded-full"></span>
                {formatDate(record.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <IndividualFeedbackForm
          feedback={editing}
          fellowId={fellowId}
          token={token}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback entry? This action is permanent and cannot be undone."
      />
    </div>
  );
}
