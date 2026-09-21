import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id: beneficiaryId } = await params;

  try {
    const plans = await prisma.solutionPlan.findMany({
      where: { beneficiaryId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Error fetching solution plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch solution plans" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { id: beneficiaryId } = await params;

  try {
    const body = await req.json();
    const { planData } = body;

    const plan = await prisma.solutionPlan.create({
      data: {
        beneficiaryId,
        planData,
      },
    });

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    console.error("Error creating solution plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create solution plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const { id: beneficiaryId } = await params;

  try {
    const body = await req.json();
    const { planId, planData } = body;

    if (!planId || !planData) {
      return NextResponse.json(
        { success: false, error: "planId and planData are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.solutionPlan.findFirst({
      where: { id: planId, beneficiaryId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Solution plan not found" },
        { status: 404 }
      );
    }

    const plan = await prisma.solutionPlan.update({
      where: { id: planId },
      data: { planData }
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error("Error updating solution plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update solution plan" },
      { status: 500 }
    );
  }
}
