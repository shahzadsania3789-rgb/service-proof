import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";

export async function GET() {
  try {
    const user = await requirePermission("evidence.verify");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not assigned to an organization" },
        { status: 400 }
      );
    }

    const evidence = await prisma.evidence.findMany({
      where: {
        serviceJob: {
          organizationId: user.organizationId,
          status: "EVIDENCE_SUBMITTED",
        },
        verifications: { none: {} },
      },

      include: {
        serviceJob: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            status: true,
          },
        },

        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        verifications: {
          orderBy: {
            createdAt: "desc",
          },

          include: {
            reviewedBy: {
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
        createdAt: "asc",
      },
    });

    return NextResponse.json(evidence);
  } catch (error) {
    console.error("Pending evidence error:", error);

    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(
      {
        error: "Unable to load pending evidence. Please try again.",
      },
      { status: 500 }
    );
  }
}