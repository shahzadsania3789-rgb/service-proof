"use client";

import { useCallback, useEffect, useState } from "react";
import ModuleNavigation from "@/components/module-navigation";

type PaymentRequest = {
  id: string;

  amount: string;
  currency: string;
  description: string | null;
  status: string;

  requestedAt: string;

  serviceJob: {
    id: string;
    title: string;
    status: string;
    location: string | null;
  };

  requestedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  approvals: {
    id: string;
    status: string;
    comments: string | null;

    reviewedBy: {
      id: string;
      name: string;
      email: string;
    };
  }[];
};

export default function PaymentRequestsPage() {
  const [requests, setRequests] =
    useState<PaymentRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [reviewingId, setReviewingId] =
    useState<string | null>(null);

  const [comments, setComments] =
    useState<Record<string, string>>({});

  const [statusLoading, setStatusLoading] =
    useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/payment-requests"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load payment requests"
        );
      }

      setRequests(data);
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
    const timer = window.setTimeout(() => void loadRequests(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  async function reviewPayment(
    id: string,
    status: "APPROVED" | "REJECTED"
  ) {
    const comment =
      comments[id]?.trim() || "";

    if (
      status === "REJECTED" &&
      !comment
    ) {
      alert(
        "Please enter a reason for rejection."
      );
      return;
    }

    try {
      setReviewingId(id);

      const response = await fetch(
        `/api/payment-requests/${id}/review`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
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
          data.error ||
            "Failed to review payment"
        );
      }

      await loadRequests();
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

  async function updatePaymentStatus(
    id: string,
    status: "PROCESSING" | "PAID"
  ) {
    try {
      setStatusLoading(id);

      const response = await fetch(
        `/api/payment-requests/${id}/status`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
            paymentReference: null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update payment status"
        );
      }

      await loadRequests();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setStatusLoading(null);
    }
  }

  if (loading) {
    return (
      <><ModuleNavigation /><div className="p-6">
        Loading payment requests...
      </div></>
    );
  }

  return (
    <><ModuleNavigation /><main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Payment Requests
          </h1>

          <p className="mt-2 text-gray-600">
            Review and manage service job payments.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No payment requests
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no payment requests.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >

                <div className="flex flex-col gap-4 md:flex-row md:justify-between">

                  <div>
                    <h2 className="text-xl font-semibold">
                      {request.serviceJob.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Requested by{" "}
                      {request.requestedBy.name}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                    {request.status.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  <div>
                    <p className="text-sm text-gray-500">
                      Amount
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {request.currency}{" "}
                      {Number(
                        request.amount
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Job Status
                    </p>

                    <p className="mt-1 font-medium">
                      {request.serviceJob.status.replaceAll(
                        "_",
                        " "
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Requested
                    </p>

                    <p className="mt-1">
                      {new Date(
                        request.requestedAt
                      ).toLocaleString()}
                    </p>
                  </div>

                </div>

                {request.description && (
                  <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Description
                    </p>

                    <p className="mt-2">
                      {request.description}
                    </p>
                  </div>
                )}

                {request.status === "PENDING" && (
                  <div className="mt-6">

                    <textarea
                      value={
                        comments[request.id] ||
                        ""
                      }
                      onChange={(event) =>
                        setComments(
                          (current) => ({
                            ...current,
                            [request.id]:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Review comments..."
                      rows={3}
                      className="w-full rounded-lg border p-3"
                    />

                    <div className="mt-4 flex gap-3">

                      <button
                        onClick={() =>
                          reviewPayment(
                            request.id,
                            "APPROVED"
                          )
                        }
                        disabled={
                          reviewingId ===
                          request.id
                        }
                        className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          reviewPayment(
                            request.id,
                            "REJECTED"
                          )
                        }
                        disabled={
                          reviewingId ===
                          request.id
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                      >
                        Reject
                      </button>

                    </div>
                  </div>
                )}

                {request.status ===
                  "APPROVED" && (
                  <div className="mt-6">

                    <button
                      onClick={() =>
                        updatePaymentStatus(
                          request.id,
                          "PROCESSING"
                        )
                      }
                      disabled={
                        statusLoading ===
                        request.id
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                    >
                      Mark Processing
                    </button>

                  </div>
                )}

                {request.status ===
                  "PROCESSING" && (
                  <div className="mt-6">

                    <button
                      onClick={() =>
                        updatePaymentStatus(
                          request.id,
                          "PAID"
                        )
                      }
                      disabled={
                        statusLoading ===
                        request.id
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                    >
                      Mark as Paid
                    </button>

                  </div>
                )}

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
    </>
  );
}