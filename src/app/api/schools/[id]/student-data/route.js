import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { currentSession, getInstitutionStudentData } from "@/lib/fellowStudentData";
import { canAccessSchool, resolveSchoolId } from "@/lib/institutionScope";

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "education", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for education" }, { status: 403 });
    }

    const { id } = await context.params;
    const schoolId = await resolveSchoolId(id);
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (!(await canAccessSchool(user, schoolId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this school" }, { status: 403 });
    }

    const url = new URL(req.url);
    const session = url.searchParams.get("session") || currentSession();

    const data = await getInstitutionStudentData("school", schoolId, session);
    if (!data) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch school student data error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
