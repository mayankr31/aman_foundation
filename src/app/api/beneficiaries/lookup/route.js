import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Minimal beneficiary lookup used from the student detail page when linking a
 * student. Guarded by Education permission so Fellows can link students
 * without needing the Livelihood section.
 */
export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { enrolmentId: { contains: q, mode: "insensitive" } },
            { village: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      select: {
        id: true,
        name: true,
        enrolmentId: true,
        village: true,
        district: true,
      },
      orderBy: { name: "asc" },
      take: q ? 100 : 1000,
    });

    return NextResponse.json({ success: true, data: beneficiaries });
  } catch (error) {
    console.error("Beneficiary lookup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
