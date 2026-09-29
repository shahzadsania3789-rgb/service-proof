import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization." },
        { status: 400 }
      );
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        technicianId: user.id,
        serviceJob: {
          organizationId: user.organizationId,
        },
      },
      include: {
        serviceJob: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return NextResponse.json({
      assignments,
    });
  } catch (error) {
    console.error("Get my jobs error:", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}