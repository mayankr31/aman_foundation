import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const fellow = await prisma.fellow.findUnique({
      where: { id: fellowId },
      include: {
        schools: { include: { school: { select: { id: true, name: true, location: true, status: true } } } },
        students: true,
        goalSheets: {
          orderBy: { date: "desc" }
        },
        reviews: true
      }
    });

    return NextResponse.json({ success: true, data: fellow });
  } catch (error) {
    console.error("Fetch fellow detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const body = await req.json();

    const updatedFellow = await prisma.fellow.update({
      where: { id: fellowId },
      data: {
        name: body.name,
        dob: body.dob ? new Date(body.dob) : undefined,
        gender: body.gender,
        email: body.email,
        phone: body.phone,
        address: body.address,
        cohort: body.cohort,
        avatar: body.avatar,
        progress: body.progress !== undefined ? parseInt(body.progress) : undefined,
        evaluationRating: body.evaluationRating !== undefined ? parseFloat(body.evaluationRating) : undefined,
        userId: body.userId
      }
    });

    return NextResponse.json({ success: true, data: updatedFellow });
  } catch (error) {
    console.error("Update fellow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);

    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decouple students assigned to this fellow
      await tx.student.updateMany({
        where: { fellowId },
        data: { fellowId: null }
      });

      // 2. Remove school assignments (M2M)
      await tx.fellowSchool.deleteMany({ where: { fellowId } });

      // 3. Delete reviews
      await tx.fellowReview.deleteMany({
        where: { fellowId }
      });

      // 4. Delete goal sheets
      await tx.goalSheet.deleteMany({
        where: { fellowId }
      });

      // 5. Delete the fellow record
      await tx.fellow.delete({
        where: { id: fellowId }
      });
    });

    return NextResponse.json({ success: true, message: "Fellow deleted successfully" });
  } catch (error) {
    console.error("Delete fellow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
