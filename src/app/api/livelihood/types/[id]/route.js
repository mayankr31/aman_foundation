import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { normalizeTypeConfig } from "@/lib/livelihoodTypeValidation";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

function canManage(user) {
  return user.role.name === "ADMIN" || PROGRAM_ROLES.includes(user.role.name);
}

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (!canManage(user)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.livelihoodType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Type not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData = {};

    if (body.label !== undefined) {
      const label = String(body.label).trim();
      if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 });
      updateData.label = label;
    }
    if (body.icon !== undefined) updateData.icon = String(body.icon || "category").trim() || "category";
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.programTargetUnit !== undefined) {
      updateData.programTargetUnit = body.programTargetUnit || null;
    }
    if (body.category !== undefined) {
      const category = String(body.category).trim();
      if (!["FARM", "NON_FARM"].includes(category)) {
        return NextResponse.json({ error: "Category must be FARM or NON_FARM" }, { status: 400 });
      }
      updateData.category = category;
    }
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    if (body.order !== undefined) {
      const order = parseInt(body.order, 10);
      if (!Number.isNaN(order)) updateData.order = order;
    }

    const touchesConfig = ["fields", "eventTypes", "tableColumns", "kpiCards"].some(
      (k) => body[k] !== undefined
    );
    if (touchesConfig) {
      const config = normalizeTypeConfig({
        fields: body.fields ?? existing.fields,
        eventTypes: body.eventTypes ?? existing.eventTypes,
        tableColumns: body.tableColumns ?? existing.tableColumns,
        kpiCards: body.kpiCards ?? existing.kpiCards,
      });
      if (config.error) {
        return NextResponse.json({ error: config.error }, { status: 400 });
      }
      Object.assign(updateData, config);
    }

    // Guard against duplicate labels within the same category.
    const nextLabel = updateData.label ?? existing.label;
    const nextCategory = updateData.category ?? existing.category;
    if (nextLabel !== existing.label || nextCategory !== existing.category) {
      const duplicate = await prisma.livelihoodType.findFirst({
        where: {
          id: { not: id },
          category: nextCategory,
          label: { equals: nextLabel, mode: "insensitive" },
          active: true,
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A type with this name already exists in this category" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.livelihoodType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update livelihood type error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (!canManage(user)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Program Manager access only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.livelihoodType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Type not found" }, { status: 404 });
    }

    // Soft-delete: hide from new-program dropdowns but keep existing programs working.
    const updated = await prisma.livelihoodType.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Delete livelihood type error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
