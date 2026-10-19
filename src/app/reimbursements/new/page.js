"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import ReimbursementForm from "@/components/reimbursements/ReimbursementForm";

function NewReimbursementContent() {
  const { token, user, isInitializing, can } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const editId = searchParams.get("id");

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(Boolean(editId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.replace("/");
      return;
    }
    if (user.roleName === "ADMIN") {
      router.replace("/reimbursements/manage");
      return;
    }
    if (!can("reimbursements")) {
      router.replace("/");
      return;
    }
    if (!can("reimbursements", "WRITE")) {
      router.replace("/reimbursements");
      return;
    }

    if (!editId) {
      return;
    }

    const loadClaim = async () => {
      try {
        const res = await fetch(`/api/reimbursements/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load claim.");
        }
        if (json.data.userId !== user.id) {
          throw new Error("You can only edit your own claims.");
        }
        if (json.data.status !== "PENDING") {
          throw new Error("Only pending claims can be edited.");
        }
        setInitialData(json.data);
      } catch (loadError) {
        console.error("Load reimbursement error:", loadError);
        setError(loadError.message || "Failed to load claim.");
        toast.error(loadError.message || "Failed to load claim.");
      } finally {
        setLoading(false);
      }
    };

    loadClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, isInitializing, editId]);

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <span className="material-symbols-outlined text-5xl text-error mb-3 block">error</span>
        <p className="text-on-surface font-semibold">{error}</p>
        <Link href="/reimbursements" className="text-primary text-sm font-semibold hover:underline mt-3 inline-block">
          Back to reimbursements
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-5xl mx-auto w-full font-sans">
      <Link
        href="/reimbursements"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Reimbursements</span>
      </Link>

      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
          Staff Expenses
        </p>
        <h1 className="page-title text-on-surface">
          {editId ? "Edit Reimbursement Claim" : "New Reimbursement Claim"}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Add itemized expenses, attach receipts and submit the claim for approval.
        </p>
      </div>

      <ReimbursementForm
        key={editId || "new"}
        token={token}
        user={user}
        initialData={initialData}
      />
    </div>
  );
}

export default function NewReimbursementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <NewReimbursementContent />
    </Suspense>
  );
}
