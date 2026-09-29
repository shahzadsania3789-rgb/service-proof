import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission } from "./permissions";

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole[]
) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requirePermission(
  permission: string
) {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requireModuleAccess(permission: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/onboarding/organization");
  if (!hasPermission(user.role, permission)) redirect("/dashboard");
  return user;
}