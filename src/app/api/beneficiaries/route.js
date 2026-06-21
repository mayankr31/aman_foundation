import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

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

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
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
      resilienceScore,
      annualIncome,
      monthlyIncome,
      caste,
      religion,
      address,
      householdSize,
      primaryIncomeType,
      tier,
      tierPercent,
      bankName,
      bankAccountNo,
      bankIfsc,
      schemes
    } = body;

    if (!name || !enrolmentId) {
      return NextResponse.json({ error: "Name and Enrolment ID are required" }, { status: 400 });
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
        resilienceScore: resilienceScore ? parseInt(resilienceScore) : 50,
        annualIncome: annualIncome ? parseFloat(annualIncome) : null,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        caste,
        religion,
        address,
        householdSize: householdSize ? parseInt(householdSize) : 4,
        primaryIncomeType,
        tier: tier || "Tier 2",
        tierPercent: tierPercent ? parseInt(tierPercent) : 50,
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
        } : undefined
      }
    });

    return NextResponse.json({ success: true, data: beneficiary }, { status: 201 });
  } catch (error) {
    console.error("Create beneficiary error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
