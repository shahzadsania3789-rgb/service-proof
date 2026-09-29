import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "JOB_CREATED"
  | "JOB_ASSIGNED"
  | "JOB_UPDATED"
  | "JOB_STATUS_CHANGED"
  | "EVIDENCE_SUBMITTED"
  | "EVIDENCE_APPROVED"
  | "EVIDENCE_REJECTED"
  | "EVIDENCE_CORRECTION_REQUIRED"
  | "PAYMENT_REQUESTED"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_PAID";

type CreateAuditLogInput = {
  organizationId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(
  input: CreateAuditLogInput
) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,

        metadata: input.metadata
          ? JSON.parse(
              JSON.stringify(input.metadata)
            )
          : undefined,
      },
    });
  } catch {
    // Audit logging must never interrupt a business workflow.
    return null;
  }
}