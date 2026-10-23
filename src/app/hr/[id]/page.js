"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import PhotoLightbox from "@/components/PhotoLightbox";
import { formatDate } from "@/lib/date";
import {
  validateMobile,
  validateAadhaar,
  validatePan,
  validateIfsc,
  validateBankAccount,
  validateEmail,
  validatePersonName,
  validateDateNotFuture,
  firstError,
  toMobileInput,
  toAadhaarInput,
  toPanInput,
  toIfscInput,
  toBankAccountInput,
  toPersonNameInput,
} from "@/lib/validation";

const DEPARTMENTS = ["Operations", "Logistics", "Education", "HR", "Finance"];

const PERSONAL_FIELDS = [
  "name",
  "email",
  "mobile",
  "department",
  "employeeId",
  "gender",
  "maritalStatus",
  "bloodGroup",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "aadharNumber",
  "panCard",
  "bankName",
  "bankAccountNo",
  "bankIfsc",
];

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function HrEmployeeProfilePage() {
  const { id } = useParams();
  const { token, user: currentUser, can } = useAuth();
  const canWrite = can("employees", "WRITE");
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

  useEffect(() => {
    if (token && id) {
      fetchEmployee();
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || currentUser?.roleName !== "ADMIN") return;
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setManagers((json.data || []).filter((u) => u.id !== id));
      })
      .catch(() => {});
  }, [token, currentUser, id]);

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
    next.bankAccountNo = toBankAccountInput(u.bankAccountNo ?? "");
    next.bankIfsc = toIfscInput(u.bankIfsc ?? "");
    next.dob = toDateInput(u.dob);
    next.dateOfJoining = toDateInput(u.dateOfJoining);
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
    add("mobile", validateMobile(form.mobile));
    add("emergencyContactPhone", validateMobile(form.emergencyContactPhone));
    add("aadharNumber", validateAadhaar(form.aadharNumber));
    add("panCard", validatePan(form.panCard));
    add("bankAccountNo", validateBankAccount(form.bankAccountNo));
    add("bankIfsc", validateIfsc(form.bankIfsc));
    add("dob", validateDateNotFuture(form.dob, { label: "Date of birth" }));
    add("dateOfJoining", validateDateNotFuture(form.dateOfJoining, { label: "Date of joining" }));
    setFieldErrors(nextErrors);
    const firstMessage = firstError(Object.values(nextErrors));
    if (firstMessage) {
      toast.error?.(firstMessage);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
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

  const infoRow = (label, value) => (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-on-surface break-all">{value || "—"}</span>
    </div>
  );

  const input = (label, field, type = "text", required = false, inputProps = {}) => {
    const { transform, hint, ...rest } = inputProps;
    const fieldError = fieldErrors[field];
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}{required && <span className="text-error ml-0.5">*</span>}</label>
        <input
          type={type}
          value={form[field] ?? ""}
          onChange={(e) => setField(field, transform ? transform(e.target.value) : e.target.value)}
          aria-invalid={Boolean(fieldError)}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-on-surface text-sm ${fieldError ? "border-error" : "border-outline-variant"}`}
          {...rest}
        />
        {hint && !fieldError && <span className="text-[11px] text-on-surface-variant">{hint}</span>}
        {fieldError && <span className="text-[11px] font-medium text-error">{fieldError}</span>}
      </div>
    );
  };

  const select = (label, field, options) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <select
        value={form[field] ?? ""}
        onChange={(e) => setField(field, e.target.value)}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-5xl mx-auto w-full">
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

      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-8 shadow-ambient border border-surface-container-low mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center">
              {employee.avatar ? (
                <img alt="avatar" className="w-full h-full object-cover cursor-pointer" src={employee.avatar} onClick={() => setLightboxPhoto(employee.avatar)} />
              ) : (
                <span className="text-3xl font-bold font-headline text-on-surface-variant">{initials}</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h2 className="page-title text-on-surface capitalize mb-1">
                {employee.name || employee.username}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 text-sm text-on-surface-variant">
                <span className="text-primary font-semibold">
                  {employee.role?.name?.replaceAll("_", " ") || "User"}
                </span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <span>{employee.department || "Unassigned"}</span>
              </div>
            </div>
          </div>
          {!isEditing && canWrite && (
            <button
              onClick={() => {
                setForm(buildForm(employee));
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

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="bg-surface-container-lowest rounded-xl p-5 sm:p-8 shadow-ambient border border-surface-container-low space-y-8 font-sans"
        >
          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Profile Photo</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-surface shadow bg-surface-container-high flex items-center justify-center">
                {employee.avatar ? (
                  <img alt="avatar" className="w-full h-full object-cover" src={employee.avatar} />
                ) : (
                  <span className="text-2xl font-bold font-headline text-on-surface-variant">{initials}</span>
                )}
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
              {input("Mobile / Phone", "mobile", "tel", false, { transform: toMobileInput, inputMode: "numeric", maxLength: 10, pattern: "[0-9]{10}", hint: "10 digits, numbers only (no +91)." })}
              {input("Employee ID", "employeeId")}
              {select("Department", "department", DEPARTMENTS)}
              {input("Date of Joining", "dateOfJoining", "date", false, { max: new Date().toISOString().slice(0, 10) })}
              {currentUser?.roleName === "ADMIN" && (
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Reports To</label>
                  <select
                    value={form.managerId ?? ""}
                    onChange={(e) => setField("managerId", e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
                  >
                    <option value="">No manager / top level</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role?.name?.replaceAll("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {select("Gender", "gender", ["Male", "Female", "Other"])}
              {input("Date of Birth", "dob", "date", false, { max: new Date().toISOString().slice(0, 10) })}
              {select("Marital Status", "maritalStatus", ["Single", "Married", "Divorced", "Widowed"])}
              {select("Blood Group", "bloodGroup", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Address</label>
                <textarea
                  rows={2}
                  value={form.address ?? ""}
                  onChange={(e) => setField("address", e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Contact Name", "emergencyContactName", "text", false, { transform: toPersonNameInput })}
              {input("Contact Phone", "emergencyContactPhone", "tel", false, { transform: toMobileInput, inputMode: "numeric", maxLength: 10, pattern: "[0-9]{10}", hint: "10 digits, numbers only (no +91)." })}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Government IDs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Aadhaar Number", "aadharNumber", "text", false, { transform: toAadhaarInput, inputMode: "numeric", maxLength: 12, pattern: "[0-9]{12}", hint: "12 digits, numbers only." })}
              {input("PAN Card", "panCard", "text", false, { transform: toPanInput, maxLength: 10, pattern: "[A-Z]{5}[0-9]{4}[A-Z]", hint: "Format: ABCDE1234F." })}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Bank Name", "bankName")}
              {input("Account Number", "bankAccountNo", "text", false, { transform: toBankAccountInput, inputMode: "numeric", maxLength: 18, pattern: "[0-9]{9,18}", hint: "9 to 18 digits, numbers only." })}
              {input("IFSC Code", "bankIfsc", "text", false, { transform: toIfscInput, maxLength: 11, pattern: "[A-Z]{4}0[A-Z0-9]{6}", hint: "Format: SBIN0007421." })}
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
        <div className="space-y-6 font-sans">
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Employment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {infoRow("Username", employee.username)}
              {infoRow("Employee ID", employee.employeeId)}
              {infoRow("Department", employee.department || "Unassigned")}
              {infoRow("Date of Joining", formatDate(employee.dateOfJoining))}
              {infoRow("Status", employee.status)}
              {infoRow("Role", employee.role?.name?.replaceAll("_", " "))}
              {infoRow("Reports To", employee.manager?.name || "—")}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Personal</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {infoRow("Email", employee.email)}
              {infoRow("Mobile", employee.mobile)}
              {infoRow("Gender", employee.gender)}
              {infoRow("Date of Birth", formatDate(employee.dob))}
              {infoRow("Marital Status", employee.maritalStatus)}
              {infoRow("Blood Group", employee.bloodGroup)}
              <div className="col-span-2">
                {infoRow("Address", employee.address)}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {infoRow("Contact Name", employee.emergencyContactName)}
              {infoRow("Contact Phone", employee.emergencyContactPhone)}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Government IDs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {infoRow("Aadhaar Number", employee.aadharNumber)}
              {infoRow("PAN Card", employee.panCard)}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Bank Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {infoRow("Bank Name", employee.bankName)}
              {infoRow("Account Number", employee.bankAccountNo)}
              {infoRow("IFSC Code", employee.bankIfsc)}
            </div>
          </section>
        </div>
      )}

      <PhotoLightbox src={lightboxPhoto} alt="Employee photo" onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}
