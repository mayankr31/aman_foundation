"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

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
  const { token } = useAuth();
  const toast = useToast();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (token && id) {
      fetchEmployee();
    }
  }, [token, id]);

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
    next.dob = toDateInput(u.dob);
    next.dateOfJoining = toDateInput(u.dateOfJoining);
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

  const input = (label, field, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={form[field] ?? ""}
        onChange={(e) => setField(field, e.target.value)}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
      />
    </div>
  );

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
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Employees
        </span>
      </Link>

      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient border border-surface-container-low mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center">
              {employee.avatar ? (
                <img alt="avatar" className="w-full h-full object-cover" src={employee.avatar} />
              ) : (
                <span className="text-3xl font-bold font-headline text-on-surface-variant">{initials}</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize mb-1">
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
          {!isEditing && (
            <button
              onClick={() => {
                setForm(buildForm(employee));
                setIsEditing(true);
              }}
              className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
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
          className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient border border-surface-container-low space-y-8 font-sans"
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
              <label className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
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
              {input("Full Name", "name")}
              {input("Email", "email", "email")}
              {input("Mobile / Phone", "mobile")}
              {input("Employee ID", "employeeId")}
              {select("Department", "department", DEPARTMENTS)}
              {input("Date of Joining", "dateOfJoining", "date")}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {select("Gender", "gender", ["Male", "Female", "Other"])}
              {input("Date of Birth", "dob", "date")}
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
              {input("Contact Name", "emergencyContactName")}
              {input("Contact Phone", "emergencyContactPhone")}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Government IDs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Aadhaar Number", "aadharNumber")}
              {input("PAN Card", "panCard")}
            </div>
          </section>

          <section>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {input("Bank Name", "bankName")}
              {input("Account Number", "bankAccountNo")}
              {input("IFSC Code", "bankIfsc")}
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60"
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
              {infoRow("Date of Joining", employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : "—")}
              {infoRow("Status", employee.status)}
              {infoRow("Role", employee.role?.name?.replaceAll("_", " "))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Personal</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {infoRow("Email", employee.email)}
              {infoRow("Mobile", employee.mobile)}
              {infoRow("Gender", employee.gender)}
              {infoRow("Date of Birth", employee.dob ? new Date(employee.dob).toLocaleDateString() : "—")}
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
    </div>
  );
}
