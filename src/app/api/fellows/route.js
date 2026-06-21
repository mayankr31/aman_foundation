import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    const fellows = await prisma.fellow.findMany({
      include: {
        schools: {
          include: { school: { select: { id: true, name: true, location: true } } }
        },
        goals: {
          include: {
            milestones: true
          }
        },
        _count: {
          select: { students: true, goals: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const mappedFellows = fellows.map((f) => {
      const milestones = f.goals.flatMap(g => g.milestones.map(m => ({
        done: m.done,
        text: m.text
      }))).slice(0, 2);

      return {
        id: f.id,
        name: f.name,
        cohort: f.cohort,
        avatar: f.avatar,
        email: f.email,
        phone: f.phone,
        location: f.address || (f.schools?.[0]?.school?.location || "Kalgachia"),
        schools: (f.schools || []).map(fs => fs.school),
        progress: f.progress,
        milestones: milestones.length > 0 ? milestones : [
          { done: true, text: "Placement Setup" },
          { done: false, text: "Pending Review" }
        ],
        lastUpdated: "Just now"
      };
    });

    return NextResponse.json({ success: true, data: mappedFellows });
  } catch (error) {
    console.error("Fetch fellows error:", error);
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
      name,
      dob,
      gender,
      email,
      phone,
      address,
      cohort,
      avatar,
      progress,
      evaluationRating,
      schoolId,
      userId
    } = body;

    if (!name || !cohort) {
      return NextResponse.json({ error: "Name and Cohort are required" }, { status: 400 });
    }

    const fellow = await prisma.fellow.create({
      data: {
        name,
        dob: dob ? new Date(dob) : null,
        gender,
        email,
        phone,
        address,
        cohort,
        avatar,
        progress: progress ? parseInt(progress) : 0,
        evaluationRating: evaluationRating ? parseFloat(evaluationRating) : null,
        userId
      }
    });

    return NextResponse.json({ success: true, data: fellow }, { status: 201 });
  } catch (error) {
    console.error("Create fellow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
