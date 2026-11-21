"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import LeaveBalanceOverview from "./LeaveBalanceOverview";

/**
 * Loads the leave summary for a specific user and renders the shared balance
 * overview. Used on employee and fellow profile pages so admin/HR can see an
 * individual's balances without leaving the profile.
 */
export default function LeaveSummaryPanel({ userId, className = "" }) {
  const { token, can } = useAuth();
  const canReadLeaves = can("leaves", "READ");
  const [result, setResult] = useState({ userId: null, summary: null, error: "" });

  useEffect(() => {
    if (!token || !userId || !canReadLeaves) return;

    let cancelled = false;
    fetch(`/api/leaves/summary?userId=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unable to load leave balances");
        return json;
      })
      .then((json) => {
        if (!cancelled) {
          setResult({ userId, summary: json.data || null, error: "" });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            userId,
            summary: null,
            error: err.message || "Unable to load leave balances",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, userId, canReadLeaves]);

  if (!canReadLeaves) {
    return (
      <div className={`rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-sm text-on-surface-variant ${className}`}>
        You do not have permission to view leave balances.
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={`rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-sm text-on-surface-variant ${className}`}>
        No linked user account is available for leave balances.
      </div>
    );
  }

  if (result.userId !== userId) {
    return (
      <div className={`flex justify-center items-center py-16 ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (result.error) {
    return (
      <div className={`rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-sm text-on-surface-variant ${className}`}>
        {result.error}
      </div>
    );
  }

  if (!result.summary) {
    return (
      <div className={`rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-sm text-on-surface-variant ${className}`}>
        No leave balance information is available for this user.
      </div>
    );
  }

  return <LeaveBalanceOverview summary={result.summary} className={className} />;
}
