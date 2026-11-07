"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { QUALIFICATIONS, getDepartmentOptions } from "@/lib/organization";
import { INDIA_STATES, getDistrictsForState, withCurrentOption } from "@/lib/indiaLocations";
import { composeProfileAddress } from "@/lib/profileCompleteness";
import { formatRoleLabel } from "@/lib/roles";
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
  validateDateOrder,
  isBlank,
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
    state: person.state || "",
    district: person.district || "",
    block: person.block || "",
    village: person.village || "",
    landmark: person.landmark || "",
    department: person.department || "",
    managerId: person.managerId || "",
    dateOfJoining: toDateInput(person.dateOfJoining),
    dateOfLeaving: toDateInput(person.dateOfLeaving),
    resignationReason: person.resignationReason || "",
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
  showEmployment = false,
  canEditDepartment = false,
  canEditReporting = false,
  canEditExit = false,
  managerOptions = [],
  readOnlyManagerName = "",
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

  const stateOptions = withCurrentOption(
    INDIA_STATES.map((state) => state.name),
    form.state
  );
  const districtOptions = withCurrentOption(
    getDistrictsForState(form.state),
    form.district
  );
  const departmentChoices = (() => {
    const { suggested, others } = getDepartmentOptions(person?.role?.name, form.department);
    return [...suggested, ...others];
  })();
  const managerChoices = [...managerOptions];
  if (
    form.managerId &&
    !managerChoices.some((manager) => manager.id === form.managerId)
  ) {
    managerChoices.unshift({
      id: form.managerId,
      name: person?.manager?.name
        ? `${person.manager.name} (current)`
        : "Current manager",
      role: person?.manager?.role || null,
    });
  }

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
      validateRequired(form.state, "State"),
      validateRequired(form.district, "District"),
      validateRequired(form.block, "Block"),
      validateRequired(form.village, "City / Village"),
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
      showEmployment && canEditDepartment
        ? validateRequired(form.department, "Department")
        : null,
      showEmployment
        ? validateDateNotFuture(form.dateOfJoining, {
            required: true,
            label: "Date of joining",
          })
        : null,
      showEmployment && canEditExit
        ? validateDateNotFuture(form.dateOfLeaving, { label: "Date of leaving" })
        : null,
      showEmployment && canEditExit && !isBlank(form.dateOfLeaving)
        ? validateRequired(form.resignationReason, "Reason for leaving")
        : null,
      showEmployment && canEditExit && isBlank(form.dateOfLeaving) && !isBlank(form.resignationReason)
        ? "Date of leaving is required when a reason is provided."
        : null,
      showEmployment && canEditExit
        ? validateDateOrder(form.dateOfJoining, form.dateOfLeaving, {
            startLabel: "Date of joining",
            endLabel: "Date of leaving",
          })
        : null,
    ]);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        address: composeProfileAddress(form),
      });
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

      {showEmployment && (
        <section>
          <h3 className="font-headline font-bold text-base text-on-surface mb-4">Employment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Employee ID</span>
              <div className="px-4 py-2 border rounded-lg border-outline-variant bg-surface-container text-on-surface text-sm">
                {person?.employeeId || "—"}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Role</span>
              <div className="px-4 py-2 border rounded-lg border-outline-variant bg-surface-container text-on-surface text-sm">
                {formatRoleLabel(person?.role)}
              </div>
            </div>
            {canEditDepartment ? (
              select("Department", "department", departmentChoices, true)
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Department</span>
                <div className="px-4 py-2 border rounded-lg border-outline-variant bg-surface-container text-on-surface text-sm">
                  {form.department || "—"}
                </div>
              </div>
            )}

            {canEditReporting ? (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Reports To
                </label>
                <select
                  value={form.managerId ?? ""}
                  onChange={(event) => setField("managerId", event.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
                >
                  <option value="">No manager / top level</option>
                  {managerChoices.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                      {manager.role?.name ? ` (${manager.role.name.replaceAll("_", " ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Reports To</span>
                <div className="px-4 py-2 border rounded-lg border-outline-variant bg-surface-container text-on-surface text-sm">
                  {readOnlyManagerName || "No manager / top level"}
                </div>
              </div>
            )}

            {input("Date of Joining", "dateOfJoining", {
              type: "date",
              required: true,
              max: new Date().toISOString().slice(0, 10),
            })}

            {canEditExit && (
              <>
                {input("Date of Leaving", "dateOfLeaving", {
                  type: "date",
                  max: new Date().toISOString().slice(0, 10),
                })}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Reason for Leaving
                  </label>
                  <textarea
                    rows={3}
                    value={form.resignationReason}
                    onChange={(event) => setField("resignationReason", event.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </section>
      )}

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
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              State<span className="text-error ml-0.5">*</span>
            </label>
            <select
              value={form.state}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({ ...prev, state: value, district: "" }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm"
            >
              <option value="">Select state</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              District<span className="text-error ml-0.5">*</span>
            </label>
            <select
              value={form.district}
              onChange={(event) => setField("district", event.target.value)}
              disabled={!form.state}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface text-sm disabled:opacity-60"
            >
              <option value="">{form.state ? "Select district" : "Select state first"}</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          {input("Block", "block", { required: true, maxLength: 80 })}
          {input("City / Village", "village", { required: true, maxLength: 80 })}
          <div className="md:col-span-2">
            {input("Nearby Landmark (optional)", "landmark", { maxLength: 120 })}
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
