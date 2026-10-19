"use client";

import { formatDate } from "@/lib/date";
import { formatINR, formatRoleLabel } from "@/lib/reimbursementCategories";
import ReimbursementStatusBadge from "./ReimbursementStatusBadge";

function receiptFilesFor(item) {
  return Array.isArray(item.receiptFiles) ? item.receiptFiles.filter(Boolean) : [];
}

export default function ReimbursementSummary({ reimbursement }) {
  if (!reimbursement) return null;

  const items = reimbursement.items || [];
  const totalClaimed = Number(
    reimbursement.totalClaimed ?? items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  );
  const totalApproved = reimbursement.totalApproved !== null && reimbursement.totalApproved !== undefined
    ? Number(reimbursement.totalApproved)
    : null;
  const totalReimbursed = reimbursement.totalReimbursed !== null && reimbursement.totalReimbursed !== undefined
    ? Number(reimbursement.totalReimbursed)
    : null;

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-on-surface">{reimbursement.title}</h3>
            <ReimbursementStatusBadge status={reimbursement.status} />
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            {reimbursement.user?.name || "Staff member"}
            {reimbursement.user?.department ? ` · ${reimbursement.user.department}` : ""}
            {reimbursement.user?.role?.name ? ` · ${formatRoleLabel(reimbursement.user.role.name)}` : ""}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Claimed</p>
          <p className="text-2xl font-bold text-on-surface">{formatINR(totalClaimed)}</p>
        </div>
      </div>

      {reimbursement.purpose && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Purpose</p>
          <p className="text-sm text-on-surface">{reimbursement.purpose}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Submitted</p>
          <p className="text-xs font-semibold text-on-surface mt-1">{formatDate(reimbursement.createdAt)}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{reimbursement.user?.name || "—"}</p>
        </div>

        <div className="rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Approval</p>
          {reimbursement.approvedAt ? (
            <>
              <p className="text-xs font-semibold text-on-surface mt-1">
                {totalApproved !== null ? formatINR(totalApproved) : "Approved"}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {reimbursement.approver?.name || "—"} · {formatDate(reimbursement.approvedAt)}
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-on-surface-variant mt-1">Pending review</p>
          )}
        </div>

        <div className="rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Reimbursed</p>
          {reimbursement.reimbursedAt ? (
            <>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                {totalReimbursed !== null ? formatINR(totalReimbursed) : "Paid"}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {reimbursement.reimburser?.name || "—"} · {formatDate(reimbursement.reimbursedAt)}
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-on-surface-variant mt-1">Not reimbursed yet</p>
          )}
        </div>
      </div>

      {reimbursement.status === "REJECTED" && reimbursement.rejectionReason && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejection Reason</p>
          <p className="text-sm text-rose-800 mt-1">{reimbursement.rejectionReason}</p>
        </div>
      )}

      {reimbursement.status === "REIMBURSED" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Mode</p>
            <p className="text-sm text-emerald-900 mt-1">{reimbursement.paymentMode || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Reference</p>
            <p className="text-sm text-emerald-900 mt-1">{reimbursement.paymentReference || "—"}</p>
          </div>
          {reimbursement.paymentNotes && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Notes</p>
              <p className="text-sm text-emerald-900 mt-1">{reimbursement.paymentNotes}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expense Lines</p>
          <p className="text-[11px] text-on-surface-variant">{items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-surface-container-highest">
          <table className="mobile-card-table min-w-full text-xs">
            <thead className="bg-surface-container-low/40">
              <tr className="text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Claimed</th>
                <th className="py-2.5 px-3 text-right">Approved</th>
                <th className="py-2.5 px-3">Receipts</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const receipts = receiptFilesFor(item);
                return (
                  <tr key={item.id} className="border-t border-surface-container-highest align-top">
                    <td data-label="Date" className="py-2.5 px-3 font-medium text-on-surface whitespace-nowrap">{formatDate(item.expenseDate)}</td>
                    <td data-label="Category" className="py-2.5 px-3 text-on-surface-variant">{item.category}</td>
                    <td data-label="Description" className="py-2.5 px-3 text-on-surface min-w-[180px]">{item.description}</td>
                    <td data-label="Claimed" className="py-2.5 px-3 text-right font-semibold text-on-surface whitespace-nowrap">{formatINR(item.amount)}</td>
                    <td data-label="Approved" className="py-2.5 px-3 text-right font-semibold text-on-surface whitespace-nowrap">
                      {item.approvedAmount !== null && item.approvedAmount !== undefined ? formatINR(item.approvedAmount) : "—"}
                    </td>
                    <td data-label="Receipts" className="py-2.5 px-3">
                      {receipts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {receipts.map((file, index) => (
                            <a
                              key={`${file}-${index}`}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-container/10 px-2 py-1 text-[10px] font-semibold text-primary hover:underline"
                            >
                              <span className="material-symbols-outlined text-[12px]">receipt</span>
                              {index + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="hidden md:table-footer-group bg-surface-container-low/40">
              <tr className="border-t border-surface-container-highest font-bold text-on-surface">
                <td colSpan={3} className="py-2.5 px-3 text-right">Total</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">{formatINR(totalClaimed)}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  {totalApproved !== null ? formatINR(totalApproved) : "—"}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="md:hidden mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Claimed</p>
            <p className="text-sm font-bold text-on-surface mt-1">{formatINR(totalClaimed)}</p>
          </div>
          <div className="rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Approved</p>
            <p className="text-sm font-bold text-on-surface mt-1">{totalApproved !== null ? formatINR(totalApproved) : "—"}</p>
          </div>
        </div>
      </div>

      {(reimbursement.bankName || reimbursement.bankAccountNo || reimbursement.bankIfsc || reimbursement.notes) && (
        <div className="rounded-lg border border-surface-container-highest bg-surface-container-low/20 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {reimbursement.bankName && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bank</p>
              <p className="text-xs font-semibold text-on-surface mt-1">{reimbursement.bankName}</p>
            </div>
          )}
          {reimbursement.bankAccountNo && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Account Number</p>
              <p className="text-xs font-semibold text-on-surface mt-1 font-mono">{reimbursement.bankAccountNo}</p>
            </div>
          )}
          {reimbursement.bankIfsc && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">IFSC</p>
              <p className="text-xs font-semibold text-on-surface mt-1 font-mono">{reimbursement.bankIfsc}</p>
            </div>
          )}
          {reimbursement.notes && (
            <div className="sm:col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
              <p className="text-xs text-on-surface mt-1">{reimbursement.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
