import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authorization";
import { hasPermission } from "@/lib/permissions";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/onboarding/organization");

  const modules = [
    { href: "/service-jobs", title: "Service Jobs", description: "Create work orders, assign technicians, and follow each job status.", icon: "01", tone: "bg-blue-50 text-blue-700", permission: "jobs.view" },
    { href: "/my-jobs", title: "My Jobs", description: "Accept assigned work, record progress, and submit completion evidence.", icon: "02", tone: "bg-emerald-50 text-emerald-700" },
    { href: "/evidence-review", title: "Evidence Review", description: "Review proof of work and approve, reject, or request corrections.", icon: "03", tone: "bg-amber-50 text-amber-700", permission: "evidence.verify" },
    { href: "/payment-requests", title: "Payment Requests", description: "Review payment requests and track processing through settlement.", icon: "04", tone: "bg-violet-50 text-violet-700", permission: "payments.request" },
    { href: "/audit-logs", title: "Audit Logs", description: "Explore a traceable timeline of important organization activity.", icon: "05", tone: "bg-slate-100 text-slate-700", permission: "audit.view" },
  ];
  const visibleModules = modules.filter((module) => !module.permission || hasPermission(user.role, module.permission));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-10 md:flex-row md:items-center">
          <div>
            <Link href="/" className="text-sm font-semibold tracking-wide text-cyan-300">ServiceProof</Link>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-slate-300">Your service operations, evidence, and payment control center.</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span>{user.name} · {user.role}</span>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">{user.organizationId ? "Organization member" : "No organization"}</span>
            <LogoutButton />
          </div>
        </header>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Workspace</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">ServiceProof modules</h2>
            <p className="mt-1 text-slate-600">Choose a workspace to continue managing the end-to-end service workflow.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) => (
              <Link key={module.href} href={module.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-bold ${module.tone}`}>{module.icon}</span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{module.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{module.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Open module <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}