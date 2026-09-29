import type { ReactNode } from "react";
import { requireModuleAccess } from "@/lib/authorization";

export default async function AuditLogsLayout({ children }: { children: ReactNode }) {
  await requireModuleAccess("audit.view");
  return children;
}