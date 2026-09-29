"use client";

import { useCallback, useEffect, useState } from "react";
import ModuleNavigation from "@/components/module-navigation";

type Evidence = {
  id: string;
  type: "PHOTO" | "DOCUMENT" | "COMPLETION_NOTE";
  fileUrl: string | null;
  fileName: string | null;
  notes: string | null;
  createdAt: string;

  serviceJob: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    status: string;
  };

  submittedBy: {
    id: string;
    name: string;
    email: string;
  };

  verifications: {
    id: string;
    status: string;
    comments: string | null;
    createdAt: string;

    reviewedBy: {
      id: string;
      name: string;
      email: string;
    };
  }[];
};

export default function EvidenceReviewPage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [comments, setComments] = useState<Record<string, string>>(
    {}
  );

  const [reviewingId, setReviewingId] = useState<string | null>(
    null
  );

  const loadEvidence = useCallback(async () => {
    try {
      const response = await fetch("/api/evidence/pending");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load evidence");
      }

      setEvidence(data);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvidence(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEvidence]);

  async function handleReview(
    evidenceId: string,
    status:
      | "APPROVED"
      | "REJECTED"
      | "CORRECTION_REQUIRED"
  ) {
    const comment = comments[evidenceId]?.trim() || "";

    if (
      (status === "REJECTED" ||
        status === "CORRECTION_REQUIRED") &&
      !comment
    ) {
      alert(
        "Please enter comments for rejection or correction request."
      );
      return;
    }

    try {
      setReviewingId(evidenceId);

      const response = await fetch(
        `/api/evidence/${evidenceId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            comments: comment || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to review evidence"
        );
      }

      setEvidence((current) =>
        current.filter((item) => item.id !== evidenceId)
      );

      setComments((current) => {
        const updated = { ...current };
        delete updated[evidenceId];
        return updated;
      });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <><ModuleNavigation /><div className="p-6">
        <p>Loading pending evidence...</p>
      </div></>
    );
  }

  return (
    <><ModuleNavigation /><main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Evidence Review
          </h1>

          <p className="mt-2 text-gray-600">
            Review evidence submitted by technicians.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {evidence.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No pending evidence
            </h2>

            <p className="mt-2 text-gray-500">
              There is currently no evidence waiting for review.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {item.serviceJob.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Job ID: {item.serviceJob.id}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    Pending Review
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Technician
                    </p>

                    <p className="mt-1 font-medium">
                      {item.submittedBy.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.submittedBy.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Evidence Type
                    </p>

                    <p className="mt-1 font-medium">
                      {item.type.replace("_", " ")}
                    </p>
                  </div>

                  {item.serviceJob.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Location
                      </p>

                      <p className="mt-1">
                        {item.serviceJob.location}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Submitted
                    </p>

                    <p className="mt-1">
                      {new Date(
                        item.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Technician Notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  </div>
                )}

                {item.fileUrl && (
                  <div className="mt-6">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {item.fileName || "View Evidence File"}
                    </a>
                  </div>
                )}

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium">
                    Review Comments
                  </label>

                  <textarea
                    value={comments[item.id] || ""}
                    onChange={(event) =>
                      setComments((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    placeholder="Add review comments..."
                    rows={4}
                    className="w-full rounded-lg border p-3 outline-none focus:ring-2"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      handleReview(item.id, "APPROVED")
                    }
                    disabled={reviewingId === item.id}
                    className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleReview(
                        item.id,
                        "CORRECTION_REQUIRED"
                      )
                    }
                    disabled={reviewingId === item.id}
                    className="rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Request Correction
                  </button>

                  <button
                    onClick={() =>
                      handleReview(item.id, "REJECTED")
                    }
                    disabled={reviewingId === item.id}
                    className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    </>
  );
}