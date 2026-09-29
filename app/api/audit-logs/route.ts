import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
const allowedActions = [
  "JOB_CREATED", "JOB_ASSIGNED", "JOB_UPDATED", "JOB_STATUS_CHANGED",
  "EVIDENCE_SUBMITTED", "EVIDENCE_APPROVED", "EVIDENCE_REJECTED", "EVIDENCE_CORRECTION_REQUIRED",
  "PAYMENT_REQUESTED", "PAYMENT_APPROVED", "PAYMENT_REJECTED", "PAYMENT_PROCESSING", "PAYMENT_PAID",
] as const;

export async function GET(request: Request) {
  try {
    const user =
      await requirePermission("audit.view");

    if (!user.organizationId) {
      return NextResponse.json(
        {
          error:
            "User is not assigned to an organization",
        },
        { status: 400 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const actionParam =
      searchParams.get("action");

    const entityType =
      searchParams.get("entityType");

    const validAction = actionParam
      ? allowedActions.find((action) => action === actionParam)
      : undefined;

    const logs =
      await prisma.auditLog.findMany({
        where: {
          organizationId:
            user.organizationId,

          ...(validAction ? { action: validAction } : {}),

          ...(entityType
            ? {
                entityType,
              }
            : {}),
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 200,
      });

    return NextResponse.json(logs);
  } catch (error) {
    console.error(
      "Audit logs GET error:",
      error
    );

    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(
      {
        error: "Unable to load audit activity. Please try again.",
      },
      { status: 500 }
    );
  }
}