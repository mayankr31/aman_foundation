"use client";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

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
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
      <h3 className="font-headline font-bold text-lg text-on-surface mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

export default function BasicDetailsView({ person }) {
  if (!person) return null;

  const hasEmployment =
    person.employeeId || person.department || person.dateOfJoining;

  return (
    <div className="space-y-6 font-sans">
      {hasEmployment && (
        <Section title="Employment">
          <Row label="Employee ID" value={person.employeeId} />
          <Row label="Department" value={person.department} />
          <Row label="Date of Joining" value={formatDate(person.dateOfJoining)} />
        </Section>
      )}

      <Section title="Personal">
        <Row label="Email" value={person.email} />
        <Row label="Phone" value={person.mobile || person.phone} />
        <Row label="Gender" value={person.gender} />
        <Row label="Date of Birth" value={formatDate(person.dob)} />
        <Row label="Marital Status" value={person.maritalStatus} />
        <Row label="Blood Group" value={person.bloodGroup} />
        <div className="col-span-2 md:col-span-2 min-w-0">
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
      </Section>

      <Section title="Bank Details">
        <Row label="Bank Name" value={person.bankName} />
        <Row label="Account Number" value={person.bankAccountNo} />
        <Row label="IFSC Code" value={person.bankIfsc} />
      </Section>
    </div>
  );
}
