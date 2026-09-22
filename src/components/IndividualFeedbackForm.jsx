"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { SUBJECT_OPTIONS } from "@/data/fellowPerformanceConstants";

function getISTDate() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const inputClass =
  "w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide";

export default function IndividualFeedbackForm({
  feedback,
  fellowId,
  token,
  onClose,
  onSaved,
}) {
  const toast = useToast();
  const isNew = !feedback;

  const initialSubjectIsOther =
    feedback?.subject === "Other" || (feedback?.subject && !SUBJECT_OPTIONS.includes(feedback.subject));

  const [date, setDate] = useState(() => {
    if (feedback?.date) {
      const d = new Date(feedback.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    }
    return getISTDate();
  });
  const [classroomLevel, setClassroomLevel] = useState(feedback?.classroomLevel || "");
  const [classGroup, setClassGroup] = useState(feedback?.classGroup || "");
  const [subject, setSubject] = useState(
    initialSubjectIsOther ? "Other" : feedback?.subject || ""
  );
  const [subjectOther, setSubjectOther] = useState(
    initialSubjectIsOther ? feedback?.subjectOther || feedback?.subject || "" : ""
  );
  const [lessonPlanLink, setLessonPlanLink] = useState(feedback?.lessonPlanLink || "");
  const [lessonPlanFeedback, setLessonPlanFeedback] = useState(
    Boolean(feedback?.lessonPlanFeedback)
  );
  const [strengths, setStrengths] = useState(feedback?.strengths || "");
  const [areasOfDevelopment, setAreasOfDevelopment] = useState(
    feedback?.areasOfDevelopment || ""
  );
  const [nextStepsFellow, setNextStepsFellow] = useState(feedback?.nextStepsFellow || "");
  const [nextStepPM, setNextStepPM] = useState(feedback?.nextStepPM || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !subject) {
      toast.error("Date and Subject are required");
      return;
    }
    if (subject === "Other" && !subjectOther.trim()) {
      toast.error("Please specify the subject");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date,
        classroomLevel,
        classGroup,
        subject,
        subjectOther: subject === "Other" ? subjectOther : "",
        lessonPlanLink,
        lessonPlanFeedback,
        strengths,
        areasOfDevelopment,
        nextStepsFellow,
        nextStepPM,
      };

      const res = await fetch(
        isNew
          ? `/api/fellows/${fellowId}/individual-feedback`
          : `/api/fellows/${fellowId}/individual-feedback/${feedback.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "Feedback added successfully!" : "Feedback updated successfully!");
        onSaved?.(json.data, isNew);
      } else {
        toast.error(json.error || "Failed to save feedback");
      }
    } catch (err) {
      console.error("Failed to save individual feedback:", err);
      toast.error("An error occurred while saving feedback");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl font-sans flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-outline-variant/30 shrink-0">
          <h3 className="text-lg font-bold text-on-surface">
            {isNew ? "Add Individual Feedback" : "Edit Individual Feedback"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 text-sm">
          <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Classroom Level</label>
              <input
                type="text"
                placeholder="e.g. Grade 3"
                value={classroomLevel}
                onChange={(e) => setClassroomLevel(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Class Group</label>
              <input
                type="text"
                placeholder="e.g. Group A"
                value={classGroup}
                onChange={(e) => setClassGroup(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Subject</label>
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`${inputClass} dark:bg-slate-900`}
              >
                <option value="">Select Subject</option>
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {subject === "Other" && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className={labelClass}>Specify Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Enter subject name"
                  value={subjectOther}
                  onChange={(e) => setSubjectOther(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className={labelClass}>Lesson Plan (Link)</label>
              <input
                type="url"
                placeholder="https://..."
                value={lessonPlanLink}
                onChange={(e) => setLessonPlanLink(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <input
              type="checkbox"
              checked={lessonPlanFeedback}
              onChange={(e) => setLessonPlanFeedback(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-on-surface">
              Lesson plan feedback provided
            </span>
          </label>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Strengths</label>
            <textarea
              rows={2}
              placeholder="What did the fellow do well?"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Areas of Development</label>
            <textarea
              rows={2}
              placeholder="Areas to improve"
              value={areasOfDevelopment}
              onChange={(e) => setAreasOfDevelopment(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Next Steps for Fellow</label>
            <textarea
              rows={2}
              placeholder="Action items for the fellow"
              value={nextStepsFellow}
              onChange={(e) => setNextStepsFellow(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Next Step for PM</label>
            <textarea
              rows={2}
              placeholder="Action items for the program manager"
              value={nextStepPM}
              onChange={(e) => setNextStepPM(e.target.value)}
              className={inputClass}
            />
          </div>
          </div>

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-outline-variant/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving..." : isNew ? "Save Feedback" : "Update Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
