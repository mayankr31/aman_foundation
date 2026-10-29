// Organisation-wide option lists shared by HR, Admin and self-service forms.

export const DEPARTMENTS = [
  "Executive Office",
  "Education",
  "Livelihood",
  "Disaster Relief",
  "Operations",
  "Human Resources",
  "Finance & Accounts",
  "Monitoring & Evaluation",
];

// Departments that make the most sense for each role. These are shown first
// (and used as a default) but users can still pick any department.
export const ROLE_DEPARTMENTS = {
  ADMIN: ["Executive Office"],
  PROGRAM_DIRECTOR: ["Executive Office"],
  PROGRAM_LEAD: ["Education", "Livelihood", "Disaster Relief", "Operations"],
  PROGRAM_MANAGER: ["Education", "Livelihood", "Disaster Relief", "Operations"],
  PROGRAM_COORDINATOR: ["Education", "Livelihood", "Disaster Relief", "Operations"],
  FIELD_EXECUTIVE: ["Education", "Livelihood", "Disaster Relief"],
  CLASS_ASSISTANT: ["Education", "Livelihood", "Disaster Relief"],
  FELLOW: ["Education", "Livelihood", "Disaster Relief"],
  HR: ["Human Resources"],
  ACCOUNTANT: ["Finance & Accounts"],
};

export const OTHER_QUALIFICATION = "Other";

export const QUALIFICATIONS = [
  "Below 10th",
  "10th Pass",
  "12th Pass",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "M.Phil",
  "PhD",
  "Other",
];

export function getSuggestedDepartments(roleName) {
  if (!roleName) return [];
  return ROLE_DEPARTMENTS[roleName] || [];
}

export function getDefaultDepartment(roleName) {
  return getSuggestedDepartments(roleName)[0] || "";
}

/** Ensures a legacy department value is still selectable if it is not in the list. */
export function getDepartmentOptions(roleName, currentValue) {
  const suggested = getSuggestedDepartments(roleName);
  const others = DEPARTMENTS.filter((dept) => !suggested.includes(dept));
  const legacy =
    currentValue && !DEPARTMENTS.includes(currentValue) ? [currentValue] : [];
  return { suggested, others: [...others, ...legacy] };
}
