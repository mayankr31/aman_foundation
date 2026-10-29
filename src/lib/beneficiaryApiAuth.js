import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { canEditBeneficiary, canViewBeneficiary } from "@/lib/beneficiaryAccess";

/**
 * Guards beneficiary sub-resource routes.
 * READ  = livelihood readers + fellows linked through one of their students.
 * WRITE = livelihood WRITE only.
 */
export async function requireBeneficiaryAccess(req, beneficiaryId, action = "READ") {
  const { user, error } = await authenticateUser(req);
  if (error) return { error };

  const allowed =
    action === "WRITE"
      ? await canEditBeneficiary(user)
      : await canViewBeneficiary(user, beneficiaryId);

  if (!allowed) {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden: You do not have access to this beneficiary" },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
