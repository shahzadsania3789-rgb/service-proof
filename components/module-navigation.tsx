import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Service Jobs", "/service-jobs"],
  ["My Jobs", "/my-jobs"],
  ["Evidence Review", "/evidence-review"],
  ["Payment Requests", "/payment-requests"],
  ["Audit Logs", "/audit-logs"],
] as const;

export default function ModuleNavigation() {
  return (
    <nav aria-label="Main navigation" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-blue-600">
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}