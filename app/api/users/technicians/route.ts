import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requirePermission("jobs.assign");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization." },
        { status: 400 }
      );
    }

    const technicians = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: "TECHNICIAN",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      technicians,
    });
  } catch (error) {
    console.error("Get technicians error:", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "Forbidden"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}