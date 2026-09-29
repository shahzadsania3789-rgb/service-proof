import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.20),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              Service Operations & Payment Control
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">ServiceProof</p>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Proof-driven service
              operations.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ServiceProof connects service jobs,
              technician evidence, verification,
              payment approvals and audit history
              in one workflow.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Open Dashboard
              </Link>

              <Link
                href="/audit-logs"
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
              >
                View Audit Logs
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Workflow Preview */}

          <div className="mt-20 grid gap-4 md:grid-cols-4">
            {[
              {
                title: "Service Jobs",
                text: "Create and assign work.",
              },
              {
                title: "Evidence",
                text: "Capture proof of completion.",
              },
              {
                title: "Payments",
                text: "Control payment approval.",
              },
              {
                title: "Audit",
                text: "Track every important action.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur"
              >
                <h2 className="font-semibold">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}

      <section className="bg-white py-20 text-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              How ServiceProof Works
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              One connected service workflow
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-5">
            {[
              "Create Job",
              "Assign Worker",
              "Submit Proof",
              "Verify Evidence",
              "Control Payment",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                  {index + 1}
                </div>

                <h3 className="mt-4 font-semibold">
                  {step}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}