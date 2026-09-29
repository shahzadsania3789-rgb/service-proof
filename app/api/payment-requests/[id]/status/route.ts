import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user =
      await requirePermission("payments.approve");

    if (!user.organizationId) {
      return NextResponse.json(
        {
          error:
            "User is not assigned to an organization",
        },
        { status: 400 }
      );
    }
    const organizationId = user.organizationId;

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const status = input.status;

    const paymentReference =
      typeof input.paymentReference === "string"
        ? input.paymentReference.trim()
        : null;

    if (status !== "PROCESSING" &&
        status !== "PAID") {
      return NextResponse.json(
        {
          error:
            "Status must be PROCESSING or PAID",
        },
        { status: 400 }
      );
    }

    const paymentRequest =
      await prisma.paymentRequest.findFirst({
        where: {
          id,

          serviceJob: {
            organizationId:
              user.organizationId,
          },
        },
      });

    if (!paymentRequest) {
      return NextResponse.json(
        {
          error:
            "Payment request not found",
        },
        { status: 404 }
      );
    }

    if ((status === "PROCESSING" && paymentRequest.status !== "APPROVED") ||
        (status === "PAID" && paymentRequest.status !== "PROCESSING")) {
      return NextResponse.json(
        {
          error: status === "PROCESSING"
            ? "Only an approved payment can move to processing."
            : "Only a processing payment can be marked as paid.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const expectedStatus = status === "PROCESSING" ? "APPROVED" : "PROCESSING";
      const changed = await transaction.paymentRequest.updateMany({
        where: { id, status: expectedStatus, serviceJob: { organizationId } },
        data: { status, paymentReference: paymentReference || undefined },
      });
      if (changed.count !== 1) throw new Error("PAYMENT_STATUS_CONFLICT");
      if (status === "PAID") {
        await transaction.serviceJob.update({ where: { id: paymentRequest.serviceJobId }, data: { status: "PAID" } });
      }
      return transaction.paymentRequest.findUniqueOrThrow({ where: { id } });
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: status === "PROCESSING" ? "PAYMENT_PROCESSING" : "PAYMENT_PAID",
      entityType: "PAYMENT_REQUEST",
      entityId: id,
      description: `Payment ${status.toLowerCase()} for service job ${paymentRequest.serviceJobId}`,
      metadata: { serviceJobId: paymentRequest.serviceJobId, paymentReference },
    });

    return NextResponse.json({
      message:
        "Payment status updated successfully",
      paymentRequest: updated,
    });
  } catch (error) {
    console.error(
      "Payment status error:",
      error
    );

    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (error instanceof Error && error.message === "PAYMENT_STATUS_CONFLICT") return NextResponse.json({ error: "Payment status changed before this update could be applied." }, { status: 409 });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong",
      },
      { status: 500 }
    );
  }
}