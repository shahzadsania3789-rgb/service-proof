import type { ReactNode } from "react";
import { requireModuleAccess } from "@/lib/authorization";

export default async function MyJobsLayout({ children }: { children: ReactNode }) {
  await requireModuleAccess("jobs.view");
  return children;
}