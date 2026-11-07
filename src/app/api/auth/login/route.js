import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";
import { getMissingProfileFields } from "@/lib/profileCompleteness";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { formatRoleLabel } from "@/lib/roles";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, username, password } = body;

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || "" },
          { username: username || "" }
        ]
      },
      include: {
        role: true,
        fellow: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check status
    if (user.status === "PENDING") {
      return NextResponse.json(
        { error: "Your account is pending. Please wait for admin approval." },
        { status: 403 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Account access denied. Status is ${user.status}` },
        { status: 403 }
      );
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      roleId: user.roleId,
    });

    const permissions = await getEffectivePermissions(user);
    const missingProfileFields = getMissingProfileFields(user);
    const profileIncomplete = missingProfileFields.length > 0;

    if (profileIncomplete) {
      try {
        await notifyUsers([user.id], {
          type: NOTIFICATION_TYPES.PROFILE_INCOMPLETE,
          title: "Complete your personal details",
          message:
            "Please fill in your mandatory personal details to finish setting up your profile.",
          link: "/profile?tab=personal-details&edit=1",
          dedupeKey: `profile-incomplete:${user.id}`,
        });
      } catch (notifyError) {
        console.error("Profile completion notification failed:", notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          roleDisplayName: formatRoleLabel(user.role),
          name: user.name,
          fellowId: user.fellow?.id || null,
          fellowName: user.fellow?.name || null,
          managerId: user.managerId || null,
          profileIncomplete,
          missingProfileFields,
          permissions,
        }
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
