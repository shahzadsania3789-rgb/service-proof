import type { ReactNode } from "react";
import { requireModuleAccess } from "@/lib/authorization";

export default async function EvidenceReviewLayout({ children }: { children: ReactNode }) {
  await requireModuleAccess("evidence.verify");
  return children;
}