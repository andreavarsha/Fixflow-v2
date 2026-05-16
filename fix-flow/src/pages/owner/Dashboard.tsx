import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function OwnerDashboard() {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<Id<"jobs"> | null>(null);

  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const submitJob = useMutation(api.jobs.submitJob);

  async function uploadPhoto(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) {
      throw new Error("Photo upload failed");
    }
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setError("");
    setSubmitting(true);
    try {
      const photoId = photo ? await uploadPhoto(photo) : undefined;
      const id = await submitJob({
        description: description.trim(),
        photoId,
      });
      setJobId(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit job";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (jobId) {
    return (
      <ClassificationResult
        jobId={jobId}
        onNewJob={() => {
          setJobId(null);
          setDescription("");
          setPhoto(null);
          setError("");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">FixFlow AI</h1>
      <p className="text-sm text-gray-500 mb-8">Gampaha · Kadana</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">District</label>
          <div className="border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500">
            Gampaha (Kadana)
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Describe the issue
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Pipe leaking under kitchen sink, water pooling on floor"
            maxLength={300}
            rows={4}
            required
            className="border border-gray-300 px-3 py-2 text-sm bg-white text-black w-full focus:outline-none focus:border-black resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {description.length}/300
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Photo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 w-full"
          />
          {photo && (
            <p className="text-xs text-gray-400 mt-1">{photo.name}</p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="bg-black text-white py-2 font-medium hover:bg-gray-800 disabled:opacity-50 mt-2"
        >
          {submitting ? "Submitting..." : "Submit Job"}
        </button>
      </form>
    </div>
  );
}

function ClassificationResult({
  jobId,
  onNewJob,
}: {
  jobId: Id<"jobs">;
  onNewJob: () => void;
}) {
  const job = useQuery(api.jobs.getJob, { jobId });
  const updateSummary = useMutation(api.jobs.updateSummary);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  if (job === undefined) {
    return (
      <div className="min-h-screen bg-white text-black p-8 max-w-xl mx-auto">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="min-h-screen bg-white text-black p-8 max-w-xl mx-auto">
        <p className="text-red-600 text-sm">Job not found.</p>
        <button type="button" onClick={onNewJob} className="mt-4 text-sm underline">
          Submit another job
        </button>
      </div>
    );
  }

  if (job.status === "classifying") {
    return (
      <div className="min-h-screen bg-white text-black p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">FixFlow AI</h1>
        <p className="text-sm text-gray-500 mb-8">Gampaha · Kadana</p>
        <div className="border border-gray-200 p-8 text-center">
          <p className="text-sm font-medium">Classifying your request...</p>
          <p className="text-xs text-gray-400 mt-2">
            AI is analysing your issue and preparing translations
          </p>
        </div>
      </div>
    );
  }

  const urgency = job.urgency ?? "Medium";
  const urgencyStyle = {
    High: "bg-red-100 text-red-700 border border-red-300",
    Medium: "bg-amber-100 text-amber-700 border border-amber-300",
    Low: "bg-green-100 text-green-700 border border-green-300",
  };

  const summary = job.aiSummary ?? "";

  async function handleSaveSummary() {
    setSaveError("");
    setSaving(true);
    try {
      await updateSummary({ jobId, aiSummary: summaryDraft });
      setEditingSummary(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">FixFlow AI</h1>
      <p className="text-sm text-gray-500 mb-8">Gampaha · Kadana</p>

      <div className="border border-gray-200 p-6 flex flex-col gap-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          Classification Result
        </p>

        {job.photoUrl && (
          <img
            src={job.photoUrl}
            alt="Submitted issue"
            className="w-full max-h-48 object-cover border border-gray-200"
          />
        )}

        <div className="flex gap-2 flex-wrap">
          {job.category && (
            <span className="border border-gray-300 px-3 py-1 text-sm">
              {job.category}
            </span>
          )}
          {job.subcategory && (
            <span className="border border-gray-300 px-3 py-1 text-sm text-gray-500">
              {job.subcategory}
            </span>
          )}
          <span
            className={`px-3 py-1 text-sm font-medium ${urgencyStyle[urgency]}`}
          >
            {urgency} Urgency
          </span>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Summary (English)</p>
          {editingSummary ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                rows={3}
                className="border border-gray-300 px-3 py-2 text-sm bg-white text-black w-full focus:outline-none focus:border-black resize-none"
              />
              {saveError && (
                <p className="text-red-600 text-xs">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveSummary}
                  disabled={saving || !summaryDraft.trim()}
                  className="text-xs border border-black px-3 py-1 hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSummary(false);
                    setSaveError("");
                  }}
                  className="text-xs text-gray-500 underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm">{summary}</p>
              <button
                type="button"
                onClick={() => {
                  setSummaryDraft(summary);
                  setEditingSummary(true);
                }}
                className="text-xs text-gray-400 underline shrink-0 hover:text-black"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {job.aiSummary_si && (
          <div>
            <p className="text-xs text-gray-400 mb-1">සිංහල</p>
            <p className="text-sm">{job.aiSummary_si}</p>
          </div>
        )}

        {job.aiSummary_ta && (
          <div>
            <p className="text-xs text-gray-400 mb-1">தமிழ்</p>
            <p className="text-sm">{job.aiSummary_ta}</p>
          </div>
        )}

        <button
          type="button"
          disabled
          className="bg-gray-300 text-gray-600 py-2 font-medium cursor-not-allowed mt-2"
          title="Supplier discovery — Core Round 2"
        >
          Find Nearby Suppliers → (Round 2)
        </button>

        <button
          type="button"
          onClick={onNewJob}
          className="text-sm text-gray-500 underline text-center"
        >
          Submit another job
        </button>
      </div>
    </div>
  );
}
