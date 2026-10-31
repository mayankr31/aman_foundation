"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { QUALIFICATIONS } from "@/lib/organization";
import DateInput from "@/components/ui/DateInput";
import Avatar from "@/components/ui/Avatar";
import {
  validateMobile,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateBankAccount,
  validateIfsc,
  validateEmail,
  validatePersonName,
  validateRequired,
  validateDateNotFuture,
  firstError,
  toMobileInput,
  toAadhaarInput,
  toPanInput,
  toVoterIdInput,
  toBankAccountInput,
  toIfscInput,
  toPersonNameInput,
} from "@/lib/validation";

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildInitial(person = {}) {
  return {
    name: person.name || "",
    email: person.email || "",
    mobile: toMobileInput(person.mobile || person.phone || ""),
    address: person.address || "",
    gender: person.gender || "",
    dob: toDateInput(person.dob),
    avatar: person.avatar || "",
    maritalStatus: person.maritalStatus || "",
    bloodGroup: person.bloodGroup || "",
    emergencyContactName: person.emergencyContactName || "",
    emergencyContactPhone: toMobileInput(person.emergencyContactPhone || ""),
    aadharNumber: toAadhaarInput(person.aadharNumber || ""),
    panCard: toPanInput(person.panCard || ""),
    voterId: toVoterIdInput(person.voterId || ""),
    highestQualification: person.highestQualification || "",
    highestQualificationDetail: person.highestQualificationDetail || "",
    bankName: person.bankName || "",
    bankAccountNo: toBankAccountInput(person.bankAccountNo || ""),
    bankIfsc: toIfscInput(person.bankIfsc || ""),
  };
}

