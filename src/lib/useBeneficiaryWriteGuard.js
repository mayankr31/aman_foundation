"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

/**
 * Blocks survey/plan entry pages for users without Livelihood WRITE access,
 * and for program staff who are not assigned to the participant's program.
 * Sends them back to the read-only participant profile tab.
 */
export function useBeneficiaryWriteGuard(beneficiaryId, tabSlug) {
  const router = useRouter();
  const { user, token, isInitializing, can } = useAuth();
  const permissionsReady = Boolean(user?.permissions);
  const canEdit = permissionsReady && can("participants", "WRITE");
  const [scopeAllowed, setScopeAllowed] = useState(true);

  useEffect(() => {
    if (!beneficiaryId || !canEdit || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelled && json?.success && json?.data?.editable === false) {
          setScopeAllowed(false);
        }
      } catch {
        // Let the form render; the write API still enforces access.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [beneficiaryId, canEdit, token]);

  useEffect(() => {
    if (!isInitializing && permissionsReady && (!canEdit || !scopeAllowed) && beneficiaryId) {
      router.replace(`/participants/${beneficiaryId}?tab=${tabSlug}`);
    }
  }, [isInitializing, permissionsReady, canEdit, scopeAllowed, beneficiaryId, tabSlug, router]);

  return { canEdit: canEdit && scopeAllowed, permissionsReady };
}
