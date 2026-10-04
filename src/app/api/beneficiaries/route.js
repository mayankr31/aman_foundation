import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { isLivelihoodProgramManaged } from "@/lib/scope";
import { checkPermission } from "@/lib/permissions";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

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
    if (PROGRAM_ROLES.includes(user.role.name)) {
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
            program: true,
          }
        },
        _count: {
          select: { familyMembers: true, livestock: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: beneficiaries });
  } catch (error) {
    console.error("Fetch beneficiaries error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (!(await checkPermission(user, "dashboard", "livelihood", "WRITE"))) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for livelihood" }, { status: 403 });
    }

    if (
      user.role.name !== "ADMIN" &&
      user.role.name !== "FELLOW" &&
      !PROGRAM_ROLES.includes(user.role.name)
    ) {
      return NextResponse.json({ error: "Forbidden: Admin, Fellow or Program Manager access only" }, { status: 403 });
    }

    const body = await req.json();
    const {
      enrolmentId,
      name,
      dob,
      panCard,
      aadhar,
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
      attributes
    } = body;

    if (!name || !enrolmentId) {
      return NextResponse.json({ error: "Name and Enrolment ID are required" }, { status: 400 });
    }

    if (PROGRAM_ROLES.includes(user.role.name)) {
      if (programId && !(await isLivelihoodProgramManaged(user.id, programId))) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this program" }, { status: 403 });
      }
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        enrolmentId,
        name,
        dob: dob ? new Date(dob) : null,
        panCard,
        aadhar,
        rationCard,
        mobNumber,
        emergencyContact,
        gender,
        resilienceScore: resilienceScore ? parseInt(resilienceScore) : 50,
        annualIncome: annualIncome ? parseFloat(annualIncome) : null,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        caste,
        religion,
        address,
        state,
        district,
        block,
        ward,
        village,
        householdSize: householdSize ? parseInt(householdSize) : 4,
        primaryIncomeType,
        tier: tier || "Tier 2",
        bankName,
        bankAccountNo,
        bankIfsc,
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
          create: { programId, attributes: attributes || {} }
        } : undefined
      }
    });

    return NextResponse.json({ success: true, data: beneficiary }, { status: 201 });
  } catch (error) {
    console.error("Create beneficiary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
