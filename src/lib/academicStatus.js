// Derives a student's academic-progress status purely from attendance.
// Attendance is a percentage (0-100) recomputed from attendance logs on the server.
// A missing/zero value means there is no attendance data recorded yet.

export const ACADEMIC_STATUSES = ["Excelling", "On Track", "Needs Attention", "At Risk", "No Data"];

export const PERFORMANCE_FILTERS = ["All Performance", "Excelling", "On Track", "Needs Attention", "At Risk"];

export function deriveAcademicStatus(attendance) {
  const att = Number(attendance);
  if (attendance === null || attendance === undefined || Number.isNaN(att) || att <= 0) {
    return "No Data";
  }
  if (att >= 85) return "Excelling";
  if (att >= 70) return "On Track";
  if (att >= 50) return "Needs Attention";
  return "At Risk";
}

const STATUS_CLASSES = {
  Excelling: "bg-primary-fixed text-on-primary-fixed",
  "On Track": "bg-primary-fixed text-on-primary-fixed",
  Satisfactory: "bg-surface-container text-on-surface-variant",
  "Needs Attention": "bg-error-container text-on-error-container",
  "At Risk": "bg-error-container text-on-error-container",
  "No Data": "bg-surface-container text-on-surface-variant",
};

export function getAcademicStatusClass(status) {
  return STATUS_CLASSES[status] || STATUS_CLASSES["No Data"];
}

export function matchesPerformanceFilter(status, filter) {
  if (!filter || filter === "All Performance") return true;
  return status === filter;
}
