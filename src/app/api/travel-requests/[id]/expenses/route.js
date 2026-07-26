import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "travel-expenses");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {}
}

async function saveFile(file) {
  if (!file || file.size === 0) return null;
  await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "pdf";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);
  return `/uploads/travel-expenses/${filename}`;
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;

    const travelRequest = await prisma.travelRequest.findUnique({ where: { id } });
    if (!travelRequest) {
      return NextResponse.json({ error: "Travel request not found" }, { status: 404 });
    }

    if (travelRequest.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (travelRequest.status !== "APPROVED") {
      return NextResponse.json({ error: "Can only submit expenses for approved travel requests" }, { status: 400 });
    }

    const formData = await req.formData();
    const actualExpense = parseFloat(formData.get("actualExpense")) || 0;
    const expenseDetailsRaw = formData.get("expenseDetails");
    const notes = formData.get("notes") || null;

    let expenseDetails = null;
    if (expenseDetailsRaw) {
      try {
        expenseDetails = JSON.parse(expenseDetailsRaw);
      } catch (e) {
        return NextResponse.json({ error: "Invalid expenseDetails JSON" }, { status: 400 });
      }
    }

    const receiptFiles = [];
    const fileKeys = [...formData.keys()].filter(k => k.startsWith("receipt_"));
    for (const key of fileKeys) {
      const file = formData.get(key);
      if (file && file.size > 0 && file.name) {
        const url = await saveFile(file);
        if (url) receiptFiles.push(url);
      }
    }

    const expense = await prisma.travelExpense.create({
      data: {
        travelRequestId: id,
        actualExpense,
        expenseDetails,
        receiptFiles: receiptFiles.length > 0 ? receiptFiles : null,
        notes
      }
    });

    await prisma.travelRequest.update({
      where: { id },
      data: { status: "COMPLETED" }
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    console.error("Submit travel expense error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
