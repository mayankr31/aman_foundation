import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SURVEY_KEYS,
  SURVEY_META,
  getDefaultTemplate,
} from "@/lib/surveyTemplates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { error } = await authenticateUser(req);
    if (error) return error;

    const rows = await prisma.surveyTemplate.findMany();
    const data = SURVEY_KEYS.map((key) => {
      const row = rows.find((item) => item.key === key);
      const fallback = getDefaultTemplate(key);
      return {
        key,
        label: SURVEY_META[key]?.label || fallback?.title || key,
        description: SURVEY_META[key]?.description || "",
        icon: SURVEY_META[key]?.icon || "assignment",
        questionCount: row?.config?.questions?.length ?? fallback?.questions?.length ?? 0,
        customized: Boolean(row),
        updatedAt: row?.updatedAt || null,
        updatedBy: row?.updatedBy || null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET survey templates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
