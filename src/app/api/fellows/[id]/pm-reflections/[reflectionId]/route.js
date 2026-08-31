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

    const { id, reflectionId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const reflection = await prisma.pMReflection.findFirst({
      where: { id: reflectionId, fellowId },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!reflection) {
      return NextResponse.json({ error: "PM Reflection not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reflection });
  } catch (err) {
    console.error("Fetch PM reflection error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Only managers can edit PM reflections" }, { status: 403 });
    }

    const { id, reflectionId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const existing = await prisma.pMReflection.findFirst({
      where: { id: reflectionId, fellowId },
    });

    if (!existing) {
      return NextResponse.json({ error: "PM Reflection not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData = {};
    if (body.date) updateData.date = new Date(body.date);
    if (body.responses !== undefined) updateData.responses = body.responses;
    if (body.matrix !== undefined) updateData.matrix = body.matrix;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await prisma.pMReflection.update({
      where: { id: reflectionId },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update PM reflection error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER") {
      return NextResponse.json({ error: "Forbidden: Only managers can delete PM reflections" }, { status: 403 });
    }

    const { id, reflectionId } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const existing = await prisma.pMReflection.findFirst({
      where: { id: reflectionId, fellowId },
    });

    if (!existing) {
      return NextResponse.json({ error: "PM Reflection not found" }, { status: 404 });
    }

    await prisma.pMReflection.delete({ where: { id: reflectionId } });

    return NextResponse.json({ success: true, message: "PM Reflection deleted successfully" });
  } catch (err) {
    console.error("Delete PM reflection error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
