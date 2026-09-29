import { UserRole } from "@prisma/client";

export const permissions = {
  ADMIN: [
    "organization.manage",
    "users.manage",

    "jobs.create",
    "jobs.assign",
    "jobs.view",

    "evidence.view",
    "evidence.verify",

    "payments.request",
    "payments.approve",

    "audit.view",
  ],

  OPERATIONS: [
    "jobs.create",
    "jobs.assign",
    "jobs.view",

    "evidence.view",
    "evidence.verify",

    "payments.request",

    "audit.view",
  ],

  FINANCE: [
    "jobs.view",
    "evidence.view",

    "jobs.create",
    "payments.request",
    "payments.approve",

    "audit.view",
  ],

  TECHNICIAN: [
    "jobs.view",
    "evidence.submit",
    "payments.request",
  ],
} satisfies Record<UserRole, string[]>;

export function hasPermission(role: UserRole, permission: string) {
  return permissions[role].includes(permission);
}