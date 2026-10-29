"use client";

import { formatDate } from "@/lib/date";
import { formatRoleLabel } from "@/lib/roles";

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-on-surface break-all">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10">
      <h3 className="font-headline font-bold text-lg text-on-surface mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

function ReportingSection({ manager, directReports }) {
  const reports = Array.isArray(directReports) ? directReports : [];

  return (
    <section className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient border border-outline-variant/10">
      <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Reporting Lines</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="min-w-0 rounded-lg border border-outline-variant/20 bg-surface-container-low/40 p-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Reports To</p>
          {manager ? (
            <div className="mt-2 min-w-0">
              <p className="text-sm font-semibold text-on-surface break-words">{manager.name}</p>
              <p className="text-xs text-on-surface-variant mt-1 break-words">
                {formatRoleLabel(manager.role?.name)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant italic mt-2">No manager / top level</p>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-outline-variant/20 bg-surface-container-low/40 p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Direct Reports</p>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
              {reports.length}
            </span>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic mt-2">No direct reports</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-start justify-between gap-2 min-w-0 rounded-lg bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface break-words">{report.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 break-words">
                      {formatRoleLabel(report.role?.name)}
                    </p>
                  </div>
                  {report.status && (
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                        report.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default function BasicDetailsView({ person }) {
  if (!person) return null;

  const hasEmployment =
    person.employeeId || person.department || person.dateOfJoining || person.username;
  const hasExit = person.dateOfLeaving || person.resignationReason || person.inactiveSince;

  return (
    <div className="space-y-6 font-sans">
      {hasEmployment && (
        <Section title="Employment">
          <Row label="Username" value={person.username} />
          <Row label="Employee ID" value={person.employeeId} />
          <Row label="Department" value={person.department} />
          <Row label="Role" value={formatRoleLabel(person.role?.name)} />
          <Row label="Date of Joining" value={formatDate(person.dateOfJoining)} />
          <Row label="Status" value={person.status} />
          {person.status === "INACTIVE" && (
            <Row label="Inactive Since" value={formatDate(person.inactiveSince || person.dateOfLeaving)} />
          )}
        </Section>
      )}

      {(person.manager !== undefined || person.directReports !== undefined) && (
        <ReportingSection manager={person.manager} directReports={person.directReports} />
      )}

      {hasExit && (
        <Section title="Exit Details">
          <Row label="Date of Leaving" value={formatDate(person.dateOfLeaving)} />
          <div className="sm:col-span-2 min-w-0">
            <Row label="Reason for Leaving" value={person.resignationReason} />
          </div>
        </Section>
      )}

      <Section title="Personal">
        <Row label="Email" value={person.email} />
        <Row label="Phone" value={person.mobile || person.phone} />
        <Row
          label="Highest Qualification"
          value={
            person.highestQualification === "Other" && person.highestQualificationDetail
              ? `Other — ${person.highestQualificationDetail}`
              : person.highestQualification
          }
        />
        <Row label="Gender" value={person.gender} />
        <Row label="Date of Birth" value={formatDate(person.dob)} />
        <Row label="Marital Status" value={person.maritalStatus} />
        <Row label="Blood Group" value={person.bloodGroup} />
        <div className="sm:col-span-2 min-w-0">
          <Row label="Address" value={person.address} />
        </div>
      </Section>

      <Section title="Emergency Contact">
        <Row label="Contact Name" value={person.emergencyContactName} />
        <Row label="Contact Phone" value={person.emergencyContactPhone} />
      </Section>

      <Section title="Government IDs">
        <Row label="Aadhaar Number" value={person.aadharNumber} />
        <Row label="PAN Card" value={person.panCard} />
        <Row label="Voter ID" value={person.voterId} />
      </Section>

      <Section title="Bank Details">
        <Row label="Bank Name" value={person.bankName} />
        <Row label="Account Number" value={person.bankAccountNo} />
        <Row label="IFSC Code" value={person.bankIfsc} />
      </Section>
    </div>
  );
}
