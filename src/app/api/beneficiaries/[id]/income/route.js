import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

async function canPmAccessBeneficiary(userId, beneficiaryId) {
  const row = await prisma.beneficiaryLivelihood.findFirst({
    where: { beneficiaryId, program: { programManagers: { some: { userId } } } },
    select: { id: true },
  });
  return !!row;
}

async function resolveBeneficiaryId(id) {
  if (!id || id === "undefined" || id === "null") return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const byEnrolment = await prisma.beneficiary.findFirst({
    where: { enrolmentId: { equals: id, mode: "insensitive" } }
  });
  if (byEnrolment) return byEnrolment.id;

  const decodedId = decodeURIComponent(id);
  const byNameDirect = await prisma.beneficiary.findFirst({
    where: { name: { equals: decodedId, mode: "insensitive" } }
  });
  if (byNameDirect) return byNameDirect.id;

  const name = decodedId.replace(/-/g, " ");
  const byName = await prisma.beneficiary.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  if (byName) return byName.id;

  return null;
}

function firstDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0, 0));
}

function parsePeriod(month, year) {
  const parsedMonth = Number.parseInt(month, 10);
  const parsedYear = Number.parseInt(year, 10);
  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) return null;
  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) return null;
  return { month: parsedMonth, year: parsedYear };
}

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const where = { beneficiaryId };

    if (yearParam) {
      const year = Number.parseInt(yearParam, 10);
      if (!Number.isInteger(year)) {
        return NextResponse.json({ error: "Invalid year filter" }, { status: 400 });
      }
      where.incomeYear = year;
    }

    const incomeRecords = await prisma.incomeRecord.findMany({
      where,
      orderBy: [{ incomeYear: "desc" }, { incomeMonth: "desc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({ success: true, data: incomeRecords });
  } catch (error) {
    console.error("Fetch income records error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const allowedRoles = ["ADMIN", "FELLOW", ...PROGRAM_ROLES];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin, Fellow or Program Manager access required" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    if (
      PROGRAM_ROLES.includes(user.role.name) &&
      !(await canPmAccessBeneficiary(user.id, beneficiaryId))
    ) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this beneficiary's program" }, { status: 403 });
    }

    const body = await req.json();
    const { amount, month, year, source, notes } = body;

    const period = parsePeriod(month, year);
    const numericAmount = Number.parseFloat(amount);
    if (!period) {
      return NextResponse.json({ error: "A valid month and year are required" }, { status: 400 });
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      return NextResponse.json({ error: "A valid income amount is required" }, { status: 400 });
    }

    const existing = await prisma.incomeRecord.findFirst({
      where: { beneficiaryId, incomeMonth: period.month, incomeYear: period.year },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An income entry already exists for this month. Edit the existing entry instead." },
        { status: 409 }
      );
    }

    const record = await prisma.incomeRecord.create({
      data: {
        beneficiaryId,
        amount: numericAmount,
        incomeDate: firstDayOfMonth(period.year, period.month),
        incomeMonth: period.month,
        incomeYear: period.year,
        source: source?.trim() || null,
        notes: notes?.trim() || null
      }
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An income entry already exists for this month. Edit the existing entry instead." },
        { status: 409 }
      );
    }
    console.error("Create income record error:", error);
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

    const allowedRoles = ["ADMIN", "FELLOW", ...PROGRAM_ROLES];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin, Fellow or Program Manager access required" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    if (
      PROGRAM_ROLES.includes(user.role.name) &&
      !(await canPmAccessBeneficiary(user.id, beneficiaryId))
    ) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this beneficiary's program" }, { status: 403 });
    }

    const body = await req.json();
    const { recordId, amount, month, year, source, notes } = body;

    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }

    const period = parsePeriod(month, year);
    const numericAmount = Number.parseFloat(amount);
    if (!period) {
      return NextResponse.json({ error: "A valid month and year are required" }, { status: 400 });
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      return NextResponse.json({ error: "A valid income amount is required" }, { status: 400 });
    }

    const existing = await prisma.incomeRecord.findUnique({ where: { id: recordId } });
    if (!existing || existing.beneficiaryId !== beneficiaryId) {
      return NextResponse.json({ error: "Income record not found" }, { status: 404 });
    }

    const conflict = await prisma.incomeRecord.findFirst({
      where: {
        beneficiaryId,
        incomeMonth: period.month,
        incomeYear: period.year,
        id: { not: recordId }
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Another income entry already exists for this month." },
        { status: 409 }
      );
    }

    const record = await prisma.incomeRecord.update({
      where: { id: recordId },
      data: {
        amount: numericAmount,
        incomeDate: firstDayOfMonth(period.year, period.month),
        incomeMonth: period.month,
        incomeYear: period.year,
        source: source?.trim() || null,
        notes: notes?.trim() || null
      }
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Another income entry already exists for this month." },
        { status: 409 }
      );
    }
    console.error("Update income record error:", error);
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

    const allowedRoles = ["ADMIN", "FELLOW", ...PROGRAM_ROLES];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin, Fellow or Program Manager access required" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    if (
      PROGRAM_ROLES.includes(user.role.name) &&
      !(await canPmAccessBeneficiary(user.id, beneficiaryId))
    ) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this beneficiary's program" }, { status: 403 });
    }

    const body = await req.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }

    const existing = await prisma.incomeRecord.findUnique({
      where: { id: recordId }
    });

    if (!existing || existing.beneficiaryId !== beneficiaryId) {
      return NextResponse.json({ error: "Income record not found" }, { status: 404 });
    }

    await prisma.incomeRecord.delete({
      where: { id: recordId }
    });

    return NextResponse.json({ success: true, message: "Income record deleted successfully" });
  } catch (error) {
    console.error("Delete income record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
