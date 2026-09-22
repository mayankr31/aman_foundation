import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { getManagedSchoolIds, getManagedCentreIds } from "@/lib/scope";

export async function GET(req) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    let where;
    if (user.role.name === "PROGRAM_MANAGER") {
      const [schoolIds, centreIds] = await Promise.all([
        getManagedSchoolIds(user.id),
        getManagedCentreIds(user.id),
      ]);
      const or = [];
      if (schoolIds.length) or.push({ schools: { some: { schoolId: { in: schoolIds } } } });
      if (centreIds.length) or.push({ afterSchoolCentres: { some: { centreId: { in: centreIds } } } });
      where = { OR: or };
      if (!or.length) where = { id: { in: [] } };
    }

    const fellows = await prisma.fellow.findMany({
      where,
      include: {
        schools: {
          include: { school: { select: { id: true, name: true, location: true } } }
        },
        _count: {
          select: { students: true, goalSheets: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const mappedFellows = fellows.map((f) => {
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
        milestones: [
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

    const isAdmin = user.role.name === "ADMIN";
    const isPm = user.role.name === "PROGRAM_MANAGER";
    if (!isAdmin && !isPm) {
      return NextResponse.json({ error: "Forbidden: Admin or Program Manager access only" }, { status: 403 });
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
      centreId,
      schoolIds,
      centreIds,
      userId
    } = body;

    if (!name || !cohort) {
      return NextResponse.json({ error: "Name and Cohort are required" }, { status: 400 });
    }

    const targetSchoolIds = [...(Array.isArray(schoolIds) ? schoolIds : []), ...(schoolId ? [schoolId] : [])];
    const targetCentreIds = [...(Array.isArray(centreIds) ? centreIds : []), ...(centreId ? [centreId] : [])];

    if (isPm) {
      const [managedSchoolIds, managedCentreIds] = await Promise.all([
        getManagedSchoolIds(user.id),
        getManagedCentreIds(user.id),
      ]);
      const invalidSchool = targetSchoolIds.some((sid) => !managedSchoolIds.includes(sid));
      const invalidCentre = targetCentreIds.some((cid) => !managedCentreIds.includes(cid));
      if (invalidSchool || invalidCentre) {
        return NextResponse.json(
          { error: "Forbidden: You can only assign fellows to your schools or centres" },
          { status: 403 }
        );
      }
    }

    const fellow = await prisma.fellow.create({
      data: {
        name,
        dob: dob ? new Date(dob) : null,
        gender,
        email: email || null,
        phone,
        address,
        cohort,
        avatar,
        progress: progress ? parseInt(progress) : 0,
        evaluationRating: evaluationRating ? parseFloat(evaluationRating) : null,
        userId: userId || null
      }
    });

    for (const sid of [...new Set(targetSchoolIds)]) {
      await prisma.fellowSchool.upsert({
        where: { fellowId_schoolId: { fellowId: fellow.id, schoolId: sid } },
        update: {},
        create: { fellowId: fellow.id, schoolId: sid },
      });
    }
    for (const cid of [...new Set(targetCentreIds)]) {
      await prisma.fellowAfterSchoolCentre.upsert({
        where: { fellowId_centreId: { fellowId: fellow.id, centreId: cid } },
        update: {},
        create: { fellowId: fellow.id, centreId: cid },
      });
    }

    return NextResponse.json({ success: true, data: fellow }, { status: 201 });
  } catch (error) {
    console.error("Create fellow error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
