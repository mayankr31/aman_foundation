import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN" && user.role.name !== "PROGRAM_MANAGER" && user.role.name !== "FELLOW") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, id } = await params;
    const body = await req.json();
    const { beneficiaryId, assignment } = body;

    if (!beneficiaryId || !assignment) {
      return NextResponse.json({ error: "Beneficiary ID and assignment details are required" }, { status: 400 });
    }

    if (type === "sugarcane") {
      // Check if assignment exists for this beneficiary and program
      const existing = await prisma.beneficiarySugarcane.findFirst({
        where: { beneficiaryId, sugarcaneProgramId: id }
      });

      if (existing) {
        // Update
        const updated = await prisma.beneficiarySugarcane.update({
          where: { id: existing.id },
          data: {
            hectaresAllotted: parseFloat(assignment.hectaresAllotted || 0),
            soilType: assignment.soilType,
            waterSource: assignment.waterSource,
            cropStage: assignment.cropStage || "Planting",
            estimatedYieldTons: parseFloat(assignment.estimatedYieldTons || 0),
            actualYieldTons: assignment.actualYieldTons !== undefined && assignment.actualYieldTons !== null && assignment.actualYieldTons !== "" ? parseFloat(assignment.actualYieldTons) : null,
            fertilizersDistributed: assignment.fertilizersDistributed,
            estimatedRevenue: assignment.estimatedRevenue !== undefined && assignment.estimatedRevenue !== null && assignment.estimatedRevenue !== "" ? parseFloat(assignment.estimatedRevenue) : null,
            actualRevenue: assignment.actualRevenue !== undefined && assignment.actualRevenue !== null && assignment.actualRevenue !== "" ? parseFloat(assignment.actualRevenue) : null,
          }
        });
        return NextResponse.json({ success: true, data: updated });
      } else {
        // Create
        const created = await prisma.beneficiarySugarcane.create({
          data: {
            beneficiaryId,
            sugarcaneProgramId: id,
            hectaresAllotted: parseFloat(assignment.hectaresAllotted || 0),
            soilType: assignment.soilType,
            waterSource: assignment.waterSource,
            cropStage: assignment.cropStage || "Planting",
            estimatedYieldTons: parseFloat(assignment.estimatedYieldTons || 0),
            actualYieldTons: assignment.actualYieldTons !== undefined && assignment.actualYieldTons !== null && assignment.actualYieldTons !== "" ? parseFloat(assignment.actualYieldTons) : null,
            fertilizersDistributed: assignment.fertilizersDistributed,
            estimatedRevenue: assignment.estimatedRevenue !== undefined && assignment.estimatedRevenue !== null && assignment.estimatedRevenue !== "" ? parseFloat(assignment.estimatedRevenue) : null,
            actualRevenue: assignment.actualRevenue !== undefined && assignment.actualRevenue !== null && assignment.actualRevenue !== "" ? parseFloat(assignment.actualRevenue) : null,
          }
        });

        // Ensure scheme enrollment exists
        const schemeObj = await prisma.scheme.findFirst({ where: { name: { equals: "Sugarcane", mode: "insensitive" } } });
        if (schemeObj) {
          await prisma.schemeEnrollment.upsert({
            where: { beneficiaryId_schemeId: { beneficiaryId, schemeId: schemeObj.id } },
            update: {},
            create: { beneficiaryId, schemeId: schemeObj.id }
          });
        }
        return NextResponse.json({ success: true, data: created });
      }
    } else if (type === "goat-rearing" || type === "goat") {
      const existing = await prisma.beneficiaryGoatRearing.findFirst({
        where: { beneficiaryId, goatRearingProgramId: id }
      });

      if (existing) {
        const updated = await prisma.beneficiaryGoatRearing.update({
          where: { id: existing.id },
          data: {
            goatsAssigned: parseInt(assignment.goatsAssigned || 0),
            investment: assignment.investment !== undefined && assignment.investment !== null && assignment.investment !== "" ? parseFloat(assignment.investment) : null,
            returnsAmount: assignment.returnsAmount !== undefined && assignment.returnsAmount !== null && assignment.returnsAmount !== "" ? parseFloat(assignment.returnsAmount) : null,
            roiPercentage: assignment.roiPercentage !== undefined && assignment.roiPercentage !== null && assignment.roiPercentage !== "" ? parseFloat(assignment.roiPercentage) : null,
            advantagesLog: assignment.advantagesLog,
            notes: assignment.notes,
          }
        });
        return NextResponse.json({ success: true, data: updated });
      } else {
        const created = await prisma.beneficiaryGoatRearing.create({
          data: {
            beneficiaryId,
            goatRearingProgramId: id,
            goatsAssigned: parseInt(assignment.goatsAssigned || 0),
            investment: assignment.investment !== undefined && assignment.investment !== null && assignment.investment !== "" ? parseFloat(assignment.investment) : null,
            returnsAmount: assignment.returnsAmount !== undefined && assignment.returnsAmount !== null && assignment.returnsAmount !== "" ? parseFloat(assignment.returnsAmount) : null,
            roiPercentage: assignment.roiPercentage !== undefined && assignment.roiPercentage !== null && assignment.roiPercentage !== "" ? parseFloat(assignment.roiPercentage) : null,
            advantagesLog: assignment.advantagesLog,
            notes: assignment.notes,
          }
        });

        // Ensure scheme enrollment exists
        const schemeObj = await prisma.scheme.findFirst({ where: { name: { equals: "Goat Rearing", mode: "insensitive" } } });
        if (schemeObj) {
          await prisma.schemeEnrollment.upsert({
            where: { beneficiaryId_schemeId: { beneficiaryId, schemeId: schemeObj.id } },
            update: {},
            create: { beneficiaryId, schemeId: schemeObj.id }
          });
        }
        return NextResponse.json({ success: true, data: created });
      }
    } else {
      return NextResponse.json({ error: "Invalid program type" }, { status: 400 });
    }
  } catch (error) {
    console.error(`Create/Update assignment error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
