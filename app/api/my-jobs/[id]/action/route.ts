import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedTransitions = {
  ACCEPT: {
    from: "ASSIGNED",
    to: "ACCEPTED",
  },
  START: {
    from: "ACCEPTED",
    to: "IN_PROGRESS",
  },
  COMPLETE: {
    from: "IN_PROGRESS",
    to: "COMPLETED",
  },
} as const;

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await requirePermission("jobs.view");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization." },
        { status: 400 }
      );
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const action = body && typeof body === "object" && "action" in body ? body.action : undefined;

    if (
      action !== "ACCEPT" &&
      action !== "START" &&
      action !== "COMPLETE"
    ) {
      return NextResponse.json(
        { error: "Invalid action." },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        technicianId: user.id,
        serviceJob: {
          organizationId: user.organizationId,
        },
      },
      include: {
        serviceJob: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    const transition = allowedTransitions[action as keyof typeof allowedTransitions];

    if (assignment.status !== transition.from) {
      return NextResponse.json(
        {
          error: `Cannot ${action.toLowerCase()} this job from ${assignment.status} status.`,
        },
        { status: 409 }
      );
    }

    const { updatedAssignment, updatedJob } = await prisma.$transaction(async (transaction) => {
      const changedAssignment = await transaction.assignment.update({
        where: { id: assignment.id },
        data: { status: transition.to },
        include: { serviceJob: true },
      });
      const changedJob = action === "START"
        ? await transaction.serviceJob.update({ where: { id: assignment.serviceJobId }, data: { status: "IN_PROGRESS" } })
        : assignment.serviceJob;
      return { updatedAssignment: changedAssignment, updatedJob: changedJob };
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "JOB_UPDATED",
      entityType: "SERVICE_JOB",
      entityId: assignment.serviceJobId,
      description: `Assignment ${action.toLowerCase()}ed for ${assignment.serviceJob.title}`,
      metadata: { assignmentId: assignment.id, from: assignment.status, to: updatedAssignment.status },
    });

    if (action === "START" && updatedJob.status !== assignment.serviceJob.status) {
      await createAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: "JOB_STATUS_CHANGED",
        entityType: "SERVICE_JOB",
        entityId: updatedJob.id,
        description: `Service job started: ${updatedJob.title}`,
        metadata: { from: assignment.serviceJob.status, to: updatedJob.status },
      });
    }

    const actionLabels = { ACCEPT: "accepted", START: "started", COMPLETE: "completed" } as const;
    return NextResponse.json({
      message: `Job ${actionLabels[action]} successfully.`,
      assignment: updatedAssignment,
      serviceJob: updatedJob,
    });
  } catch (error) {
    console.error("Job action error:", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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