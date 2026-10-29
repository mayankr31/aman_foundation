import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  ASSET_INCLUDE,
  assetStatusCondition,
  buildAssetWhere,
  canAssignAssetTo,
  decorateAsset,
  getAssetInclude,
  getAssetReadScope,
  normalizeAssetCode,
} from "@/lib/assets";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "assets", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Missing assets permission" }, { status: 403 });
    }
    const canWrite = await checkPermission(user, "dashboard", "assets", "WRITE");

    const { searchParams } = new URL(req.url);
    const requestedScope = searchParams.get("scope") || "mine";
    const isUnrestricted = user.role?.name === "ADMIN" || user.role?.name === "HR";
    const scope = requestedScope === "all" && !isUnrestricted ? "team" : requestedScope;
    const search = String(searchParams.get("search") || "").trim();
    const status = String(searchParams.get("status") || "").trim().toUpperCase();

    const readScope = await getAssetReadScope(user);
    const where = buildAssetWhere(user, scope, readScope);

    const andConditions = [];
    if (search) {
      andConditions.push({
        OR: [
          { assetCode: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
          { serialNumber: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const statusCondition = assetStatusCondition(status);
    if (statusCondition) andConditions.push(statusCondition);
    if (andConditions.length) where.AND = andConditions;

    const assets = await prisma.asset.findMany({
      where,
      include: getAssetInclude({ currentOnly: !canWrite }),
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: assets.map(decorateAsset),
      meta: { scope, isUnrestricted },
    });
  } catch (error) {
    console.error("Fetch assets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;
    if (!(await checkPermission(user, "dashboard", "assets", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Missing assets write permission" }, { status: 403 });
    }

    const body = await req.json();
    const assetCode = normalizeAssetCode(body.assetCode);
    const name = String(body.name || "").trim();
    if (!assetCode) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Asset name is required" }, { status: 400 });
    }

    const targetUserId = body.assignToUserId ? String(body.assignToUserId) : "";
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

    const existing = await prisma.asset.findUnique({ where: { assetCode } });
    if (existing) {
      return NextResponse.json(
        { error: "An asset with this ID already exists. Use Reassign on the existing record." },
        { status: 409 }
      );
    }

    const createdAsset = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({
        data: {
          assetCode,
          name,
          category: body.category ? String(body.category).trim() : null,
          serialNumber: body.serialNumber ? String(body.serialNumber).trim() : null,
          description: body.description ? String(body.description).trim() : null,
          condition: body.condition ? String(body.condition).trim() : null,
          notes: body.notes ? String(body.notes).trim() : null,
          createdById: user.id,
        },
      });

      await tx.assetAssignment.create({
        data: {
          assetId: created.id,
          userId: targetUserId,
          assignedById: user.id,
          notes: body.assignmentNotes ? String(body.assignmentNotes).trim() : null,
        },
      });

      return tx.asset.findUnique({ where: { id: created.id }, include: ASSET_INCLUDE });
    });
    const asset = decorateAsset(createdAsset);

    await notifyUsers([targetUserId], {
      type: NOTIFICATION_TYPES.ASSET_ASSIGNED,
      title: "Asset assigned",
      message: `${user.name || "Your manager"} assigned ${asset.name} (${asset.assetCode}) to you.`,
      link: "/assets",
      actorId: user.id,
      metadata: { assetId: asset.id },
      dedupeKey: `asset-assigned:${asset.id}:${targetUserId}`,
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An asset with this ID already exists. Use Reassign on the existing record." },
        { status: 409 }
      );
    }
    console.error("Create asset error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
