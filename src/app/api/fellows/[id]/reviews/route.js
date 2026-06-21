import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";

async function resolveFellowId(id) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;

  const name = decodeURIComponent(id).replace(/-/g, " ");
  const fellow = await prisma.fellow.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });
  return fellow ? fellow.id : null;
}

export async function POST(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const body = await req.json();
    const { period, evaluation, rating, reviewerName } = body;

    if (!period || !evaluation || !reviewerName) {
      return NextResponse.json({ error: "Period, evaluation, and reviewerName are required" }, { status: 400 });
    }

    const newReview = await prisma.fellowReview.create({
      data: {
        fellowId,
        period,
        evaluation,
        rating: rating ? parseFloat(rating) : null,
        reviewerName,
        status: "Completed"
      }
    });

    // Update the fellow's evaluation rating
    if (rating) {
      const allReviews = await prisma.fellowReview.findMany({
        where: { fellowId, rating: { not: null } }
      });
      const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      await prisma.fellow.update({
        where: { id: fellowId },
        data: { evaluationRating: parseFloat(avgRating.toFixed(1)) }
      });
    }

    return NextResponse.json({ success: true, data: newReview }, { status: 201 });
  } catch (err) {
    console.error("Create review error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const { user, error } = await authenticateUser(req);
    if (error) return error;

    if (user.role.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const { id } = await context.params;
    const fellowId = await resolveFellowId(id);
    if (!fellowId) {
      return NextResponse.json({ error: "Fellow not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    await prisma.fellowReview.delete({
      where: { id: reviewId }
    });

    // Update the fellow's evaluation rating
    const allReviews = await prisma.fellowReview.findMany({
      where: { fellowId, rating: { not: null } }
    });
    
    let avgRating = null;
    if (allReviews.length > 0) {
      avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      avgRating = parseFloat(avgRating.toFixed(1));
    }
    
    await prisma.fellow.update({
      where: { id: fellowId },
      data: { evaluationRating: avgRating }
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete review error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
