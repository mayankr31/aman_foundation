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

    const migrationRecords = await prisma.migrationRecord.findMany({
      where: { beneficiaryId },
      orderBy: { migrationDate: "desc" }
    });

    return NextResponse.json({ success: true, data: migrationRecords });
  } catch (error) {
    console.error("Fetch migration records error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const body = await req.json();
    const { migrationType, destination, migrationDate, expectedReturnDate, actualReturnDate, notes } = body;

    const record = await prisma.migrationRecord.create({
      data: {
        beneficiaryId,
        migrationType: migrationType || "PERMANENT",
        destination,
        migrationDate: new Date(migrationDate),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : null,
        notes: notes || null
      }
    });

    const linkedStudents = await prisma.student.findMany({
      where: { beneficiaryId }
    });

    if (linkedStudents.length > 0) {
      const shouldMarkMigrated = !(actualReturnDate && record.migrationType === "SEASONAL");
      await prisma.student.updateMany({
        where: { beneficiaryId },
        data: { isMigrated: shouldMarkMigrated }
      });
    }

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Create migration record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const body = await req.json();
    const { migrationId, migrationType, destination, migrationDate, expectedReturnDate, actualReturnDate, notes } = body;

    if (!migrationId) {
      return NextResponse.json({ error: "migrationId is required" }, { status: 400 });
    }

    const existing = await prisma.migrationRecord.findUnique({
      where: { id: migrationId }
    });

    if (!existing || existing.beneficiaryId !== beneficiaryId) {
      return NextResponse.json({ error: "Migration record not found" }, { status: 404 });
    }

    const updated = await prisma.migrationRecord.update({
      where: { id: migrationId },
      data: {
        migrationType: migrationType || existing.migrationType,
        destination: destination !== undefined ? destination : existing.destination,
        migrationDate: migrationDate ? new Date(migrationDate) : existing.migrationDate,
        expectedReturnDate: expectedReturnDate !== undefined ? (expectedReturnDate ? new Date(expectedReturnDate) : null) : existing.expectedReturnDate,
        actualReturnDate: actualReturnDate !== undefined ? (actualReturnDate ? new Date(actualReturnDate) : null) : existing.actualReturnDate,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    const linkedStudents = await prisma.student.findMany({
      where: { beneficiaryId }
    });

    if (linkedStudents.length > 0) {
      const resolvedMigrationType = migrationType || existing.migrationType;
      const hadReturnDate = !!existing.actualReturnDate;
      const hasReturnDate = !!(actualReturnDate !== undefined ? actualReturnDate : existing.actualReturnDate);

      if (hadReturnDate && !hasReturnDate && resolvedMigrationType === "SEASONAL") {
        await prisma.student.updateMany({
          where: { beneficiaryId },
          data: { isMigrated: true }
        });
      } else if (!hadReturnDate && hasReturnDate && resolvedMigrationType === "SEASONAL") {
        await prisma.student.updateMany({
          where: { beneficiaryId },
          data: { isMigrated: false }
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update migration record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const body = await req.json();
    const { migrationId } = body;

    if (!migrationId) {
      return NextResponse.json({ error: "migrationId is required" }, { status: 400 });
    }

    const existing = await prisma.migrationRecord.findUnique({
      where: { id: migrationId }
    });

    if (!existing || existing.beneficiaryId !== beneficiaryId) {
      return NextResponse.json({ error: "Migration record not found" }, { status: 404 });
    }

    await prisma.migrationRecord.delete({
      where: { id: migrationId }
    });

    return NextResponse.json({ success: true, message: "Migration record deleted successfully" });
  } catch (error) {
    console.error("Delete migration record error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
