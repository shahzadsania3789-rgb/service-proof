import type { ReactNode } from "react";
import { requireModuleAccess } from "@/lib/authorization";

export default async function PaymentRequestsLayout({ children }: { children: ReactNode }) {
  await requireModuleAccess("payments.request");
  return children;
}