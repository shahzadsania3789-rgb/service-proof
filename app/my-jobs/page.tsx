"use client";

import { useEffect, useState } from "react";
import ModuleNavigation from "@/components/module-navigation";

type ServiceJob = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
  createdAt: string;
};

type Assignment = {
  id: string;
  status: string;
  assignedAt: string;
  serviceJob: ServiceJob;
};

export default function MyJobsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [evidenceType, setEvidenceType] = useState<
    "PHOTO" | "DOCUMENT" | "COMPLETION_NOTE"
  >("COMPLETION_NOTE");

  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceFileUrl, setEvidenceFileUrl] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceLoading, setEvidenceLoading] = useState("");

  async function handleEvidenceSubmit(serviceJobId: string) {
    setEvidenceLoading(serviceJobId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/my-jobs/${serviceJobId}/evidence`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: evidenceType,
            fileUrl:
              evidenceType === "COMPLETION_NOTE"
                ? null
                : evidenceFileUrl,
            fileName:
              evidenceType === "COMPLETION_NOTE"
                ? null
                : evidenceFileName,
            notes: evidenceNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Evidence submission failed."
        );
      }

      setSuccess("Evidence submitted successfully.");

      setEvidenceNotes("");
      setEvidenceFileUrl("");
      setEvidenceFileName("");

      await loadMyJobs();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setEvidenceLoading("");
    }
  }

  async function loadMyJobs() {
    try {
      setError("");

      const response = await fetch("/api/my-jobs");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load jobs."
        );
      }

      setAssignments(data.assignments);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialJobs() {
      try {
        const response = await fetch("/api/my-jobs");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load jobs."
          );
        }

        if (!cancelled) {
          setAssignments(data.assignments);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAction(
    assignmentId: string,
    action: "ACCEPT" | "START" | "COMPLETE"
  ) {
    setActionLoading(assignmentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/my-jobs/${assignmentId}/action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Action failed."
        );
      }

      setSuccess(data.message);

      await loadMyJobs();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function handlePaymentRequest(
    serviceJobId: string
  ) {
    const amountInput = document.getElementById(
      `amount-${serviceJobId}`
    ) as HTMLInputElement | null;

    const descriptionInput = document.getElementById(
      `description-${serviceJobId}`
    ) as HTMLInputElement | null;

    const amount = Number(
      amountInput?.value || 0
    );

    const description =
      descriptionInput?.value.trim() || "";

    if (!amount || amount <= 0) {
      setError(
        "Please enter a valid payment amount."
      );
      setSuccess("");
      return;
    }

    setActionLoading(`payment-${serviceJobId}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/payment-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceJobId,
            amount,
            currency: "PKR",
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create payment request."
        );
      }

      setSuccess(
        "Payment request created successfully."
      );

      await loadMyJobs();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return (
      <><ModuleNavigation /><main className="min-h-screen p-8"><p>Loading your assigned jobs...</p></main></>
    );
  }

  return (
    <><ModuleNavigation /><main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Assigned Jobs
          </h1>

          <p className="mt-2 text-gray-600">
            Manage the service jobs assigned to you.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {!error && assignments.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No jobs assigned
            </h2>

            <p className="mt-2 text-gray-500">
              You currently have no service jobs assigned
              to you.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              {/* Job Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {assignment.serviceJob.title}
                  </h2>

                  {assignment.serviceJob.description && (
                    <p className="mt-2 text-gray-600">
                      {assignment.serviceJob.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    Job:{" "}
                    {assignment.serviceJob.status.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    Assignment: {assignment.status}
                  </span>
                </div>
              </div>

              {/* Job Details */}
              <div className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Location
                  </p>

                  <p className="mt-1 text-gray-900">
                    {assignment.serviceJob.location ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Assigned At
                  </p>

                  <p className="mt-1 text-gray-900">
                    {new Date(
                      assignment.assignedAt
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Job Actions */}
              <div className="mt-6 border-t pt-5">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  Job Actions
                </p>

                <div className="flex flex-wrap gap-3">
                  {assignment.status === "ASSIGNED" && (
                    <button
                      onClick={() =>
                        handleAction(
                          assignment.id,
                          "ACCEPT"
                        )
                      }
                      disabled={
                        actionLoading === assignment.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === assignment.id
                        ? "Processing..."
                        : "Accept Job"}
                    </button>
                  )}

                  {assignment.status === "ACCEPTED" && (
                    <button
                      onClick={() =>
                        handleAction(
                          assignment.id,
                          "START"
                        )
                      }
                      disabled={
                        actionLoading === assignment.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === assignment.id
                        ? "Processing..."
                        : "Start Job"}
                    </button>
                  )}

                  {assignment.status === "IN_PROGRESS" && (
                    <button
                      onClick={() =>
                        handleAction(
                          assignment.id,
                          "COMPLETE"
                        )
                      }
                      disabled={
                        actionLoading === assignment.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === assignment.id
                        ? "Processing..."
                        : "Complete Job"}
                    </button>
                  )}

                  {assignment.status === "COMPLETED" && (
                    <span className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                      Job Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence Submission */}
              {assignment.status === "COMPLETED" && ["IN_PROGRESS", "CORRECTION_REQUIRED"].includes(assignment.serviceJob.status) && (
                <div className="mt-6 border-t pt-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Submit Required Proof
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Submit a photo, document, or completion
                    note for this job.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Evidence Type
                      </label>

                      <select
                        value={evidenceType}
                        onChange={(e) =>
                          setEvidenceType(
                            e.target.value as
                              | "PHOTO"
                              | "DOCUMENT"
                              | "COMPLETION_NOTE"
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      >
                        <option value="COMPLETION_NOTE">
                          Completion Note
                        </option>

                        <option value="PHOTO">
                          Photo
                        </option>

                        <option value="DOCUMENT">
                          Document
                        </option>
                      </select>
                    </div>

                    {evidenceType !==
                      "COMPLETION_NOTE" && (
                      <>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            File Name
                          </label>

                          <input
                            type="text"
                            value={evidenceFileName}
                            onChange={(e) =>
                              setEvidenceFileName(
                                e.target.value
                              )
                            }
                            placeholder="e.g. completed-job.jpg"
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            File URL
                          </label>

                          <input
                            type="text"
                            value={evidenceFileUrl}
                            onChange={(e) =>
                              setEvidenceFileUrl(
                                e.target.value
                              )
                            }
                            placeholder="Paste file URL"
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Notes
                      </label>

                      <textarea
                        value={evidenceNotes}
                        onChange={(e) =>
                          setEvidenceNotes(
                            e.target.value
                          )
                        }
                        placeholder="Describe the completed work..."
                        rows={4}
                        className="w-full rounded-lg border px-3 py-2"
                      />
                    </div>

                    <button
                      onClick={() =>
                        handleEvidenceSubmit(
                          assignment.serviceJob.id
                        )
                      }
                      disabled={
                        evidenceLoading ===
                        assignment.serviceJob.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {evidenceLoading ===
                      assignment.serviceJob.id
                        ? "Submitting..."
                        : "Submit Evidence"}
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Request */}
              {assignment.serviceJob.status ===
                "APPROVED" && (
                <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Request Payment
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    Request payment for this approved
                    service job.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label
                        htmlFor={`amount-${assignment.serviceJob.id}`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Payment Amount (PKR)
                      </label>

                      <input
                        id={`amount-${assignment.serviceJob.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter payment amount"
                        className="w-full rounded-lg border bg-white p-3 outline-none focus:ring-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`description-${assignment.serviceJob.id}`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Payment Description
                      </label>

                      <input
                        id={`description-${assignment.serviceJob.id}`}
                        type="text"
                        placeholder="e.g. Service job completion payment"
                        className="w-full rounded-lg border bg-white p-3 outline-none focus:ring-2"
                      />
                    </div>

                    <button
                      onClick={() =>
                        handlePaymentRequest(
                          assignment.serviceJob.id
                        )
                      }
                      disabled={
                        actionLoading ===
                        `payment-${assignment.serviceJob.id}`
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ===
                      `payment-${assignment.serviceJob.id}`
                        ? "Submitting..."
                        : "Request Payment"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
    </>
  );
}