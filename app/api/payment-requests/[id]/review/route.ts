import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("payments.approve");
    if (!user.organizationId) return NextResponse.json({ error: "Your account is not associated with an organization." }, { status: 400 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const status = input.status;
    const comments = typeof input.comments === "string" ? input.comments.trim() || null : null;
    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Status must be APPROVED or REJECTED." }, { status: 400 });
    }
    if (status === "REJECTED" && !comments) {
      return NextResponse.json({ error: "Comments are required when rejecting a payment request." }, { status: 400 });
    }

    const { id } = await params;
    const current = await prisma.paymentRequest.findFirst({
      where: { id, status: "PENDING", serviceJob: { organizationId: user.organizationId } },
      include: { serviceJob: { select: { id: true, title: true } } },
    });
    if (!current) return NextResponse.json({ error: "Pending payment request not found." }, { status: 404 });

    const result = await prisma.$transaction(async (transaction) => {
      const approval = await transaction.paymentApproval.create({
        data: { paymentRequestId: id, reviewedById: user.id, status, comments },
      });
      const updatedRequest = await transaction.paymentRequest.updateMany({ where: { id, status: "PENDING" }, data: { status } });
      if (updatedRequest.count !== 1) throw new Error("PAYMENT_REQUEST_ALREADY_REVIEWED");
      if (status === "REJECTED") {
        await transaction.serviceJob.update({ where: { id: current.serviceJobId }, data: { status: "APPROVED" } });
      }
      return { approval, paymentRequest: updatedRequest };
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: status === "APPROVED" ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
      entityType: "PAYMENT_REQUEST",
      entityId: id,
      description: `Payment request ${status.toLowerCase()} for ${current.serviceJob.title}`,
      metadata: { serviceJobId: current.serviceJobId, approvalId: result.approval.id, comments },
    });
    return NextResponse.json({ message: `Payment request ${status.toLowerCase()}.`, ...result });
  } catch (error) {
    console.error("Payment review error:", error);
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (error instanceof Error && error.message === "PAYMENT_REQUEST_ALREADY_REVIEWED") return NextResponse.json({ error: "Payment request has already been reviewed." }, { status: 409 });
    return NextResponse.json({ error: "Unable to review payment request. Please try again." }, { status: 500 });
  }
}