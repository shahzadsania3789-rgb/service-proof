import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { createAuditLog } from "@/lib/audit";

const allowedStatuses = [
  "APPROVED",
  "REJECTED",
  "CORRECTION_REQUIRED",
] as const;

type VerificationStatus = (typeof allowedStatuses)[number];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("evidence.verify");

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not assigned to an organization" },
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
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const status = input.status as VerificationStatus;
    const comments =
      typeof input.comments === "string"
        ? input.comments.trim()
        : null;

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid verification status. Use APPROVED, REJECTED, or CORRECTION_REQUIRED.",
        },
        { status: 400 }
      );
    }

    if (
      (status === "REJECTED" ||
        status === "CORRECTION_REQUIRED") &&
      !comments
    ) {
      return NextResponse.json(
        {
          error:
            "Comments are required when rejecting or requesting correction.",
        },
        { status: 400 }
      );
    }

    const evidence = await prisma.evidence.findFirst({
      where: {
        id,
        serviceJob: {
          organizationId: user.organizationId,
        },
      },
      include: {
        serviceJob: true,
        verifications: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!evidence) {
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 }
      );
    }

    if (evidence.serviceJob.status !== "EVIDENCE_SUBMITTED" || evidence.verifications[0]?.status === "PENDING") {
      return NextResponse.json(
        {
          error:
            "This evidence is not currently waiting for verification.",
        },
        { status: 400 }
      );
    }

    let jobStatus:
      | "APPROVED"
      | "REJECTED"
      | "CORRECTION_REQUIRED";

    if (status === "APPROVED") {
      jobStatus = "APPROVED";
    } else if (status === "REJECTED") {
      jobStatus = "REJECTED";
    } else {
      jobStatus = "CORRECTION_REQUIRED";
    }

    const { verification } = await prisma.$transaction(async (transaction) => {
      const createdVerification = await transaction.evidenceVerification.create({
        data: { evidenceId: evidence.id, reviewedById: user.id, status, comments },
      });
      await transaction.serviceJob.update({ where: { id: evidence.serviceJobId }, data: { status: jobStatus } });
      return { verification: createdVerification };
    });

    const action = status === "APPROVED"
      ? "EVIDENCE_APPROVED"
      : status === "REJECTED"
        ? "EVIDENCE_REJECTED"
        : "EVIDENCE_CORRECTION_REQUIRED";
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action,
      entityType: "EVIDENCE",
      entityId: evidence.id,
      description: `Evidence ${status.toLowerCase().replaceAll("_", " ")} for ${evidence.serviceJob.title}`,
      metadata: { serviceJobId: evidence.serviceJobId, verificationId: verification.id, comments },
    });

    return NextResponse.json({
      message: "Evidence verification completed successfully",
      verification,
    });
  } catch (error) {
    console.error("Evidence verification error:", error);

    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(
      {
        error: "Unable to verify evidence. Please try again.",
      },
      { status: 500 }
    );
  }
}