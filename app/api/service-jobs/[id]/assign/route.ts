import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await requirePermission("jobs.assign");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization." },
        { status: 400 }
      );
    }

    const { id: serviceJobId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const technicianId = body && typeof body === "object" && "technicianId" in body && typeof body.technicianId === "string"
      ? body.technicianId.trim()
      : "";

    if (!technicianId) {
      return NextResponse.json(
        { error: "Technician ID is required." },
        { status: 400 }
      );
    }

    const serviceJob = await prisma.serviceJob.findFirst({
      where: {
        id: serviceJobId,
        organizationId: user.organizationId,
      },
    });

    if (!serviceJob) {
      return NextResponse.json(
        { error: "Service job not found." },
        { status: 404 }
      );
    }

    if (serviceJob.status !== "DRAFT" && serviceJob.status !== "ASSIGNED") {
      return NextResponse.json({ error: "Technicians can only be assigned before work starts." }, { status: 409 });
    }

    const technician = await prisma.user.findFirst({
      where: {
        id: technicianId,
        organizationId: user.organizationId,
        role: "TECHNICIAN",
      },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found in your organization." },
        { status: 404 }
      );
    }

    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        serviceJobId_technicianId: {
          serviceJobId,
          technicianId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This technician is already assigned to this job." },
        { status: 409 }
      );
    }

    const assignment = await prisma.$transaction(async (transaction) => {
      const createdAssignment = await transaction.assignment.create({
        data: { serviceJobId, technicianId, status: "ASSIGNED" },
        include: {
          technician: { select: { id: true, name: true, email: true, role: true } },
          serviceJob: true,
        },
      });
      if (serviceJob.status === "DRAFT") {
        await transaction.serviceJob.update({ where: { id: serviceJobId }, data: { status: "ASSIGNED" } });
      }
      return createdAssignment;
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "JOB_ASSIGNED",
      entityType: "SERVICE_JOB",
      entityId: serviceJobId,
      description: `Assigned ${technician.name} to ${serviceJob.title}`,
      metadata: { assignmentId: assignment.id, technicianId },
    });

    return NextResponse.json(
      {
        message: "Technician assigned successfully.",
        assignment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assign technician error:", error);

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

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}