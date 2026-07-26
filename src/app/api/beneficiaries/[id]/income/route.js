import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

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

export async function GET(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const incomeRecords = await prisma.incomeRecord.findMany({
      where: { beneficiaryId },
      orderBy: { incomeDate: "desc" }
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

    const allowedRoles = ["ADMIN", "FELLOW"];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access required" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount, incomeDate, source, notes } = body;

    if (!amount || !incomeDate) {
      return NextResponse.json({ error: "amount and incomeDate are required" }, { status: 400 });
    }

    const record = await prisma.incomeRecord.create({
      data: {
        beneficiaryId,
        amount: parseFloat(amount),
        incomeDate: new Date(incomeDate),
        source: source || null,
        notes: notes || null
      }
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Create income record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const allowedRoles = ["ADMIN", "FELLOW"];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access required" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
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
