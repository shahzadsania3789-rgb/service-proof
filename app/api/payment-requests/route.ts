import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user =
      await requirePermission("payments.request");

    if (!user.organizationId) {
      return NextResponse.json(
        {
          error:
            "User is not assigned to an organization",
        },
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

    const serviceJobId =
      typeof input.serviceJobId === "string"
        ? input.serviceJobId.trim()
        : "";

    const amount = Number(input.amount);

    const currency =
      typeof input.currency === "string" &&
      input.currency.trim()
        ? input.currency.trim().toUpperCase()
        : "PKR";

    const description =
      typeof input.description === "string"
        ? input.description.trim() || null
        : null;

    if (!serviceJobId) {
      return NextResponse.json(
        {
          error: "Service job is required",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error:
            "Payment amount must be greater than zero",
        },
        { status: 400 }
      );
    }

    const job = await prisma.serviceJob.findFirst({
      where: {
        id: serviceJobId,
        organizationId: user.organizationId,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          error: "Service job not found",
        },
        { status: 404 }
      );
    }

    if (job.status !== "APPROVED") {
      return NextResponse.json(
        {
          error:
            "Payment request can only be created for an approved service job.",
        },
        { status: 400 }
      );
    }

    const paymentRequest = await prisma.$transaction(async (transaction) => {
      const existingRequest = await transaction.paymentRequest.findFirst({
        where: { serviceJobId, status: { in: ["PENDING", "APPROVED", "PROCESSING"] } },
      });
      if (existingRequest) return null;
      const createdRequest = await transaction.paymentRequest.create({
        data: { serviceJobId, requestedById: user.id, amount, currency, description },
      });
      await transaction.serviceJob.update({ where: { id: serviceJobId }, data: { status: "PAYMENT_PENDING" } });
      return createdRequest;
    });

    if (!paymentRequest) {
      return NextResponse.json({ error: "An active payment request already exists for this job." }, { status: 409 });
    }

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "PAYMENT_REQUESTED",
      entityType: "PAYMENT_REQUEST",
      entityId: paymentRequest.id,
      description: `Payment requested for ${job.title}`,
      metadata: { serviceJobId, amount, currency },
    });

    return NextResponse.json(
      {
        message:
          "Payment request created successfully",
        paymentRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Payment request error:",
      error
    );

    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
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

export async function GET() {
  try {
    const user =
      await requirePermission("payments.request");

    if (!user.organizationId) {
      return NextResponse.json(
        {
          error:
            "User is not assigned to an organization",
        },
        { status: 400 }
      );
    }

    const paymentRequests =
      await prisma.paymentRequest.findMany({
        where: {
          serviceJob: {
            organizationId: user.organizationId,
          },
        },

        include: {
          serviceJob: {
            select: {
              id: true,
              title: true,
              status: true,
              location: true,
            },
          },

          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },

          approvals: {
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
          requestedAt: "desc",
        },
      });

    return NextResponse.json(paymentRequests);
  } catch (error) {
    console.error(
      "Payment requests GET error:",
      error
    );

    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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