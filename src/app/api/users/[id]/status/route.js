import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

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

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, fellow: { select: { id: true } }, role: { select: { name: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          username: true,
          status: true,
          role: { select: { name: true } }
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

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
