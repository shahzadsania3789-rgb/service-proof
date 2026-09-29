"use client";

import { FormEvent, useEffect, useState } from "react";
import ModuleNavigation from "@/components/module-navigation";

type Technician = {
  id: string;
  name: string;
  email: string;
};

type Assignment = {
  id: string;
  status: string;
  technician: Technician;
};

type ServiceJob = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
  createdAt: string;
  assignments: Assignment[];
};

export default function ServiceJobsClient() {
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [selectedTechnicians, setSelectedTechnicians] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadJobs() {
    try {
      const response = await fetch("/api/service-jobs");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load service jobs.");
        return;
      }

      setJobs(data.serviceJobs);
    } catch {
      setError("Failed to load service jobs.");
    } finally {
      setLoadingJobs(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [jobsResponse, techniciansResponse] = await Promise.all([
          fetch("/api/service-jobs"),
          fetch("/api/users/technicians"),
        ]);

        const jobsData = await jobsResponse.json();
        const techniciansData = await techniciansResponse.json();

        if (cancelled) {
          return;
        }

        if (!jobsResponse.ok) {
          setError(
            jobsData.error || "Failed to load service jobs."
          );
        } else {
          setJobs(jobsData.serviceJobs);
        }

        if (!techniciansResponse.ok) {
          setError(
            techniciansData.error ||
              "Failed to load technicians."
          );
        } else {
          setTechnicians(techniciansData.technicians);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load ServiceProof data.");
        }
      } finally {
        if (!cancelled) {
          setLoadingJobs(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/service-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Failed to create service job."
        );
        return;
      }

      setSuccess("Service job created successfully.");

      setTitle("");
      setDescription("");
      setLocation("");

      await loadJobs();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(jobId: string) {
    const technicianId = selectedTechnicians[jobId];

    if (!technicianId) {
      setError("Please select a technician first.");
      return;
    }

    setAssigningJobId(jobId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/service-jobs/${jobId}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            technicianId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Failed to assign technician."
        );
        return;
      }

      setSuccess("Technician assigned successfully.");

      setSelectedTechnicians((current) => ({
        ...current,
        [jobId]: "",
      }));

      await loadJobs();
    } catch {
      setError("Something went wrong.");
    } finally {
      setAssigningJobId(null);
    }
  }

  return (
    <>
    <ModuleNavigation />
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Service Jobs
          </h1>

          <p className="mt-2 text-gray-600">
            Create service jobs and assign technicians.
          </p>
        </div>

        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Create Job */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">
              Create Service Job
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="AC Maintenance Service"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the service work..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Location
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  placeholder="Mandi Bahauddin"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading
                  ? "Creating Job..."
                  : "Create Service Job"}
              </button>
            </form>
          </section>

          {/* Jobs */}
          <section className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Service Jobs
              </h2>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {jobs.length}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {loadingJobs ? (
                <p className="text-sm text-gray-500">
                  Loading jobs...
                </p>
              ) : jobs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <p className="font-medium text-gray-700">
                    No service jobs yet.
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Create your first service job.
                  </p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-gray-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {job.title}
                        </h3>

                        {job.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {job.description}
                          </p>
                        )}

                        {job.location && (
                          <p className="mt-2 text-sm text-gray-500">
                            Location: {job.location}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {job.status}
                      </span>
                    </div>

                    {/* Assign Technician */}
                    <div className="mt-5 border-t pt-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        Assign Technician
                      </p>

                      <div className="flex gap-2">
                        <select
                          value={
                            selectedTechnicians[job.id] || ""
                          }
                          onChange={(e) =>
                            setSelectedTechnicians(
                              (current) => ({
                                ...current,
                                [job.id]: e.target.value,
                              })
                            )
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                        >
                          <option value="">
                            Select technician
                          </option>

                          {technicians.map((technician) => (
                            <option
                              key={technician.id}
                              value={technician.id}
                            >
                              {technician.name} —{" "}
                              {technician.email}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            handleAssign(job.id)
                          }
                          disabled={
                            assigningJobId === job.id
                          }
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                          {assigningJobId === job.id
                            ? "Assigning..."
                            : "Assign"}
                        </button>
                      </div>
                    </div>

                    {/* Existing Assignments */}
                    {job.assignments.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Assigned Technician
                        </p>

                        <div className="space-y-2">
                          {job.assignments.map(
                            (assignment) => (
                              <div
                                key={assignment.id}
                                className="rounded-lg bg-gray-50 p-3"
                              >
                                <p className="text-sm font-medium text-gray-900">
                                  {assignment.technician.name}
                                </p>

                                <p className="text-xs text-gray-500">
                                  {assignment.technician.email}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  Status:{" "}
                                  {assignment.status}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
    </>
  );
}