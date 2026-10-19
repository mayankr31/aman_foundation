import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { currentSession, getInstitutionStudentData } from "@/lib/fellowStudentData";
import { canAccessCentre, resolveCentreId } from "@/lib/institutionScope";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;
    const centreId = await resolveCentreId(id);
    if (!centreId) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    if (!(await canAccessCentre(user, centreId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this centre" }, { status: 403 });
    }

    const url = new URL(req.url);
    const session = url.searchParams.get("session") || currentSession();

    const data = await getInstitutionStudentData("afterSchoolCentre", centreId, session);
    if (!data) {
      return NextResponse.json({ error: "After school centre not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch after school centre student data error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
