"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import PhotoLightbox from "@/components/PhotoLightbox";
import AssignmentsSection from "@/components/AssignmentsSection";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import BasicDetailsView from "@/components/BasicDetailsView";
import TeamCheckInSection from "@/components/TeamCheckInSection";
import { DEFAULT_EMPLOYEE_DETAIL_TAB, getEmployeeDetailTabs } from "@/lib/profileTabs";
import useAutoScrollActiveTab from "@/lib/useAutoScrollActiveTab";
import { formatDate } from "@/lib/date";
import { QUALIFICATIONS, getDefaultDepartment, getDepartmentOptions } from "@/lib/organization";
import { formatRoleLabel } from "@/lib/roles";
import { getManagerCandidates } from "@/lib/roleHierarchy";
import DateInput from "@/components/ui/DateInput";
import Avatar from "@/components/ui/Avatar";
import {
  validateMobile,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateIfsc,
  validateBankAccount,
  validateEmail,
  validatePersonName,
  validateRequired,
  validateDateNotFuture,
  validateDateOrder,
  firstError,
  toMobileInput,
  toAadhaarInput,
  toPanInput,
  toVoterIdInput,
  toIfscInput,
  toBankAccountInput,
  toPersonNameInput,
} from "@/lib/validation";

const PERSONAL_FIELDS = [
  "name",
  "email",
  "mobile",
  "department",
  "gender",
  "maritalStatus",
  "bloodGroup",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "aadharNumber",
  "panCard",
  "voterId",
  "highestQualification",
  "highestQualificationDetail",
  "bankName",
  "bankAccountNo",
  "bankIfsc",
];

const EXIT_MANAGER_ROLES = ["ADMIN", "HR"];

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function HrEmployeeProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <HrEmployeeProfileContent />
    </Suspense>
  );
}

function HrEmployeeProfileContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user: currentUser, can } = useAuth();
  const canWrite = can("employees", "WRITE");
  const canWriteTasks = can("tasks", "WRITE") || currentUser?.roleName === "ADMIN";
  const isAdmin = currentUser?.roleName === "ADMIN";
  const canManageExit = EXIT_MANAGER_ROLES.includes(currentUser?.roleName);
  const toast = useToast();

  const [employee, setEmployee] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const requestedTabSlug = searchParams.get("tab");
  // Team CheckIns are only visible to the Executive Director, the employee
  // themselves, or the employee's direct reporting manager.
  const canViewTeamCheckIn =
    isAdmin ||
    (employee?.id && currentUser?.id === employee.id) ||
    (employee?.managerId && currentUser?.id === employee.managerId);
  const employeeTabs = getEmployeeDetailTabs(employee?.role?.name).filter(
    (tab) => tab.slug !== "team-checkin" || canViewTeamCheckIn
  );
  const activeTab =
    employeeTabs.find((tab) => tab.slug === requestedTabSlug)?.label ||
    DEFAULT_EMPLOYEE_DETAIL_TAB;
  const { containerRef: tabsContainerRef, setActiveRef: setActiveTabRef } = useAutoScrollActiveTab(
    activeTab,
    !loading && Boolean(employee)
  );

  useEffect(() => {
    if (token && id) {
      fetchEmployee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  useEffect(() => {
    if (employee?.fellow?.id && can("education")) {
      router.replace(`/education/fellows/${employee.fellow.id}`);
    }
  }, [employee, router, can]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setManagers((json.data || []).filter((u) => u.id !== id));
      })
      .catch(() => {});
  }, [token, isAdmin, id]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee(data.data);
        setForm(buildForm(data.data));
      } else {
        toast.error?.(data.error || "Failed to load employee");
      }
    } catch {
      toast.error?.("Error loading employee");
    } finally {
      setLoading(false);
    }
  };

  const buildForm = (u) => {
    const next = {};
    for (const field of PERSONAL_FIELDS) next[field] = u[field] ?? "";
    next.mobile = toMobileInput(u.mobile ?? "");
    next.emergencyContactPhone = toMobileInput(u.emergencyContactPhone ?? "");
    next.aadharNumber = toAadhaarInput(u.aadharNumber ?? "");
    next.panCard = toPanInput(u.panCard ?? "");
    next.voterId = toVoterIdInput(u.voterId ?? "");
    next.bankAccountNo = toBankAccountInput(u.bankAccountNo ?? "");
    next.bankIfsc = toIfscInput(u.bankIfsc ?? "");
    next.department = u.department || getDefaultDepartment(u.role?.name) || "";
    next.dob = toDateInput(u.dob);
    next.dateOfJoining = toDateInput(u.dateOfJoining);
    next.dateOfLeaving = toDateInput(u.dateOfLeaving);
    next.resignationReason = u.resignationReason ?? "";
    next.managerId = u.managerId || "";
    return next;
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch(`/api/users/${id}/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee((prev) => ({ ...prev, avatar: data.data.avatar }));
        toast.success?.("Photo updated");
      } else {
        toast.error?.(data.error || "Upload failed");
      }
    } catch {
      toast.error?.("Error uploading photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    const add = (field, message) => {
      if (message) nextErrors[field] = message;
    };

    add("name", validatePersonName(form.name, { required: true }));
    add("email", validateEmail(form.email, { required: true }));
    add("mobile", validateMobile(form.mobile, { required: true }));
    add("department", validateRequired(form.department, "Department"));
    add("dateOfJoining", validateDateNotFuture(form.dateOfJoining, { required: true, label: "Date of joining" }));
    add("gender", validateRequired(form.gender, "Gender"));
    add("dob", validateDateNotFuture(form.dob, { required: true, label: "Date of birth" }));
    add("maritalStatus", validateRequired(form.maritalStatus, "Marital status"));
    add("bloodGroup", validateRequired(form.bloodGroup, "Blood group"));
    add("address", validateRequired(form.address, "Address"));
    add("emergencyContactName", validatePersonName(form.emergencyContactName, { required: true }));
    add("emergencyContactPhone", validateMobile(form.emergencyContactPhone, { required: true }));
    add("aadharNumber", validateAadhaar(form.aadharNumber, { required: true }));
    add("panCard", validatePan(form.panCard, { required: true }));
    add("voterId", validateVoterId(form.voterId, { required: true }));
    add("highestQualification", validateRequired(form.highestQualification, "Highest qualification"));
    if (form.highestQualification === "Other") {
      add("highestQualificationDetail", validateRequired(form.highestQualificationDetail, "Specify qualification"));
    }
    add("bankName", validateRequired(form.bankName, "Bank name"));
    add("bankAccountNo", validateBankAccount(form.bankAccountNo, { required: true }));
    add("bankIfsc", validateIfsc(form.bankIfsc, { required: true }));

    if (canManageExit) {
      add("dateOfLeaving", validateDateNotFuture(form.dateOfLeaving, { label: "Date of leaving" }));
      if (form.dateOfLeaving) {
        add("resignationReason", validateRequired(form.resignationReason, "Reason for leaving"));
      } else if (form.resignationReason) {
        add("resignationReason", "Date of leaving is required when a reason is provided.");
      }
      add(
        "dateOfLeaving",
        validateDateOrder(form.dateOfJoining, form.dateOfLeaving, {
          startLabel: "Date of joining",
          endLabel: "Date of leaving",
        })
      );
    }

    setFieldErrors(nextErrors);
    const firstMessage = firstError(Object.values(nextErrors));
    if (firstMessage) {
      toast.error?.(firstMessage);
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!canManageExit) {
        delete payload.dateOfLeaving;
        delete payload.resignationReason;
      }
      if (!isAdmin) {
        delete payload.managerId;
      }

      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee((prev) => ({ ...prev, ...data.data }));
        setIsEditing(false);
        setFieldErrors({});
        toast.success?.("Profile updated successfully");
      } else {
        toast.error?.(data.error || "Failed to update profile");
      }
    } catch {
      toast.error?.("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-10 text-center text-on-surface-variant font-sans">
        Employee not found.
      </div>
    );
  }

  const initials = (employee.name || employee.username || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const input = (label, field, type = "text", required = false, inputProps = {}) => {
    const { transform, hint, ...rest } = inputProps;
    const fieldError = fieldErrors[field];
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-error ml-0.5">*</span>}</label>
        {type === "date" ? (
          <DateInput
            name={field}
            value={form[field] ?? ""}
            onChange={(e) => setField(field, e.target.value)}
            aria-invalid={Boolean(fieldError)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-on-surface text-sm ${fieldError ? "border-error" : "border-outline-variant"}`}
            required={required}
            {...rest}
          />
        ) : (
          <input
            type={type}
            value={form[field] ?? ""}
            onChange={(e) => setField(field, transform ? transform(e.target.value) : e.target.value)}
            aria-invalid={Boolean(fieldError)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-on-surface text-sm ${fieldError ? "border-error" : "border-outline-variant"}`}
            {...rest}
          />
        )}
        {hint && !fieldError && <span className="text-[11px] text-on-surface-variant">{hint}</span>}
        {fieldError && <span className="text-[11px] font-medium text-error">{fieldError}</span>}
      </div>
    );
  };

  const select = (label, field, options, { required = false } = {}) => {
    const fieldError = fieldErrors[field];
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-error ml-0.5">*</span>}</label>
        <select
          value={form[field] ?? ""}
          onChange={(e) => setField(field, e.target.value)}
          aria-invalid={Boolean(fieldError)}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent dark:bg-slate-900 text-on-surface text-sm ${fieldError ? "border-error" : "border-outline-variant"}`}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {fieldError && <span className="text-[11px] font-medium text-error">{fieldError}</span>}
      </div>
    );
  };

  const textarea = (label, field, required = false) => {
    const fieldError = fieldErrors[field];
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-error ml-0.5">*</span>}</label>
        <textarea
          rows={3}
          value={form[field] ?? ""}
          onChange={(e) => setField(field, e.target.value)}
          aria-invalid={Boolean(fieldError)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-on-surface text-sm ${fieldError ? "border-error" : "border-outline-variant"}`}
        />
        {fieldError && <span className="text-[11px] font-medium text-error">{fieldError}</span>}
      </div>
    );
  };

  const departmentOptions = getDepartmentOptions(employee.role?.name, form.department);
  const departmentError = fieldErrors.department;
  const managerCandidates = getManagerCandidates(managers, employee.role?.name, {
    excludeUserId: employee.id,
  });
  const currentManagerMissing =
    employee.manager && !managerCandidates.some((manager) => manager.id === employee.manager.id);
  const inactiveDate = employee.inactiveSince || employee.dateOfLeaving;
  const managedSchools = (employee.managedSchools || []).map((item) => item.school);
  const managedCentres = (employee.managedCentres || []).map((item) => item.centre);
  const managedPrograms = (employee.managedLivelihoodPrograms || []).map((item) => item.program);
  const canEditAssignments = isAdmin && PROGRAM_ROLES.includes(employee.role?.name);

  return (
    <div className="p-4 sm:p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-5xl mx-auto w-full">
      <Link
        href="/hr"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Employees
        </span>
      </Link>

      {!isEditing && (
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-8 shadow-ambient border border-surface-container-low mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center">
              <Avatar
                src={employee.avatar}
                name={employee.name || employee.username}
                fallback={initials}
                className="w-full h-full object-cover cursor-pointer"
                fallbackClassName="text-3xl font-bold font-headline text-on-surface-variant"
                onClick={() => setLightboxPhoto(employee.avatar)}
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="page-title text-on-surface capitalize mb-1">
                {employee.name || employee.username}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 text-sm text-on-surface-variant">
                <span className="text-primary font-semibold">
                  {formatRoleLabel(employee.role?.name)}
                </span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <span>{employee.department || "Unassigned"}</span>
              </div>
              {employee.employeeId && (
                <p className="text-[11px] font-semibold text-slate-400 mt-2">{employee.employeeId}</p>
              )}
              {employee.status === "INACTIVE" && (
                <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[14px]">person_off</span>
                  {inactiveDate ? `Inactive since ${formatDate(inactiveDate)}` : "Inactive"}
                </span>
              )}
            </div>
          </div>
          {!isEditing && canWrite && (
            <button
              onClick={() => {
                setForm(buildForm(employee));
                setFieldErrors({});
                setIsEditing(true);
              }}
              className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Details
            </button>
          )}
        </div>
      </div>
      )}

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="bg-surface-container-lowest rounded-xl p-5 sm:p-8 shadow-ambient border border-surface-container-low space-y-8 font-sans"
        >
          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-surface shadow bg-surface-container-high flex items-center justify-center">
                <Avatar
                  src={employee.avatar}
                  name={employee.name || employee.username}
                  fallback={initials}
                  fallbackClassName="text-2xl font-bold font-headline text-on-surface-variant"
                />
              </div>
              <label className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                {uploading ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Employment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Full Name", "name", "text", true, { transform: toPersonNameInput })}
              {input("Email", "email", "email", true, { autoComplete: "email" })}
              {input("Mobile / Phone", "mobile", "tel", true, { transform: toMobileInput, inputMode: "numeric", maxLength: 10, pattern: "[0-9]{10}", hint: "10 digits, numbers only (no +91)." })}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Employee ID</label>
                <div className="px-4 py-2 border rounded-lg border-outline-variant bg-surface-container text-on-surface text-sm">
                  {employee.employeeId || "—"}
                </div>
                <span className="text-[11px] text-on-surface-variant">Auto-generated and cannot be edited.</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Department<span className="text-error ml-0.5">*</span></label>
                <select
                  value={form.department ?? ""}
                  onChange={(e) => setField("department", e.target.value)}
                  aria-invalid={Boolean(departmentError)}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent dark:bg-slate-900 text-on-surface text-sm ${departmentError ? "border-error" : "border-outline-variant"}`}
                >
                  <option value="">—</option>
                  {departmentOptions.suggested.length > 0 && (
                    <optgroup label="Suggested for this role">
                      {departmentOptions.suggested.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="All departments">
                    {departmentOptions.others.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </optgroup>
                </select>
                {departmentError && <span className="text-[11px] font-medium text-error">{departmentError}</span>}
              </div>

              {input("Date of Joining", "dateOfJoining", "date", true, { max: new Date().toISOString().slice(0, 10) })}

              {isAdmin && (
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Reports To</label>
                  <select
                    value={form.managerId ?? ""}
                    onChange={(e) => setField("managerId", e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
                  >
                    <option value="">No manager / top level</option>
                    {currentManagerMissing && employee.manager && (
                      <option value={employee.manager.id}>
                        {employee.manager.name} ({formatRoleLabel(employee.manager.role?.name)}) — current
                      </option>
                    )}
                    {managerCandidates.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({formatRoleLabel(manager.role?.name)})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-on-surface-variant">
                    Only roles senior to {formatRoleLabel(employee.role?.name)} are listed.
                  </span>
                </div>
              )}
            </div>
          </section>

          {canManageExit && (
            <section>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-1">Exit Details</h3>
              <p className="text-[11px] text-on-surface-variant mb-4">
                Setting a leaving date will mark this employee inactive immediately.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {input("Date of Leaving", "dateOfLeaving", "date", false, { max: new Date().toISOString().slice(0, 10) })}
                <div className="md:col-span-2">
                  {textarea("Reason for Leaving", "resignationReason")}
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Highest Qualification<span className="text-error ml-0.5">*</span></label>
                <select
                  value={form.highestQualification ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      highestQualification: value,
                      highestQualificationDetail: value === "Other" ? prev.highestQualificationDetail : "",
                    }));
                  }}
                  aria-invalid={Boolean(fieldErrors.highestQualification)}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent dark:bg-slate-900 text-on-surface text-sm ${fieldErrors.highestQualification ? "border-error" : "border-outline-variant"}`}
                >
                  <option value="">—</option>
                  {QUALIFICATIONS.map((qualification) => (
                    <option key={qualification} value={qualification}>{qualification}</option>
                  ))}
                </select>
                {fieldErrors.highestQualification && (
                  <span className="text-[11px] font-medium text-error">{fieldErrors.highestQualification}</span>
                )}
              </div>
              {form.highestQualification === "Other" && (
                input("Specify Qualification", "highestQualificationDetail", "text", true, { maxLength: 100 })
              )}
              {select("Gender", "gender", ["Male", "Female", "Other"], { required: true })}
              {input("Date of Birth", "dob", "date", true, { max: new Date().toISOString().slice(0, 10) })}
              {select("Marital Status", "maritalStatus", ["Single", "Married", "Divorced", "Widowed"], { required: true })}
              {select("Blood Group", "bloodGroup", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], { required: true })}
              <div className="md:col-span-2">
                {textarea("Address", "address", true)}
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Contact Name", "emergencyContactName", "text", true, { transform: toPersonNameInput })}
              {input("Contact Phone", "emergencyContactPhone", "tel", true, { transform: toMobileInput, inputMode: "numeric", maxLength: 10, pattern: "[0-9]{10}", hint: "10 digits, numbers only (no +91)." })}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Government IDs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Aadhaar Number", "aadharNumber", "text", true, { transform: toAadhaarInput, inputMode: "numeric", maxLength: 12, pattern: "[0-9]{12}", hint: "12 digits, numbers only." })}
              {input("PAN Card", "panCard", "text", true, { transform: toPanInput, maxLength: 10, pattern: "[A-Z]{5}[0-9]{4}[A-Z]", hint: "Format: ABCDE1234F." })}
              {input("Voter ID", "voterId", "text", true, { transform: toVoterIdInput, maxLength: 10, pattern: "[A-Z]{3}[0-9]{7}", hint: "Format: ABC1234567." })}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Bank Name", "bankName", "text", true)}
              {input("Account Number", "bankAccountNo", "text", true, { transform: toBankAccountInput, inputMode: "numeric", maxLength: 18, pattern: "[0-9]{9,18}", hint: "9 to 18 digits, numbers only." })}
              {input("IFSC Code", "bankIfsc", "text", true, { transform: toIfscInput, maxLength: 11, pattern: "[A-Z]{4}0[A-Z0-9]{6}", hint: "Format: SBIN0007421." })}
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="font-sans">
          {/* Mobile tab selector */}
          <div className="md:hidden mb-6">
            <label htmlFor="employee-tab" className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Profile section
            </label>
            <select
              id="employee-tab"
              value={activeTab}
              onChange={(e) => {
                const nextTab = employeeTabs.find((tab) => tab.label === e.target.value);
                router.replace(`/hr/${id}?tab=${nextTab?.slug || "employment"}`, { scroll: false });
              }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary"
            >
              {employeeTabs.map((tab) => (
                <option key={tab.slug} value={tab.label}>{tab.label}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div ref={tabsContainerRef} className="hidden md:flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar">
            {employeeTabs.map((tab) => {
              const isActive = activeTab === tab.label;
              return (
                <button
                  key={tab.slug}
                  ref={isActive ? setActiveTabRef : null}
                  onClick={() => router.replace(`/hr/${id}?tab=${tab.slug}`, { scroll: false })}
                  className={`px-3 sm:px-6 py-2.5 sm:py-3 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "font-semibold text-primary border-b-2 border-primary"
                      : "font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-w-0 space-y-6">
            {activeTab === "Personal Details" && (
              <BasicDetailsView person={employee} />
            )}

            {activeTab === "Monthly Planner" && (
              <MonthlyPlanner userId={employee.id} canEdit={canWriteTasks} />
            )}

            {activeTab === "Assignments" && employee.role?.name !== "ADMIN" && (
              <AssignmentsSection
                title="Assignments"
                userId={employee.id}
                schools={managedSchools}
                centres={managedCentres}
                programs={managedPrograms}
                canEdit={canEditAssignments}
              />
            )}

            {activeTab === "Team CheckIn" && (
              <TeamCheckInSection
                userId={employee.id}
                memberName={employee.name}
                memberRole={employee.role?.name}
                memberManagerId={employee.managerId}
              />
            )}
          </div>
        </div>
      )}

      <PhotoLightbox src={lightboxPhoto} alt="Employee photo" onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}
