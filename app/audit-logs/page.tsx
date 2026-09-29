"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleNavigation from "@/components/module-navigation";

type AuditUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuditUser;
};

const actionOptions = [
  {
    value: "",
    label: "All Actions",
  },
  {
    value: "JOB_CREATED",
    label: "Job Created",
  },
  {
    value: "JOB_ASSIGNED",
    label: "Job Assigned",
  },
  {
    value: "EVIDENCE_SUBMITTED",
    label: "Evidence Submitted",
  },
  {
    value: "EVIDENCE_APPROVED",
    label: "Evidence Approved",
  },
  {
    value: "EVIDENCE_REJECTED",
    label: "Evidence Rejected",
  },
  {
    value: "EVIDENCE_CORRECTION_REQUIRED",
    label: "Correction Required",
  },
  {
    value: "PAYMENT_REQUESTED",
    label: "Payment Requested",
  },
  {
    value: "PAYMENT_APPROVED",
    label: "Payment Approved",
  },
  {
    value: "PAYMENT_REJECTED",
    label: "Payment Rejected",
  },
  {
    value: "PAYMENT_PROCESSING",
    label: "Payment Processing",
  },
  {
    value: "PAYMENT_PAID",
    label: "Payment Paid",
  },
];

const entityOptions = [
  {
    value: "",
    label: "All Entities",
  },
  {
    value: "SERVICE_JOB",
    label: "Service Jobs",
  },
  {
    value: "EVIDENCE",
    label: "Evidence",
  },
  {
    value: "PAYMENT_REQUEST",
    label: "Payment Requests",
  },
];

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatEntity(entity: string) {
  return entity
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getActionStyle(action: string) {
  if (
    action === "EVIDENCE_APPROVED" ||
    action === "PAYMENT_APPROVED" ||
    action === "PAYMENT_PAID"
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    action === "EVIDENCE_REJECTED" ||
    action === "PAYMENT_REJECTED"
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    action ===
    "EVIDENCE_CORRECTION_REQUIRED"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (
    action === "PAYMENT_PROCESSING"
  ) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function AuditLogsPage() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionFilter, setActionFilter] =
    useState("");

  const [entityFilter, setEntityFilter] =
    useState("");

  const loadLogs = useCallback(async () => {
    try {
      const params =
        new URLSearchParams();

      if (actionFilter) {
        params.set(
          "action",
          actionFilter
        );
      }

      if (entityFilter) {
        params.set(
          "entityType",
          entityFilter
        );
      }

      const query =
        params.toString();

      const response = await fetch(
        query
          ? `/api/audit-logs?${query}`
          : "/api/audit-logs",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load audit logs."
        );
      }

      setLogs(data);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLogs(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  const stats = useMemo(() => {
    return {
      total: logs.length,

      jobs: logs.filter(
        (log) =>
          log.entityType ===
          "SERVICE_JOB"
      ).length,

      evidence: logs.filter(
        (log) =>
          log.entityType ===
          "EVIDENCE"
      ).length,

      payments: logs.filter(
        (log) =>
          log.entityType ===
          "PAYMENT_REQUEST"
      ).length,
    };
  }, [logs]);

  return (
    <>
    <ModuleNavigation />
    <main className="min-h-screen bg-slate-50">
      {/* Header */}

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg text-white">
                  ✓
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Audit Logs
                  </h1>

                  <p className="text-sm text-slate-500">
                    Complete activity history
                    for your organization
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={loadLogs}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Refresh Logs
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Activities
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Job Activities
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.jobs}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Evidence Activities
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.evidence}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Payment Activities
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.payments}
            </p>
          </div>
        </div>

        {/* Filters */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">
              Activity Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Filter the audit history by
              action or entity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Action
              </label>

              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
              >
                {actionOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Entity
              </label>

              <select
                value={entityFilter}
                onChange={(e) =>
                  setEntityFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
              >
                {entityOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setActionFilter("");
                  setEntityFilter("");
                }}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Activity */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Every important action is
              recorded here.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

              <p className="mt-4 text-sm text-slate-500">
                Loading audit activity...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                ✓
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No activity yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Audit activity will appear
                here when jobs, evidence, and
                payments are processed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex gap-4">
                    {/* Timeline icon */}

                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {log.user.name
                          ?.charAt(0)
                          .toUpperCase() ||
                          "U"}
                      </div>

                      <div className="mt-2 h-full w-px bg-slate-200" />
                    </div>

                    {/* Content */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getActionStyle(
                                log.action
                              )}`}
                            >
                              {formatAction(
                                log.action
                              )}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {formatEntity(
                                log.entityType
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 font-medium text-slate-900">
                            {log.description}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>
                              By{" "}
                              <strong className="font-medium text-slate-700">
                                {log.user.name}
                              </strong>
                            </span>

                            <span>
                              {log.user.role}
                            </span>

                            <span>
                              {new Date(
                                log.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400">
                          ID:{" "}
                          <span className="font-mono">
                            {log.entityId}
                          </span>
                        </div>
                      </div>

                      {log.metadata && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
                            View details
                          </summary>

                          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-200">
                            {JSON.stringify(
                              log.metadata,
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
    </>
  );
}