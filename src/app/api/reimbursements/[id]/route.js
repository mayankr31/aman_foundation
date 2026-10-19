import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { notifyUsers, NOTIFICATION_TYPES } from "@/lib/notifications";
import { PAYMENT_MODES } from "@/lib/reimbursementCategories";
import {
  isReimbursementReceiptUrl,
  saveReceiptFile,
  validateReceiptFile,
} from "@/lib/reimbursementUploads";
import { canManageReimbursementForUser } from "@/lib/reimbursementScope";
import {
  collectReceiptFiles,
  isFutureDate,
  parseDateOnly,
  parseItems,
  reimbursementInclude,
  validateItem,
} from "@/lib/reimbursementValidation";

async function findReimbursement(id) {
  return prisma.reimbursement.findUnique({
    where: { id },
    include: reimbursementInclude,
  });
}

async function canViewReimbursement(user, reimbursement) {
  const canOwn = await checkPermission(user, "dashboard", "reimbursements", "READ");
  if (canOwn && reimbursement.userId === user.id) return true;

  const canManage = await checkPermission(user, "dashboard", "reimbursement-management", "READ");
  if (!canManage) return false;

  return canManageReimbursementForUser(user, reimbursement.userId);
}

export async function GET(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const reimbursement = await findReimbursement(id);
    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 });
    }

    if (!(await canViewReimbursement(user, reimbursement))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: reimbursement });
  } catch (error) {
    console.error("Fetch reimbursement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "reimbursement-management", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Reimbursement management access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await findReimbursement(id);
    if (!existing) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 });
    }

    if (!(await canManageReimbursementForUser(user, existing.userId))) {
      return NextResponse.json({ error: "Forbidden: You cannot review this claim" }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "").toUpperCase();

    if (action === "APPROVE") {
      if (existing.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending claims can be approved." }, { status: 400 });
      }

      const requestedItems = Array.isArray(body.items) ? body.items : [];
      const approvedById = new Map(
        requestedItems.map((item) => [item.id, Number.parseFloat(item.approvedAmount)])
      );

      const approvedItems = existing.items.map((item) => {
        let approvedAmount = Number(item.amount);
        if (approvedById.has(item.id)) {
          approvedAmount = approvedById.get(item.id);
        }
        if (!Number.isFinite(approvedAmount) || approvedAmount < 0 || approvedAmount > Number(item.amount)) {
          throw new Error(`Approved amount for "${item.description}" must be between 0 and ₹${Number(item.amount).toLocaleString("en-IN")}.`);
        }
        return { id: item.id, approvedAmount };
      });

      const totalApproved = approvedItems.reduce((sum, item) => sum + item.approvedAmount, 0);
      if (totalApproved <= 0) {
        return NextResponse.json({ error: "The approved amount must be greater than zero." }, { status: 400 });
      }

      await prisma.$transaction([
        ...approvedItems.map((item) =>
          prisma.reimbursementItem.update({
            where: { id: item.id },
            data: { approvedAmount: item.approvedAmount },
          })
        ),
        prisma.reimbursement.update({
          where: { id },
          data: {
            status: "APPROVED",
            totalApproved,
            approvedBy: user.id,
            approvedAt: new Date(),
            rejectionReason: null,
          },
        }),
      ]);

      const updated = await findReimbursement(id);
      await notifyUsers([existing.userId], {
        type: NOTIFICATION_TYPES.REIMBURSEMENT_APPROVED,
        title: "Reimbursement Approved",
        message: `Your reimbursement "${existing.title}" was approved for ₹${totalApproved.toLocaleString("en-IN")}.`,
        link: "/reimbursements",
        actorId: user.id,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "REJECT") {
      if (existing.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending claims can be rejected." }, { status: 400 });
      }

      const rejectionReason = String(body.rejectionReason || "").trim();
      if (!rejectionReason) {
        return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.reimbursementItem.updateMany({
          where: { reimbursementId: id },
          data: { approvedAmount: null },
        }),
        prisma.reimbursement.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason,
            approvedBy: user.id,
            approvedAt: new Date(),
            totalApproved: null,
          },
        }),
      ]);

      const updated = await findReimbursement(id);
      await notifyUsers([existing.userId], {
        type: NOTIFICATION_TYPES.REIMBURSEMENT_REJECTED,
        title: "Reimbursement Rejected",
        message: `Your reimbursement "${existing.title}" was rejected. Reason: ${rejectionReason}`,
        link: "/reimbursements",
        actorId: user.id,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "REIMBURSE") {
      if (existing.status !== "APPROVED") {
        return NextResponse.json({ error: "Only approved claims can be marked reimbursed." }, { status: 400 });
      }

      const maximumAmount = Number(existing.totalApproved ?? existing.totalClaimed);
      const reimbursedAmount = Number.parseFloat(body.reimbursedAmount);
      if (!Number.isFinite(reimbursedAmount) || reimbursedAmount <= 0 || reimbursedAmount > maximumAmount) {
        return NextResponse.json(
          { error: `Reimbursed amount must be greater than zero and at most ₹${maximumAmount.toLocaleString("en-IN")}.` },
          { status: 400 }
        );
      }

      const paymentMode = String(body.paymentMode || "").trim();
      if (!PAYMENT_MODES.includes(paymentMode)) {
        return NextResponse.json({ error: "Select a valid payment mode." }, { status: 400 });
      }

      const paymentReference = String(body.paymentReference || "").trim();
      if (paymentMode !== "Cash" && !paymentReference) {
        return NextResponse.json(
          { error: "A payment reference is required for non-cash payments." },
          { status: 400 }
        );
      }

      const reimbursedAt = body.reimbursedAt ? parseDateOnly(body.reimbursedAt) : new Date();
      if (!reimbursedAt) {
        return NextResponse.json({ error: "Enter a valid payment date." }, { status: 400 });
      }
      if (isFutureDate(reimbursedAt)) {
        return NextResponse.json({ error: "Payment date cannot be in the future." }, { status: 400 });
      }

      await prisma.reimbursement.update({
        where: { id },
        data: {
          status: "REIMBURSED",
          totalReimbursed: reimbursedAmount,
          reimbursedBy: user.id,
          reimbursedAt,
          paymentMode,
          paymentReference: paymentReference || null,
          paymentNotes: String(body.paymentNotes || "").trim() || null,
        },
      });

      const updated = await findReimbursement(id);
      await notifyUsers([existing.userId], {
        type: NOTIFICATION_TYPES.REIMBURSEMENT_REIMBURSED,
        title: "Reimbursement Paid",
        message: `Your reimbursement "${existing.title}" was marked reimbursed for ₹${reimbursedAmount.toLocaleString("en-IN")} via ${paymentMode}.`,
        link: "/reimbursements",
        actorId: user.id,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Invalid action. Use APPROVE, REJECT or REIMBURSE." }, { status: 400 });
  } catch (error) {
    if (error?.message?.startsWith("Approved amount for")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Review reimbursement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "reimbursements", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for reimbursements" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await findReimbursement(id);
    if (!existing) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending claims can be edited." }, { status: 400 });
    }

    const formData = await req.formData();
    const title = String(formData.get("title") || "").trim();
    if (!title) {
      return NextResponse.json({ error: "A claim title is required." }, { status: 400 });
    }

    const items = parseItems(formData.get("items"));
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Add at least one expense line." }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: "A claim can contain at most 50 expense lines." }, { status: 400 });
    }

    const filesByItem = collectReceiptFiles(formData, items.length);
    const cleanedItems = [];

    for (let index = 0; index < items.length; index += 1) {
      const result = validateItem(items[index], index);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const existingReceipts = Array.isArray(items[index].existingReceiptFiles)
        ? items[index].existingReceiptFiles.filter(isReimbursementReceiptUrl)
        : [];

      const newFiles = filesByItem[index];
      for (const file of newFiles) {
        const validation = validateReceiptFile(file);
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
      }

      if (!existingReceipts.length && !newFiles.length) {
        return NextResponse.json(
          { error: `Expense line ${index + 1} needs at least one receipt.` },
          { status: 400 }
        );
      }

      cleanedItems.push({ ...result, existingReceipts });
    }

    const receiptUrlsByItem = [];
    for (let index = 0; index < cleanedItems.length; index += 1) {
      const urls = [...cleanedItems[index].existingReceipts];
      for (const file of filesByItem[index]) {
        urls.push(await saveReceiptFile(file));
      }
      receiptUrlsByItem.push(urls);
    }

    const totalClaimed = cleanedItems.reduce((sum, item) => sum + item.amount, 0);

    await prisma.$transaction(async (tx) => {
      await tx.reimbursementItem.deleteMany({ where: { reimbursementId: id } });
      await tx.reimbursement.update({
        where: { id },
        data: {
          title,
          purpose: String(formData.get("purpose") || "").trim() || null,
          notes: String(formData.get("notes") || "").trim() || null,
          bankName: String(formData.get("bankName") || "").trim() || null,
          bankAccountNo: String(formData.get("bankAccountNo") || "").trim() || null,
          bankIfsc: String(formData.get("bankIfsc") || "").trim() || null,
          totalClaimed,
          items: {
            create: cleanedItems.map((item, index) => ({
              expenseDate: item.expenseDate,
              category: item.category,
              description: item.description,
              amount: item.amount,
              receiptFiles: receiptUrlsByItem[index],
            })),
          },
        },
      });
    });

    const updated = await findReimbursement(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update reimbursement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await context.params;
    const existing = await findReimbursement(id);
    if (!existing) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 });
    }

    const isOwner = existing.userId === user.id
      && existing.status === "PENDING"
      && (await checkPermission(user, "dashboard", "reimbursements", "WRITE"));

    const isAdmin = user.role?.name === "ADMIN"
      && (await checkPermission(user, "dashboard", "reimbursement-management", "WRITE"));

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.reimbursement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Reimbursement deleted" });
  } catch (error) {
    console.error("Delete reimbursement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
