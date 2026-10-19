import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  getFellowIdByUserId,
} from "@/lib/scope";
import {
  getAdminUserIds,
  getProgramStaffForFellow,
  notifyUsers,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import { saveReceiptFile, validateReceiptFile } from "@/lib/reimbursementUploads";
import { getManagedFellowUserIds } from "@/lib/reimbursementScope";
import {
  collectReceiptFiles,
  parseItems,
  reimbursementInclude,
  validateItem,
} from "@/lib/reimbursementValidation";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const canOwn = await checkPermission(user, "dashboard", "reimbursements", "READ");
    const canManage = await checkPermission(user, "dashboard", "reimbursement-management", "READ");
    if (!canOwn && !canManage) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for reimbursements" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "mine";

    let where;
    if (scope === "manage") {
      if (!canManage) {
        return NextResponse.json({ error: "Forbidden: Reimbursement management access required" }, { status: 403 });
      }

      if (user.role?.name === "ADMIN") {
        where = {};
      } else if (user.role?.name === "PROGRAM_MANAGER") {
        const managedUserIds = await getManagedFellowUserIds(user.id);
        where = { userId: { in: managedUserIds } };
      } else {
        // Other roles may be granted management access explicitly.
        where = {};
      }
    } else {
      if (!canOwn) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions for reimbursements" }, { status: 403 });
      }
      where = { userId: user.id };
    }

    const reimbursements = await prisma.reimbursement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: reimbursementInclude,
    });

    return NextResponse.json({ success: true, data: reimbursements });
  } catch (error) {
    console.error("Fetch reimbursements error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "reimbursements", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for reimbursements" }, { status: 403 });
    }

    if (user.role?.name === "ADMIN") {
      return NextResponse.json({ error: "Admins cannot submit reimbursement requests." }, { status: 403 });
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

      const itemFiles = filesByItem[index];
      if (!itemFiles.length) {
        return NextResponse.json(
          { error: `Expense line ${index + 1} needs at least one receipt.` },
          { status: 400 }
        );
      }

      for (const file of itemFiles) {
        const validation = validateReceiptFile(file);
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
      }

      cleanedItems.push(result);
    }

    const receiptUrlsByItem = [];
    for (let index = 0; index < cleanedItems.length; index += 1) {
      const urls = [];
      for (const file of filesByItem[index]) {
        urls.push(await saveReceiptFile(file));
      }
      receiptUrlsByItem.push(urls);
    }

    const totalClaimed = cleanedItems.reduce((sum, item) => sum + item.amount, 0);

    const reimbursement = await prisma.reimbursement.create({
      data: {
        userId: user.id,
        title,
        purpose: String(formData.get("purpose") || "").trim() || null,
        notes: String(formData.get("notes") || "").trim() || null,
        bankName: String(formData.get("bankName") || "").trim() || null,
        bankAccountNo: String(formData.get("bankAccountNo") || "").trim() || null,
        bankIfsc: String(formData.get("bankIfsc") || "").trim() || null,
        totalClaimed,
        status: "PENDING",
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
      include: reimbursementInclude,
    });

    let recipients;
    if (user.role?.name === "FELLOW") {
      const fellowId = await getFellowIdByUserId(user.id);
      const [programStaff, admins] = await Promise.all([
        getProgramStaffForFellow(fellowId),
        getAdminUserIds(),
      ]);
      const programManagers = programStaff.length
        ? await prisma.user.findMany({
            where: {
              id: { in: programStaff },
              status: "ACTIVE",
              role: { name: "PROGRAM_MANAGER" },
            },
            select: { id: true },
          })
        : [];
      recipients = [...programManagers.map((manager) => manager.id), ...admins];
    } else {
      recipients = await getAdminUserIds();
    }

    await notifyUsers(recipients, {
      type: NOTIFICATION_TYPES.REIMBURSEMENT_REQUESTED,
      title: "New Reimbursement Request",
      message: `${user.name || reimbursement.user?.name || "A staff member"} submitted a reimbursement claim of ₹${totalClaimed.toLocaleString("en-IN")} for approval.`,
      link: "/reimbursements/manage",
      actorId: user.id,
    });

    return NextResponse.json({ success: true, data: reimbursement }, { status: 201 });
  } catch (error) {
    console.error("Create reimbursement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
