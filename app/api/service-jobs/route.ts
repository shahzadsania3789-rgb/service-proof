import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("jobs.create");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization." },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;

    const title = typeof input.title === "string" ? input.title.trim() : "";
    const description = typeof input.description === "string" ? input.description.trim() || null : null;
    const location = typeof input.location === "string" ? input.location.trim() || null : null;

    if (!title) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }

    const serviceJob = await prisma.serviceJob.create({
      data: {
        title,
        description,
        location,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "JOB_CREATED",
      entityType: "SERVICE_JOB",
      entityId: serviceJob.id,
      description: `Created service job: ${serviceJob.title}`,
      metadata: { status: serviceJob.status },
    });

    return NextResponse.json(
      {
        message: "Service job created successfully.",
        serviceJob,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create service job error:", error);

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

export async function GET() {
  try {
    const user = await requirePermission("jobs.view");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization." },
        { status: 400 }
      );
    }

    const serviceJobs = await prisma.serviceJob.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        assignments: {
          include: {
            technician: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      serviceJobs,
    });
  } catch (error) {
    console.error("Get service jobs error:", error);

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