import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requirePermission("evidence.submit");
    if (!user.organizationId) {
      return NextResponse.json({ error: "Your account is not associated with an organization." }, { status: 400 });
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
    const type = input.type;
    const fileUrl = typeof input.fileUrl === "string" ? input.fileUrl.trim() || null : null;
    const fileName = typeof input.fileName === "string" ? input.fileName.trim() || null : null;
    const notes = typeof input.notes === "string" ? input.notes.trim() || null : null;
    const { id: serviceJobId } = await params;

    if (type !== "PHOTO" && type !== "DOCUMENT" && type !== "COMPLETION_NOTE") {
      return NextResponse.json({ error: "Invalid evidence type." }, { status: 400 });
    }
    if (type === "COMPLETION_NOTE" && !notes) {
      return NextResponse.json({ error: "Completion notes are required." }, { status: 400 });
    }
    if ((type === "PHOTO" || type === "DOCUMENT") && !fileUrl) {
      return NextResponse.json({ error: "File URL is required for this evidence type." }, { status: 400 });
    }

    const assignment = await prisma.assignment.findFirst({
      where: { serviceJobId, technicianId: user.id, serviceJob: { organizationId: user.organizationId } },
      include: { serviceJob: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: "You are not assigned to this job." }, { status: 403 });
    }
    if (assignment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Complete the job before submitting evidence." }, { status: 409 });
    }
    if (!["IN_PROGRESS", "CORRECTION_REQUIRED"].includes(assignment.serviceJob.status)) {
      return NextResponse.json({ error: "Evidence cannot be submitted while this job is in its current status." }, { status: 409 });
    }

    const evidence = await prisma.$transaction(async (transaction) => {
      const createdEvidence = await transaction.evidence.create({
        data: { serviceJobId, submittedById: user.id, type, fileUrl, fileName, notes },
      });
      await transaction.serviceJob.update({ where: { id: serviceJobId }, data: { status: "EVIDENCE_SUBMITTED" } });
      return createdEvidence;
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "EVIDENCE_SUBMITTED",
      entityType: "EVIDENCE",
      entityId: evidence.id,
      description: `Evidence submitted for ${assignment.serviceJob.title}`,
      metadata: { serviceJobId, type },
    });
    return NextResponse.json({ message: "Evidence submitted successfully.", evidence }, { status: 201 });
  } catch (error) {
    console.error("Submit evidence error:", error);
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to submit evidence. Please try again." }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requirePermission("evidence.submit");
    if (!user.organizationId) return NextResponse.json({ error: "Your account is not associated with an organization." }, { status: 400 });
    const { id: serviceJobId } = await params;
    const assignment = await prisma.assignment.findFirst({
      where: { serviceJobId, technicianId: user.id, serviceJob: { organizationId: user.organizationId } },
    });
    if (!assignment) return NextResponse.json({ error: "You are not assigned to this job." }, { status: 403 });
    const evidence = await prisma.evidence.findMany({
      where: { serviceJobId },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ evidence });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Get evidence error:", error);
    return NextResponse.json({ error: "Unable to load evidence. Please try again." }, { status: 500 });
  }
}