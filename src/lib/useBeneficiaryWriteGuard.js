"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

/**
 * Blocks survey/plan entry pages for users without Livelihood WRITE access and
 * sends them back to the read-only beneficiary profile tab.
 */
export function useBeneficiaryWriteGuard(beneficiaryId, tabSlug) {
  const router = useRouter();
  const { user, isInitializing, can } = useAuth();
  const permissionsReady = Boolean(user?.permissions);
  const canEdit = permissionsReady && can("livelihood", "WRITE");

  useEffect(() => {
    if (!isInitializing && permissionsReady && !canEdit && beneficiaryId) {
      router.replace(`/beneficiaries/${beneficiaryId}?tab=${tabSlug}`);
    }
  }, [isInitializing, permissionsReady, canEdit, beneficiaryId, tabSlug, router]);

  return { canEdit, permissionsReady };
}
