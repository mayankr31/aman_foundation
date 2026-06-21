import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function DELETE(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    // Must be ADMIN
    if (currentUser.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;

    // Check if the user is attempting to delete themselves
    if (currentUser.id === id) {
      return NextResponse.json({ error: "Conflict: You cannot delete your own account" }, { status: 409 });
    }

    // Retrieve user and fellow record
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { fellow: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Run programmatic cascade delete in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. If user is a fellow, handle fellow relationships
      if (targetUser.fellow) {
        const fellowId = targetUser.fellow.id;
        
        // Dissociate students (set fellowId to null)
        await tx.student.updateMany({
          where: { fellowId },
          data: { fellowId: null }
        });
        
        // Delete the fellow (which cascades to FellowGoal, FellowGoalMilestone, FellowReview in db)
        await tx.fellow.delete({
          where: { id: fellowId }
        });
      }
      
      // 2. Dissociate broadcast alerts sent by this user
      await tx.broadcastAlert.updateMany({
        where: { sentByUserId: id },
        data: { sentByUserId: null }
      });
      
      // 3. Dissociate inventory ledger transactions handled by this user
      await tx.inventoryLedger.updateMany({
        where: { handledByUserId: id },
        data: { handledByUserId: null }
      });
      
      // 4. Delete the user record (which cascades to UserPermission in db)
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user: currentUser, error } = await authenticateUser(req);
    if (error) return error;

    if (currentUser.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, email, department } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        department: department !== undefined ? department : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        status: true,
        role: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
