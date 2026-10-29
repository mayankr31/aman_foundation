import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  ASSET_INCLUDE,
  activeAssignment,
  canAssignAssetTo,
  canManageAsset,
  canViewAsset,
  decorateAsset,
  getAssetInclude,
  getAssetReadScope,
  normalizeAssetCode,
} from "@/lib/assets";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function loadAsset(id, include = ASSET_INCLUDE) {
  return prisma.asset.findUnique({ where: { id }, include });
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "assets", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Missing assets permission" }, { status: 403 });
    }

    const canWrite = await checkPermission(user, "dashboard", "assets", "WRITE");
    const { id } = await context.params;
    const asset = await loadAsset(id, getAssetInclude({ currentOnly: !canWrite }));
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const readScope = await getAssetReadScope(user);
    if (!canViewAsset(user, asset, readScope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: decorateAsset(asset) });
  } catch (error) {
    console.error("Fetch asset error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "assets", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Missing assets write permission" }, { status: 403 });
    }

    const { id } = await context.params;
    const asset = await loadAsset(id);
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    if (!(await canManageAsset(user, asset))) {
      return NextResponse.json({ error: "Forbidden: You cannot manage this asset" }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "update");

    if (action === "assign") {
      const targetUserId = String(body.userId || body.assignToUserId || "");
      if (!targetUserId) {
        return NextResponse.json({ error: "Select an employee to assign this asset to" }, { status: 400 });
      }
      if (targetUserId === user.id) {
        return NextResponse.json({ error: "You cannot assign an asset to yourself" }, { status: 400 });
      }

      const target = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, status: true },
      });
      if (!target || target.status !== "ACTIVE") {
        return NextResponse.json({ error: "Selected employee is not active" }, { status: 400 });
      }
      if (!(await canAssignAssetTo(user, targetUserId))) {
        return NextResponse.json({ error: "You can only assign assets to people who report to you" }, { status: 403 });
      }

      const now = new Date();
      const updated = await prisma.$transaction(async (tx) => {
        await tx.assetAssignment.updateMany({
          where: { assetId: id, returnedAt: null },
          data: { returnedAt: now, returnNotes: "Reassigned" },
        });
        await tx.assetAssignment.create({
          data: {
            assetId: id,
            userId: targetUserId,
            assignedById: user.id,
            notes: body.notes ? String(body.notes).trim() : null,
          },
        });
        return tx.asset.findUnique({ where: { id }, include: ASSET_INCLUDE });
      });
      const decorated = decorateAsset(updated);

      await notifyUsers([targetUserId], {
        type: NOTIFICATION_TYPES.ASSET_ASSIGNED,
        title: "Asset assigned",
        message: `${user.name || "Your manager"} assigned ${decorated.name} (${decorated.assetCode}) to you.`,
        link: "/assets",
        actorId: user.id,
        metadata: { assetId: decorated.id },
        dedupeKey: `asset-assigned:${decorated.id}:${targetUserId}:${now.getTime()}`,
      });

      return NextResponse.json({ success: true, data: decorated });
    }

    if (action === "return") {
      const current = activeAssignment(asset);
      if (!current) {
        return NextResponse.json({ error: "This asset is not currently assigned" }, { status: 400 });
      }

      const now = new Date();
      const updated = await prisma.$transaction(async (tx) => {
        await tx.assetAssignment.update({
          where: { id: current.id },
          data: {
            returnedAt: now,
            returnCondition: body.returnCondition ? String(body.returnCondition).trim() : null,
            returnNotes: body.returnNotes ? String(body.returnNotes).trim() : null,
          },
        });
        return tx.asset.findUnique({ where: { id }, include: ASSET_INCLUDE });
      });
      const decorated = decorateAsset(updated);

      await notifyUsers([current.userId], {
        type: NOTIFICATION_TYPES.ASSET_RETURNED,
        title: "Asset returned",
        message: `${decorated.name} (${decorated.assetCode}) has been marked as returned.`,
        link: "/assets",
        actorId: user.id,
        metadata: { assetId: decorated.id },
        dedupeKey: `asset-returned:${current.id}`,
      });

      return NextResponse.json({ success: true, data: decorated });
    }

    const data = {};
    if (body.assetCode !== undefined) {
      const assetCode = normalizeAssetCode(body.assetCode);
      if (!assetCode) {
        return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
      }
      data.assetCode = assetCode;
    }
    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) return NextResponse.json({ error: "Asset name is required" }, { status: 400 });
      data.name = name;
    }
    if (body.category !== undefined) data.category = body.category ? String(body.category).trim() : null;
    if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber ? String(body.serialNumber).trim() : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.condition !== undefined) data.condition = body.condition ? String(body.condition).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

    const updated = await prisma.asset.update({
      where: { id },
      data,
      include: ASSET_INCLUDE,
    });

    return NextResponse.json({ success: true, data: decorateAsset(updated) });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An asset with this ID already exists. Use Reassign on the existing record." },
        { status: 409 }
      );
    }
    console.error("Update asset error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
