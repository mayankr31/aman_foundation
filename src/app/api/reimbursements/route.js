import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  getFellowIdByUserId,
} from "@/lib/scope";
import {
  getAccountantUserIds,
  getAdminUserIds,
  getProgramStaffForFellow,
  notifyUsers,
  NOTIFICATION_TYPES,
} from "@/lib/notifications";
import { saveReceiptFile, validateReceiptFile } from "@/lib/reimbursementUploads";
import { getReimbursementManagementWhere } from "@/lib/reimbursementScope";
import { getAncestorUserIds } from "@/lib/hierarchy";
import {
  collectReceiptFiles,
  parseItems,
  reimbursementInclude,
  validateItem,
} from "@/lib/reimbursementValidation";

/**
 * People who should review a newly submitted claim: reporting-line seniors with
 * reimbursement-management access, all active accountants and (for fellows) the
 * program staff assigned to them. Admins are the fallback when no reviewer is
 * configured.
 */
async function getReimbursementReviewerUserIds(user) {
  const [admins, accountantIds, ancestorIds] = await Promise.all([
    getAdminUserIds(),
    getAccountantUserIds(),
    getAncestorUserIds(user.id),
  ]);

  const ancestorCandidates = ancestorIds.filter(
    (id) => !admins.includes(id) && !accountantIds.includes(id)
  );

  const users = ancestorCandidates.length
    ? await prisma.user.findMany({
        where: { id: { in: ancestorCandidates }, status: "ACTIVE" },
        include: { role: true },
      })
    : [];

  const checks = await Promise.all(
    users.map((candidate) =>
      checkPermission(candidate, "dashboard", "reimbursement-management", "READ")
    )
  );

  const recipients = new Set(accountantIds);
  users.forEach((candidate, index) => {
    if (checks[index]) recipients.add(candidate.id);
  });

  if (user.role?.name === "FELLOW") {
    const fellowId = await getFellowIdByUserId(user.id);
    const programStaffIds = (await getProgramStaffForFellow(fellowId)).filter(
      (id) => !admins.includes(id) && !recipients.has(id)
    );
    const programStaff = programStaffIds.length
      ? await prisma.user.findMany({
          where: { id: { in: programStaffIds }, status: "ACTIVE" },
          include: { role: true },
        })
      : [];
    const programChecks = await Promise.all(
      programStaff.map((candidate) =>
        checkPermission(candidate, "dashboard", "reimbursement-management", "READ")
      )
    );
    programStaff.forEach((candidate, index) => {
      if (programChecks[index]) recipients.add(candidate.id);
    });
  }

  recipients.delete(user.id);
  if (!recipients.size) return admins;
  return [...recipients];
}

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

      where = await getReimbursementManagementWhere(user);
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

    const recipients = await getReimbursementReviewerUserIds(user);

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