export default function PersonalDetailsForm({
  person,
  onSubmit,
  onCancel,
  avatarUploadUrl = null,
  onAvatarUpdated,
}) {
  const { token } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => buildInitial(person));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const initials = (form.name || "F")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !avatarUploadUrl || !token) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append("avatar", file);
      const res = await fetch(avatarUploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to upload photo");
        return;
      }
      const url = json.data?.avatar || "";
      setField("avatar", url);
      onAvatarUpdated?.(url);
      toast.success("Photo updated");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = firstError([
      validatePersonName(form.name, { required: true }),
      validateEmail(form.email, { required: true }),
      validateMobile(form.mobile, { required: true }),
      validateDateNotFuture(form.dob, { required: true, label: "Date of birth" }),
      validateRequired(form.address, "Address"),
      validateRequired(form.gender, "Gender"),
      validateRequired(form.maritalStatus, "Marital status"),
      validateRequired(form.bloodGroup, "Blood group"),
      validatePersonName(form.emergencyContactName, { required: true }),
      validateMobile(form.emergencyContactPhone, { required: true }),
      validateAadhaar(form.aadharNumber, { required: true }),
      validatePan(form.panCard, { required: true }),
      validateVoterId(form.voterId, { required: true }),
      validateRequired(form.highestQualification, "Highest qualification"),
      form.highestQualification === "Other"
        ? validateRequired(form.highestQualificationDetail, "Specify qualification")
        : null,
      validateRequired(form.bankName, "Bank name"),
      validateBankAccount(form.bankAccountNo, { required: true }),
      validateIfsc(form.bankIfsc, { required: true }),
    ]);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ ...form });
    } catch (err) {
      // The parent surfaces the API error through a toast.
      console.error("Personal details save failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const input = (label, field, options = {}) => {
    const {
      type = "text",
      required = false,
      transform,
      hint,
      ...rest
    } = options;

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
        {type === "date" ? (
          <DateInput
            name={field}
            value={form[field] ?? ""}
            onChange={(event) => setField(field, event.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
            required={required}
            {...rest}
          />
        ) : (
          <input
            type={type}
            value={form[field] ?? ""}
            onChange={(event) => setField(field, transform ? transform(event.target.value) : event.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
            {...rest}
          />
        )}
        {hint && <span className="text-[11px] text-on-surface-variant">{hint}</span>}
      </div>
    );
  };

  const select = (label, field, options, required = false) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      <select
        value={form[field] ?? ""}
        onChange={(event) => setField(field, event.target.value)}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-sm">
      <section>
        <h3 className="font-headline font-bold text-base text-on-surface mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-outline-variant bg-surface-container-high flex items-center justify-center">
            <Avatar
              src={form.avatar}
              name={form.name}
              fallback={initials}
              fallbackClassName="text-lg font-bold text-on-surface-variant"
            />
          </div>
          {avatarUploadUrl && (
            <label className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors cursor-pointer">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleAvatarChange}
              />
            </label>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-headline font-bold text-base text-on-surface mb-4">Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Full Name", "name", { required: true, maxLength: 60, transform: toPersonNameInput })}
          {input("Email", "email", { type: "email", required: true, autoComplete: "email" })}
          {input("Mobile / Phone", "mobile", {
            type: "tel",
            required: true,
            transform: toMobileInput,
            inputMode: "numeric",
            maxLength: 10,
            pattern: "[0-9]{10}",
            hint: "10 digits, numbers only (no +91).",
          })}
          {input("Date of Birth", "dob", {
            type: "date",
            required: true,
            max: new Date().toISOString().slice(0, 10),
          })}
          {select("Gender", "gender", ["Male", "Female", "Other"], true)}
          {select("Marital Status", "maritalStatus", ["Single", "Married", "Divorced", "Widowed"], true)}
          {select("Blood Group", "bloodGroup", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], true)}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Address<span className="text-error ml-0.5">*</span>
            </label>
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Highest Qualification<span className="text-error ml-0.5">*</span></label>
            <select
              value={form.highestQualification}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  highestQualification: value,
                  highestQualificationDetail: value === "Other" ? prev.highestQualificationDetail : "",
                }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
            >
              <option value="">—</option>
              {QUALIFICATIONS.map((qualification) => (
                <option key={qualification} value={qualification}>
                  {qualification}
                </option>
              ))}
            </select>
          </div>
          {form.highestQualification === "Other" &&
            input("Specify Qualification", "highestQualificationDetail", { required: true, maxLength: 100 })}
        </div>
      </section>

      <section>
        <h3 className="font-headline font-bold text-base text-on-surface mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Contact Name", "emergencyContactName", { required: true, maxLength: 60, transform: toPersonNameInput })}
          {input("Contact Phone", "emergencyContactPhone", {
            type: "tel",
            required: true,
            transform: toMobileInput,
            inputMode: "numeric",
            maxLength: 10,
            pattern: "[0-9]{10}",
            hint: "10 digits, numbers only (no +91).",
          })}
        </div>
      </section>

      <section>
        <h3 className="font-headline font-bold text-base text-on-surface mb-4">Government IDs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Aadhaar Number", "aadharNumber", {
            required: true,
            transform: toAadhaarInput,
            inputMode: "numeric",
            maxLength: 12,
            pattern: "[0-9]{12}",
            hint: "12 digits, numbers only.",
          })}
          {input("PAN Card", "panCard", {
            required: true,
            transform: toPanInput,
            maxLength: 10,
            pattern: "[A-Z]{5}[0-9]{4}[A-Z]",
            hint: "Format: ABCDE1234F.",
          })}
          {input("Voter ID", "voterId", {
            required: true,
            transform: toVoterIdInput,
            maxLength: 10,
            pattern: "[A-Z]{3}[0-9]{7}",
            hint: "Format: ABC1234567.",
          })}
        </div>
      </section>

      <section>
        <h3 className="font-headline font-bold text-base text-on-surface mb-4">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Bank Name", "bankName", { required: true })}
          {input("Account Number", "bankAccountNo", {
            required: true,
            transform: toBankAccountInput,
            inputMode: "numeric",
            maxLength: 18,
            pattern: "[0-9]{9,18}",
            hint: "9 to 18 digits, numbers only.",
          })}
          {input("IFSC Code", "bankIfsc", {
            required: true,
            transform: toIfscInput,
            maxLength: 11,
            pattern: "[A-Z]{4}0[A-Z0-9]{6}",
            hint: "Format: SBIN0007421.",
          })}
        </div>
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
