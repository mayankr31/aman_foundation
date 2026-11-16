import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDefaultTemplate,
  isSurveyKey,
  isVerifiedAdmin,
  normalizeSurveyKey,
  normalizeTemplate,
  validateSurveyTemplate,
} from "@/lib/surveyTemplates";

export const dynamic = "force-dynamic";

function resolveKey(rawKey) {
  const key = normalizeSurveyKey(rawKey);
  return isSurveyKey(key) ? key : null;
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { key: rawKey } = await params;
    const key = resolveKey(rawKey);
    if (!key) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const row = await prisma.surveyTemplate.findUnique({ where: { key } });
    const template = normalizeTemplate(row?.config || getDefaultTemplate(key), key);

    return NextResponse.json({
      success: true,
      data: template,
      meta: {
        customized: Boolean(row),
        updatedAt: row?.updatedAt || null,
        updatedBy: row?.updatedBy || null,
        canEdit: Boolean(isVerifiedAdmin(user)),
      },
    });
  } catch (error) {
    console.error("GET survey template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isVerifiedAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can edit surveys" },
        { status: 403 }
      );
    }

    const { key: rawKey } = await params;
    const key = resolveKey(rawKey);
    if (!key) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const body = await req.json();
    const config = body?.config;
    const validation = validateSurveyTemplate(config);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const template = normalizeTemplate(config, key);
    const row = await prisma.surveyTemplate.upsert({
      where: { key },
      create: {
        key,
        title: template.title,
        config: template,
        updatedBy: user.name || user.username || "Admin",
      },
      update: {
        title: template.title,
        config: template,
        updatedBy: user.name || user.username || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      data: normalizeTemplate(row.config, key),
      meta: {
        customized: true,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      },
    });
  } catch (error) {
    console.error("PUT survey template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!isVerifiedAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can reset surveys" },
        { status: 403 }
      );
    }

    const { key: rawKey } = await params;
    const key = resolveKey(rawKey);
    if (!key) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    await prisma.surveyTemplate.deleteMany({ where: { key } });
    const template = getDefaultTemplate(key);

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("DELETE survey template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
