import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { generateEmployeeId } from "@/lib/employeeId";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { getMissingProfileFields } from "@/lib/profileCompleteness";

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    // Must be ADMIN
    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, department } = body;

    const validStatuses = ["PENDING", "ACTIVE", "REJECTED", "BLOCKED", "INACTIVE"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const dataToUpdate = { status };
    if (department !== undefined) {
      dataToUpdate.department = department;
    }
    if (status === "INACTIVE") {
      dataToUpdate.inactiveSince = new Date();
    } else if (status === "ACTIVE") {
      dataToUpdate.inactiveSince = null;
      dataToUpdate.dateOfLeaving = null;
      dataToUpdate.resignationReason = null;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        fellow: { select: { id: true } },
        role: { select: { name: true, displayName: true, rank: true } }
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (status === "ACTIVE" && !targetUser.employeeId) {
        dataToUpdate.employeeId = await generateEmployeeId(tx);
      }

      const updated = await tx.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          username: true,
          status: true,
          employeeId: true,
          inactiveSince: true,
          role: { select: { name: true, displayName: true, rank: true } }
        }
      });

      // When a fellow account is approved, ensure a linked Fellow profile exists
      // so the fellow can access their dashboard data.
      if (
        status === "ACTIVE" &&
        targetUser.role?.name === "FELLOW" &&
        !targetUser.fellow
      ) {
        const existing = targetUser.email
          ? await tx.fellow.findUnique({ where: { email: targetUser.email } })
          : null;

        if (existing && !existing.userId) {
          await tx.fellow.update({
            where: { id: existing.id },
            data: { userId: id },
          });
        } else if (!existing) {
          await tx.fellow.create({
            data: {
              name: targetUser.name,
              email: targetUser.email,
              userId: id,
            },
          });
        }
      }

      return updated;
    });

    if (status === "ACTIVE") {
      const fullUser = await prisma.user.findUnique({
        where: { id },
        include: { fellow: true },
      });
      const missing = getMissingProfileFields(fullUser);
      if (missing.length > 0) {
        try {
          await notifyUsers([id], {
            type: NOTIFICATION_TYPES.PROFILE_INCOMPLETE,
            title: "Complete your personal details",
            message:
              "Your account is approved. Please fill in your mandatory personal details to finish setting up your profile.",
            link: "/profile?tab=personal-details&edit=1",
            dedupeKey: `profile-incomplete:${id}`,
          });
        } catch (notifyError) {
          console.error("Profile completion notification failed:", notifyError);
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
