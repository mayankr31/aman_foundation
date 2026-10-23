"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { REIMBURSEMENT_CATEGORIES, formatINR } from "@/lib/reimbursementCategories";

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function makeItem(overrides = {}) {
  return {
    key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    expenseDate: todayInput(),
    category: "Travel",
    description: "",
    amount: "",
    existingReceiptFiles: [],
    files: [],
    ...overrides,
  };
}

function itemsFromInitial(initialData) {
  if (!initialData?.items?.length) return [makeItem()];
  return initialData.items.map((item) => ({
    key: item.id,
    expenseDate: toDateInput(item.expenseDate),
    category: item.category || "",
    description: item.description || "",
    amount: item.amount ?? "",
    existingReceiptFiles: Array.isArray(item.receiptFiles) ? item.receiptFiles.filter(Boolean) : [],
    files: [],
  }));
}

export default function ReimbursementForm({ token, user, initialData = null }) {
  const toast = useToast();
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || "");
  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [bankName, setBankName] = useState(initialData?.bankName || user?.bankName || "");
  const [bankAccountNo, setBankAccountNo] = useState(initialData?.bankAccountNo || user?.bankAccountNo || "");
  const [bankIfsc, setBankIfsc] = useState(initialData?.bankIfsc || user?.bankIfsc || "");
  const [items, setItems] = useState(() => itemsFromInitial(initialData));
  const [submitting, setSubmitting] = useState(false);

  const totalClaimed = useMemo(
    () => items.reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0),
    [items]
  );

  const updateItem = (index, patch) => {
    setItems((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  };

  const addItem = () => setItems((previous) => [...previous, makeItem()]);
  const removeItem = (index) => {
    setItems((previous) => (previous.length === 1 ? previous : previous.filter((_, itemIndex) => itemIndex !== index)));
  };

  const addFiles = (index, fileList) => {
    const selected = Array.from(fileList || []);
    if (!selected.length) return;
    setItems((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? { ...item, files: [...item.files, ...selected] } : item
    )));
  };

  const removeNewFile = (index, fileIndex) => {
    setItems((previous) => previous.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, files: item.files.filter((_, currentFileIndex) => currentFileIndex !== fileIndex) }
        : item
    )));
  };

  const removeExistingFile = (index, fileIndex) => {
    setItems((previous) => previous.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, existingReceiptFiles: item.existingReceiptFiles.filter((_, currentFileIndex) => currentFileIndex !== fileIndex) }
        : item
    )));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Enter a title for this claim.");
      return;
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.expenseDate) {
        toast.error(`Select a date for expense line ${index + 1}.`);
        return;
      }
      if (!item.category) {
        toast.error(`Select a category for expense line ${index + 1}.`);
        return;
      }
      if (!item.description.trim()) {
        toast.error(`Add a description for expense line ${index + 1}.`);
        return;
      }
      const amount = Number.parseFloat(item.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error(`Enter a valid amount for expense line ${index + 1}.`);
        return;
      }
      if (!item.existingReceiptFiles.length && !item.files.length) {
        toast.error(`Attach at least one receipt for expense line ${index + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("purpose", purpose);
      formData.append("notes", notes);
      formData.append("bankName", bankName);
      formData.append("bankAccountNo", bankAccountNo);
      formData.append("bankIfsc", bankIfsc);
      formData.append("items", JSON.stringify(items.map((item) => ({
        expenseDate: item.expenseDate,
        category: item.category,
        description: item.description.trim(),
        amount: Number.parseFloat(item.amount),
        existingReceiptFiles: item.existingReceiptFiles,
      }))));

      items.forEach((item, itemIndex) => {
        item.files.forEach((file, fileIndex) => {
          formData.append(`receipt_${itemIndex}_${fileIndex}`, file);
        });
      });

      const res = await fetch(isEdit ? `/api/reimbursements/${initialData.id}` : "/api/reimbursements", {
        method: isEdit ? "PUT" : "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save reimbursement claim.");
      }

      toast.success(isEdit ? "Reimbursement claim updated." : "Reimbursement claim submitted.");
      router.push("/reimbursements");
    } catch (error) {
      console.error("Save reimbursement error:", error);
      toast.error(error.message || "Failed to save reimbursement claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      <section className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-4">
        <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">description</span>
          Claim Details
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claim Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Field visit expenses - October"
            className="px-4 py-2.5 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Purpose / Justification</label>
          <textarea
            rows={2}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="What was this expense for?"
            className="px-4 py-2.5 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Additional Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything the approver should know..."
            className="px-4 py-2.5 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary resize-none"
          />
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Expense Lines
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Add each expense separately and attach its receipt.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-sm font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Expense Line
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.key} className="rounded-xl border border-surface-container-highest bg-surface-container-low/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Expense Line {index + 1}
                </p>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-error hover:bg-error-container/20 rounded-full p-1 transition-colors cursor-pointer"
                    title="Remove expense line"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Date *</label>
                  <input
                    type="date"
                    required
                    value={item.expenseDate}
                    onChange={(event) => updateItem(index, { expenseDate: event.target.value })}
                    className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Category *</label>
                  <select
                    required
                    value={item.category}
                    onChange={(event) => updateItem(index, { category: event.target.value })}
                    className="px-3 py-2 border rounded-lg bg-transparent dark:bg-slate-900 border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select category</option>
                    {REIMBURSEMENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Amount (₹) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={item.amount}
                    onChange={(event) => updateItem(index, { amount: event.target.value })}
                    placeholder="0"
                    className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Description *</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(event) => updateItem(index, { description: event.target.value })}
                    placeholder="e.g. Auto fare from centre to school"
                    className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Receipts *</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  onChange={(event) => {
                    addFiles(index, event.target.files);
                    event.target.value = "";
                  }}
                  className="px-3 py-2 border rounded-lg border-outline-variant bg-transparent text-on-surface text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                />

                {(item.existingReceiptFiles.length > 0 || item.files.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {item.existingReceiptFiles.map((file, fileIndex) => (
                      <span key={`existing-${fileIndex}`} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-container/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                        <span className="material-symbols-outlined text-[12px]">receipt</span>
                        Existing receipt {fileIndex + 1}
                        <button
                          type="button"
                          onClick={() => removeExistingFile(index, fileIndex)}
                          className="ml-1 text-error cursor-pointer"
                          title="Remove receipt"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </span>
                    ))}
                    {item.files.map((file, fileIndex) => (
                      <span key={`new-${file.name}-${fileIndex}`} className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[10px] font-semibold text-on-surface max-w-full">
                        <span className="material-symbols-outlined text-[12px] shrink-0">attach_file</span>
                        <span className="truncate max-w-[160px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeNewFile(index, fileIndex)}
                          className="ml-1 text-error cursor-pointer"
                          title="Remove file"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-4">
        <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">account_balance</span>
          Bank Details
        </h2>
        <p className="text-xs text-on-surface-variant">
          Used by the approver when reimbursing you. Pre-filled from your profile.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Account Number</label>
            <input
              type="text"
              value={bankAccountNo}
              onChange={(event) => setBankAccountNo(event.target.value)}
              className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">IFSC</label>
            <input
              type="text"
              value={bankIfsc}
              onChange={(event) => setBankIfsc(event.target.value)}
              className="px-3 py-2 border rounded-lg bg-transparent border-outline-variant text-on-surface text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Claim</p>
          <p className="text-2xl font-bold text-on-surface">{formatINR(totalClaimed)}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/reimbursements"
            className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-bold uppercase tracking-wider text-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="gradient-primary bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-glow"
          >
            {submitting ? "Saving..." : isEdit ? "Update Claim" : "Submit Claim"}
          </button>
        </div>
      </div>
    </form>
  );
}
