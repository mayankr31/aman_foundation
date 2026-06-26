import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveBeneficiaryId(id) {
  if (!id || id === "undefined" || id === "null") return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  // 1. Try to find by enrolmentId (case-insensitive)
  const byEnrolment = await prisma.beneficiary.findFirst({
    where: { enrolmentId: { equals: id, mode: "insensitive" } }
  });
  if (byEnrolment) return byEnrolment.id;

  // 2. Try to find by name-based slug (casing and hyphen-insensitive)
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
    if (error) {
      console.log("GET beneficiary auth error:", error);
      return error;
    }

    const { id } = await params;
    console.log("GET beneficiary request for id:", id);
    const beneficiaryId = await resolveBeneficiaryId(id);
    console.log("GET beneficiary resolved id:", beneficiaryId);

    if (!beneficiaryId) {
      console.log("GET beneficiary not found in DB for name/id:", id);
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      include: {
        familyMembers: true,
        livestock: {
          include: {
            healthLogs: {
              orderBy: { checkupDate: "desc" }
            }
          }
        },
        schemeEnrollments: {
          include: {
            scheme: true
          }
        },
        goatRearingDetails: {
          include: {
            goatRearingProgram: true,
            events: {
              orderBy: { eventDate: "desc" }
            }
          }
        },
        sugarcaneDetails: {
          include: {
            sugarcaneProgram: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: beneficiary });
  } catch (error) {
    console.error("Fetch beneficiary detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access only" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update main Beneficiary details
      const updated = await tx.beneficiary.update({
        where: { id: beneficiaryId },
        data: {
          enrolmentId: body.enrolmentId,
          name: body.name,
          dob: body.dob ? new Date(body.dob) : null,
          panCard: body.panCard,
          aadhar: body.aadhar,
          rationCard: body.rationCard,
          mobNumber: body.mobNumber,
          resilienceScore: body.resilienceScore !== undefined ? parseInt(body.resilienceScore) : undefined,
          annualIncome: body.annualIncome !== undefined ? parseFloat(body.annualIncome) : null,
          monthlyIncome: body.monthlyIncome !== undefined ? parseFloat(body.monthlyIncome) : null,
          caste: body.caste,
          religion: body.religion,
          address: body.address,
          householdSize: body.householdSize !== undefined ? parseInt(body.householdSize) : undefined,
          primaryIncomeType: body.primaryIncomeType,
          tier: body.tier,
          tierPercent: body.tierPercent !== undefined ? parseInt(body.tierPercent) : undefined,
          bankName: body.bankName,
          bankAccountNo: body.bankAccountNo,
          bankIfsc: body.bankIfsc,
          isMigrated: body.isMigrated !== undefined ? Boolean(body.isMigrated) : undefined
        }
      });

      // 1.5 Update Scheme Enrollments if provided
      if (body.schemes) {
        await tx.schemeEnrollment.deleteMany({ where: { beneficiaryId } });
        for (const nameOrId of body.schemes) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
          if (isUuid) {
            await tx.schemeEnrollment.create({
              data: { beneficiaryId, schemeId: nameOrId }
            });
          } else {
            const schemeObj = await tx.scheme.findFirst({
              where: { name: { equals: nameOrId, mode: "insensitive" } }
            });
            if (schemeObj) {
              await tx.schemeEnrollment.create({
                data: { beneficiaryId, schemeId: schemeObj.id }
              });
            } else {
              const newScheme = await tx.scheme.create({
                data: { name: nameOrId }
              });
              await tx.schemeEnrollment.create({
                data: { beneficiaryId, schemeId: newScheme.id }
              });
            }
          }
        }
      }

      // 2. Nested Family Members Update
      if (body.familyMembers) {
        await tx.familyMember.deleteMany({ where: { beneficiaryId } });
        if (body.familyMembers.length > 0) {
          await tx.familyMember.createMany({
            data: body.familyMembers.map(m => ({
              beneficiaryId,
              name: m.name,
              relation: m.relation,
              dob: m.dob ? new Date(m.dob) : null,
              contactInfo: m.contactInfo
            }))
          });
        }
      }

      // 3. Nested Livestock Update
      if (body.livestock) {
        await tx.livestock.deleteMany({ where: { beneficiaryId } });
        if (body.livestock.length > 0) {
          await tx.livestock.createMany({
            data: body.livestock.map(l => ({
              beneficiaryId,
              tagNumber: l.tagNumber,
              animalType: l.animalType,
              breed: l.breed || null,
              ageMonths: l.ageMonths ? parseInt(l.ageMonths) : null,
              healthStatus: l.healthStatus || "Healthy"
            }))
          });
        }
      }

      // Assignments are managed individually via the Program Detail pages and their specific assignment API endpoints.

      return updated;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Update beneficiary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden: Admin or Fellow access only" }, { status: 403 });
    }

    const { id } = await params;
    const beneficiaryId = await resolveBeneficiaryId(id);

    if (!beneficiaryId) {
      return NextResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated details (one-to-one)
      await tx.beneficiaryGoatRearing.deleteMany({
        where: { beneficiaryId }
      });
      await tx.beneficiarySugarcane.deleteMany({
        where: { beneficiaryId }
      });

      // 2. Delete livestock details
      await tx.livestock.deleteMany({
        where: { beneficiaryId }
      });

      // 3. Delete family members
      await tx.familyMember.deleteMany({
        where: { beneficiaryId }
      });

      // 4. Delete scheme enrollments
      await tx.schemeEnrollment.deleteMany({
        where: { beneficiaryId }
      });

      // 5. Delete beneficiary record
      await tx.beneficiary.delete({
        where: { id: beneficiaryId }
      });
    });

    return NextResponse.json({ success: true, message: "Beneficiary profile deleted successfully" });
  } catch (error) {
    console.error("Delete beneficiary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
