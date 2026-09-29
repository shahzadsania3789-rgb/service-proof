import type { ReactNode } from "react";
import { requireModuleAccess } from "@/lib/authorization";

export default async function ServiceJobsLayout({ children }: { children: ReactNode }) {
  await requireModuleAccess("jobs.view");
  return children;
}