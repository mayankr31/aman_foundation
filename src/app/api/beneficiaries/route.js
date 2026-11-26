import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedSchoolIds, isFieldScopedRole, isLivelihoodProgramManaged } from "@/lib/scope";
import { buildResilienceSurveyCreateData } from "@/lib/resilienceSurvey";
import { checkPermission } from "@/lib/permissions";
import { computeCapacityScore } from "@/lib/capacityDictionaries";
import {
  validatePersonName,
  validateMobile,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateRationCard,
  validateBankAccount,
  validateIfsc,
  validateAmount,
  validateInteger,
  validateDateNotFuture,
  firstError,
  normalizeMobileForSave,
  normalizeAadhaarForSave,
  normalizePanForSave,
  normalizeVoterIdForSave,
  normalizeRationCardForSave,
  normalizeBankAccountForSave,
  normalizeIfscForSave,
} from "@/lib/validation";
import { isProgramStaffRole } from "@/lib/roles";


// Resilience Index = average of the latest Adaptive, Absorptive and
// Transformative capacity scores. Returns null until all three exist.
function computeResilienceIndex(beneficiary) {
  const adaptive = beneficiary.adaptiveCapacitySurveys?.[0]?.responses;
  const absorptive = beneficiary.absorptiveCapacitySurveys?.[0]?.responses;
  const transformative = beneficiary.transformativeSurveys?.[0]?.responses;

  const adaptivePct = adaptive ? computeCapacityScore("adaptive", adaptive) : null;
  const absorptivePct = absorptive ? computeCapacityScore("absorptive", absorptive) : null;
  const transformativePct = transformative ? computeCapacityScore("transformative", transformative) : null;

  if (adaptivePct === null || absorptivePct === null || transformativePct === null) return null;
  return Math.round((adaptivePct + absorptivePct + transformativePct) / 3);
}

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "READ"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier");
    const location = searchParams.get("location");

    const where = {};
    if (tier && tier !== "All Tiers") where.tier = tier;
    if (location && location !== "All Locations") {
      where.address = {
        contains: location,
        mode: "insensitive"
      };
    }
    if (isProgramStaffRole(user?.role?.name)) {
      where.livelihoodDetails = {
        some: { program: { programManagers: { some: { userId: user.id } } } },
      };
    } else if (user.role.name === "FELLOW") {
      where.livelihoodDetails = {
        some: { program: { fellows: { some: { fellow: { userId: user.id } } } } },
      };
    }

    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      include: {
        schemeEnrollments: {
          include: {
            scheme: true
          }
        },
        goatRearingDetails: {
          include: {
            goatRearingProgram: true
          }
        },
        sugarcaneDetails: {
          include: {
            sugarcaneProgram: true
          }
        },
        livelihoodDetails: {
          include: {
            program: {
              include: { components: { orderBy: { order: "asc" } } },
            },
          }
        },
        adaptiveCapacitySurveys: {
          take: 1,
          orderBy: { surveyDate: "desc" },
          select: { responses: true },
        },
        absorptiveCapacitySurveys: {
          take: 1,
          orderBy: { surveyDate: "desc" },
          select: { responses: true },
        },
        transformativeSurveys: {
          take: 1,
          orderBy: { surveyDate: "desc" },
          select: { responses: true },
        },
        _count: {
          select: { familyMembers: true, livestock: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const data = beneficiaries.map((beneficiary) => {
      const payload = { ...beneficiary, resilienceIndex: computeResilienceIndex(beneficiary) };
      delete payload.adaptiveCapacitySurveys;
      delete payload.absorptiveCapacitySurveys;
      delete payload.transformativeSurveys;
      return payload;
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch beneficiaries error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function canLinkStudent(user, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true },
  });
  if (!student) return false;

  if (user.role.name === "ADMIN") return true;

  if (user.role.name === "FELLOW") {
    if (!student.schoolId) return false;
    const assigned = await prisma.fellowSchool.findFirst({
      where: {
        schoolId: student.schoolId,
        fellow: { userId: user.id },
      },
      select: { id: true },
    });
    return Boolean(assigned);
  }

  // Field-scoped program staff may link students from schools they manage;
  // unrestricted roles are governed solely by their page permissions.
  if (!isFieldScopedRole(user)) return true;
  if (!student.schoolId) return false;

  const managed = await getManagedSchoolIds(user.id);
  return managed.includes(student.schoolId);
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const {
      enrolmentId,
      name,
      dob,
      panCard,
      aadhar,
      voterId,
      rationCard,
      mobNumber,
      emergencyContact,
      gender,
      resilienceScore,
      annualIncome,
      monthlyIncome,
      caste,
      religion,
      address,
      landmark,
      state,
      district,
      block,
      ward,
      village,
      householdSize,
      primaryIncomeType,
      tier,
      bankName,
      bankAccountNo,
      bankIfsc,
      schemes,
      programId,
      attributes,
      studentId,
      resilienceSurvey,
    } = body;

    // Adding a participant is permission-based: Livelihood/participants WRITE
    // grants access to any role. Education staff may also add a student's
    // parents from the student detail page even without Livelihood write
    // access; the beneficiary is linked to that student, which grants read-only
    // profile access. School scoping is enforced by canLinkStudent below.
    const hasLivelihoodWrite = await checkPermission(user, "dashboard", "livelihood", "WRITE");
    if (!hasLivelihoodWrite) {
      const canWriteEducation = await checkPermission(user, "dashboard", "education", "WRITE");
      if (!studentId || !canWriteEducation) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions to add participants" }, { status: 403 });
      }
    }

    if (studentId && !(await canLinkStudent(user, studentId))) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this student's school" }, { status: 403 });
    }

    if (!name || !enrolmentId) {
      return NextResponse.json({ error: "Name and Enrolment ID are required" }, { status: 400 });
    }

    const validationMessage = firstError([
      validatePersonName(name, { required: true }),
      dob ? validateDateNotFuture(dob, { label: "Date of birth" }) : null,
      validateMobile(mobNumber),
      validateMobile(emergencyContact),
      validateAadhaar(aadhar),
      validatePan(panCard),
      validateVoterId(voterId),
      validateRationCard(rationCard),
      validateBankAccount(bankAccountNo),
      validateIfsc(bankIfsc),
      validateAmount(monthlyIncome, { min: 0 }),
      validateInteger(householdSize, { min: 1, max: 20 }),
    ]);
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    if (isFieldScopedRole(user)) {
      if (programId && !(await isLivelihoodProgramManaged(user.id, programId))) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
      }
    }

    const resilienceSurveyCreate = buildResilienceSurveyCreateData(resilienceSurvey);

    // Enrol the participant in the program's primary component. Additional
    // components can be added later from the program detail page.
    let primaryTypeKey = null;
    if (programId) {
      const program = await prisma.livelihoodProgram.findUnique({
        where: { id: programId },
        select: { type: true },
      });
      primaryTypeKey = program?.type || null;
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        enrolmentId,
        name,
        dob: dob ? new Date(dob) : null,
        panCard: normalizePanForSave(panCard),
        aadhar: normalizeAadhaarForSave(aadhar),
        voterId: normalizeVoterIdForSave(voterId),
        rationCard: normalizeRationCardForSave(rationCard),
        mobNumber: normalizeMobileForSave(mobNumber),
        emergencyContact: normalizeMobileForSave(emergencyContact),
        gender,
        resilienceScore: resilienceScore ? parseInt(resilienceScore) : 50,
        annualIncome: annualIncome ? parseFloat(annualIncome) : null,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        caste,
        religion,
        address,
        landmark,
        state,
        district,
        block,
        ward,
        village,
        householdSize: householdSize ? parseInt(householdSize) : 4,
        primaryIncomeType,
        tier: tier || "Tier 2",
        bankName,
        bankAccountNo: normalizeBankAccountForSave(bankAccountNo),
        bankIfsc: normalizeIfscForSave(bankIfsc),
        schemeEnrollments: schemes && schemes.length > 0 ? {
          create: await Promise.all(schemes.map(async (nameOrId) => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
            if (isUuid) {
              return { scheme: { connect: { id: nameOrId } } };
            } else {
              const schemeObj = await prisma.scheme.findFirst({
                where: { name: { equals: nameOrId, mode: "insensitive" } }
              });
              if (schemeObj) {
                return { scheme: { connect: { id: schemeObj.id } } };
              }
              // If not found, create or ignore
              return { scheme: { create: { name: nameOrId } } };
            }
          }))
        } : undefined,
        livelihoodDetails: programId ? {
          create: { programId, typeKey: primaryTypeKey, attributes: attributes || {} }
        } : undefined,
        students: studentId ? {
          connect: { id: studentId }
        } : undefined,
        resilienceSurveys: resilienceSurveyCreate ? {
          create: resilienceSurveyCreate
        } : undefined
      }
    });

    return NextResponse.json({ success: true, data: beneficiary }, { status: 201 });
  } catch (error) {
    console.error("Create beneficiary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
