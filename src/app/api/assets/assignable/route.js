import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { getAssignableAssetUsers } from "@/lib/assets";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "assets", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Missing assets permission" }, { status: 403 });
    }

    const users = await getAssignableAssetUsers(user);
    return NextResponse.json({
      success: true,
      data: users,
      meta: { hasTeam: users.length > 0 },
    });
  } catch (error) {
    console.error("Fetch assignable asset users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
