import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isAdmin, isLivelihoodProgramManaged, getFellowIdByUserId, isLivelihoodProgramAssignedToFellow } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";
import { isProgramStaffRole } from "@/lib/roles";


export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id } = await params;

    let allowed = isAdmin(user);
    if (!allowed && isProgramStaffRole(user?.role?.name)) {
      allowed = await isLivelihoodProgramManaged(user.id, id);
    }
    if (!allowed && user.role.name === "FELLOW") {
      const fellowId = await getFellowIdByUserId(user.id);
      allowed = await isLivelihoodProgramAssignedToFellow(fellowId, id);
    }
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this program" },
        { status: 403 }
      );
    }

    const program = await prisma.livelihoodProgram.findUnique({
      where: { id },
      include: {
        components: { orderBy: { order: "asc" } },
        programManagers: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, mobile: true, role: { select: { name: true, displayName: true, rank: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        fellows: {
          include: {
            fellow: {
              select: { id: true, name: true, email: true, phone: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        assignments: {
          include: {
            beneficiary: {
              select: {
                id: true,
                name: true,
                enrolmentId: true,
                address: true,
                mobNumber: true,
                tier: true,
              },
            },
            events: {
              orderBy: { eventDate: "desc" },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("Fetch program detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }


    const { id } = await params;

    if (isProgramStaffRole(user?.role?.name) && !(await isLivelihoodProgramManaged(user.id, id))) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this program" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, status, totalTarget } = body;

    const existing = await prisma.livelihoodProgram.findUnique({
      where: { id },
      include: { components: { orderBy: { order: "asc" } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (totalTarget !== undefined)
      updateData.totalTarget = totalTarget !== "" && totalTarget !== null ? parseFloat(totalTarget) : null;

    // Update the program's components when provided.
    if (body.components !== undefined) {
      if (!Array.isArray(body.components)) {
        return NextResponse.json({ error: "components must be an array" }, { status: 400 });
      }

      const desired = [];
      for (const raw of body.components) {
        const typeKey = String(
          typeof raw === "string" ? raw : raw?.typeKey || ""
        ).trim();
        if (!typeKey || desired.some((c) => c.typeKey === typeKey)) continue;
        const target =
          typeof raw === "object" && raw?.target !== undefined && raw?.target !== null && raw?.target !== ""
            ? parseFloat(raw.target)
            : null;
        desired.push({ typeKey, target: Number.isFinite(target) ? target : null });
      }

      if (desired.length === 0) {
        return NextResponse.json(
          { error: "A program must have at least one type" },
          { status: 400 }
        );
      }

      const existingKeys = new Set(existing.components.map((c) => c.typeKey));
      const desiredKeys = new Set(desired.map((c) => c.typeKey));
      const addedKeys = desired.filter((c) => !existingKeys.has(c.typeKey));
      const removedKeys = existing.components
        .map((c) => c.typeKey)
        .filter((key) => !desiredKeys.has(key));

      if (addedKeys.length > 0) {
        const validTypes = await prisma.livelihoodType.findMany({
          where: { key: { in: addedKeys.map((c) => c.typeKey) }, active: true },
          select: { key: true },
        });
        if (validTypes.length !== addedKeys.length) {
          return NextResponse.json(
            { error: "One or more selected program types are invalid or inactive" },
            { status: 400 }
          );
        }
      }

      for (const key of removedKeys) {
        const enrolled = await prisma.beneficiaryLivelihood.count({
          where: { programId: id, typeKey: key },
        });
        if (enrolled > 0) {
          return NextResponse.json(
            {
              error: `Cannot remove "${key}" because ${enrolled} participant(s) are enrolled in it. Remove those assignments first.`,
            },
            { status: 409 }
          );
        }
      }

      const types = await prisma.livelihoodType.findMany({
        where: { key: { in: desired.map((c) => c.typeKey) } },
        select: { key: true, category: true },
      });
      if (types.length !== desired.length) {
        return NextResponse.json(
          { error: "One or more selected program types do not exist" },
          { status: 400 }
        );
      }
      const categories = new Set(types.map((t) => t.category));
      updateData.category = categories.size > 1 ? "MIXED" : [...categories][0];
      updateData.type = desired[0].typeKey;

      await prisma.$transaction([
        prisma.livelihoodProgramComponent.deleteMany({
          where: { programId: id, typeKey: { in: removedKeys } },
        }),
        ...desired.map((component, index) =>
          prisma.livelihoodProgramComponent.upsert({
            where: {
              programId_typeKey: { programId: id, typeKey: component.typeKey },
            },
            create: {
              programId: id,
              typeKey: component.typeKey,
              target: component.target,
              order: index,
            },
            update: { target: component.target, order: index },
          })
        ),
        prisma.livelihoodProgram.update({ where: { id }, data: updateData }),
      ]);

      const program = await prisma.livelihoodProgram.findUnique({
        where: { id },
        include: { components: { orderBy: { order: "asc" } } },
      });
      return NextResponse.json({ success: true, data: program });
    }

    const program = await prisma.livelihoodProgram.update({
      where: { id },
      data: updateData,
      include: { components: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error("Update program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (user.role?.name !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Executive Director can delete records" },
        { status: 403 }
      );
    }


    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }


    const { id } = await params;

    if (isProgramStaffRole(user?.role?.name) && !(await isLivelihoodProgramManaged(user.id, id))) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this program" },
        { status: 403 }
      );
    }

    const existing = await prisma.livelihoodProgram.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    await prisma.livelihoodProgram.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Program deleted successfully" });
  } catch (error) {
    console.error("Delete program error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
