import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SupplierDiscovery } from "../../components/owner/SupplierDiscovery";
import { LiveQuotesDashboard } from "../../components/owner/LiveQuotesDashboard";
import { OwnerStepHint } from "../../components/layout/OwnerStepHint";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffBtnSecondary,
  ffBtnInRow,
  ffCard,
  ffInput,
  ffLabel,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";

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
    <div className={ffPage}>
      <OwnerStepHint active={1} />
      <header className="mb-6">
        <h1 className={ffScreenTitle}>FixFlow AI</h1>
        <p className={ffScreenSubtitle}>Home repairs in Gampaha (Kadana area)</p>
      </header>

      <div className={ffCard}>
        <p className="mb-6 text-sm leading-relaxed text-gray-600 lg:text-base lg:leading-relaxed">
          Describe what needs fixing. We&apos;ll classify it, find nearby tradespeople,
          and help you compare quotes — all in one place.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:gap-y-6">
          <div className="flex flex-col gap-5 lg:col-span-5">
            <div>
              <span className={ffLabel}>District</span>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-600">
                Gampaha (Kadana)
              </div>
            </div>

            <div>
              <label htmlFor="issue-photo" className={ffLabel}>
                Photo <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="issue-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-900"
              />
              {photo && (
                <p className="mt-2 text-xs text-gray-500">{photo.name}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-7">
            <div>
              <label htmlFor="issue-desc" className={ffLabel}>
                What&apos;s the problem?
              </label>
              <textarea
                id="issue-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Water leaking under the kitchen sink since yesterday."
                maxLength={300}
                rows={6}
                required
                className={`${ffInput} resize-none lg:min-h-[180px]`}
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {description.length}/300
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className={`${ffBtnPrimary} lg:max-w-md xl:w-auto xl:min-w-[240px]`}
            >
              {submitting ? "Sending…" : "Continue — classify issue"}
            </button>
          </div>
        </form>
      </div>
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
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showLiveQuotes, setShowLiveQuotes] = useState(false);
  const [summaryLang, setSummaryLang] = useState<"en" | "si" | "ta">("en");

  /** Must run before any early returns — otherwise hook order changes when `job` finishes loading and React crashes (blank / black screen). */
  useEffect(() => {
    if (job === undefined || job === null || job.status === "classifying") return;
    const hasSi = Boolean(job.aiSummary_si?.trim());
    const hasTa = Boolean(job.aiSummary_ta?.trim());
    if (summaryLang === "si" && !hasSi) setSummaryLang("en");
    if (summaryLang === "ta" && !hasTa) setSummaryLang("en");
  }, [job, summaryLang]);

  if (job === undefined) {
    return (
      <div className={ffPage}>
        <p className="text-sm text-gray-500">Loading your job…</p>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className={ffPage}>
        <p className="text-sm text-red-600">We couldn&apos;t load this job.</p>
        <button type="button" onClick={onNewJob} className={`${ffBtnGhost} mt-4`}>
          Start over
        </button>
      </div>
    );
  }

  if (job.status === "classifying") {
    return (
      <div className={ffPage}>
        <header className="mb-6">
          <h1 className={ffScreenTitle}>FixFlow AI</h1>
          <p className={ffScreenSubtitle}>Gampaha · Kadana</p>
        </header>
        <div className={`${ffCard} text-center`}>
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-gray-200" aria-hidden />
          <p className="font-medium text-gray-900">Sorting out your request…</p>
          <p className="mt-2 text-sm text-gray-500">
            Estimating urgency and preparing Sinhala & Tamil summaries. Usually under
            a few seconds.
          </p>
        </div>
      </div>
    );
  }

  const urgency = job.urgency ?? "Medium";
  const urgencyStyle = {
    High: "bg-red-50 text-red-800 ring-1 ring-red-200",
    Medium: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
    Low: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  };

  const summary = job.aiSummary ?? "";
  const hasSi = Boolean(job.aiSummary_si?.trim());
  const hasTa = Boolean(job.aiSummary_ta?.trim());

  const langTabs: { id: "en" | "si" | "ta"; label: string }[] = [
    { id: "en", label: "English" },
    ...(hasSi ? [{ id: "si" as const, label: "සිංහල" }] : []),
    ...(hasTa ? [{ id: "ta" as const, label: "தமிழ்" }] : []),
  ];

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

  if (showLiveQuotes) {
    return (
      <LiveQuotesDashboard
        jobId={jobId}
        onBack={() => setShowLiveQuotes(false)}
      />
    );
  }

  if (showDiscovery && job.category) {
    return (
      <div className={ffPage}>
        <OwnerStepHint active={2} />
        <header className="mb-6">
          <h1 className={ffScreenTitle}>FixFlow AI</h1>
          <p className={ffScreenSubtitle}>Choose nearby suppliers</p>
        </header>
        <SupplierDiscovery
          jobId={jobId}
          category={job.category}
          onBack={() => setShowDiscovery(false)}
          onQuotesSent={() => setShowLiveQuotes(true)}
        />
        <button type="button" onClick={onNewJob} className={`${ffBtnGhost} mt-8`}>
          Cancel this job
        </button>
      </div>
    );
  }

  return (
    <div className={ffPage}>
      <OwnerStepHint active={1} />
      <header className="mb-6">
        <h1 className={ffScreenTitle}>FixFlow AI</h1>
        <p className={ffScreenSubtitle}>Here&apos;s what we understood</p>
      </header>

      <div className={`${ffCard} flex flex-col gap-6 xl:gap-8`}>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Summary
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-600 lg:text-base">
            Check the details below, then invite suppliers or open your quote inbox.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-10 xl:grid-cols-12 xl:gap-12">
          <div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-5">
            {job.photoUrl && (
              <img
                src={job.photoUrl}
                alt="Photo you attached"
                className="max-h-64 w-full rounded-xl border border-gray-100 object-cover xl:max-h-80"
              />
            )}

            <div className="flex flex-wrap gap-2">
              {job.category && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                  {job.category}
                </span>
              )}
              {job.subcategory && (
                <span className="rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-600 ring-1 ring-gray-200">
                  {job.subcategory}
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${urgencyStyle[urgency]}`}
              >
                {urgency} urgency
              </span>
            </div>
          </div>

          <div className="flex flex-col border-t border-gray-100 pt-6 lg:col-span-7 lg:border-t-0 lg:pt-0 xl:col-span-7">
            {langTabs.length > 1 && (
              <div
                className="mb-4 flex flex-wrap gap-2"
                role="tablist"
                aria-label="Summary language"
              >
                {langTabs.map(({ id, label }) => {
                  const selected = summaryLang === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => {
                        if (id !== "en" && editingSummary) {
                          setEditingSummary(false);
                          setSaveError("");
                        }
                        setSummaryLang(id);
                      }}
                      className={
                        selected
                          ? "rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm"
                          : "rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-200"
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {langTabs.length === 1 && <p className={ffLabel}>English</p>}

            {summaryLang === "en" && (
              <>
                {editingSummary ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={summaryDraft}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      rows={5}
                      className={`${ffInput} resize-none`}
                    />
                    {saveError && (
                      <p className="text-sm text-red-600">{saveError}</p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={handleSaveSummary}
                        disabled={saving || !summaryDraft.trim()}
                        className={`${ffBtnPrimary} ${ffBtnInRow}`}
                      >
                        {saving ? "Saving…" : "Save summary"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSummary(false);
                          setSaveError("");
                        }}
                        className={`${ffBtnSecondary} ${ffBtnInRow}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="flex-1 text-base leading-relaxed text-gray-800 lg:text-lg">
                      {summary}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSummaryDraft(summary);
                        setEditingSummary(true);
                      }}
                      className={`${ffBtnGhost} shrink-0 sm:w-auto`}
                    >
                      Edit text
                    </button>
                  </div>
                )}
              </>
            )}

            {summaryLang === "si" && job.aiSummary_si && (
              <p className="text-base leading-relaxed text-gray-800 lg:text-lg">{job.aiSummary_si}</p>
            )}

            {summaryLang === "ta" && job.aiSummary_ta && (
              <p className="text-base leading-relaxed text-gray-800 lg:text-lg">{job.aiSummary_ta}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 lg:flex-row lg:flex-wrap lg:items-center xl:gap-4">
          <p className="w-full text-sm font-medium text-gray-900 lg:w-auto lg:flex-shrink-0">
            Next steps
          </p>
          <button
            type="button"
            onClick={() => setShowDiscovery(true)}
            disabled={!job.category}
            className={`${ffBtnPrimary} ${ffBtnInRow}`}
          >
            Find nearby suppliers
          </button>
          <button
            type="button"
            onClick={() => setShowLiveQuotes(true)}
            className={`${ffBtnSecondary} ${ffBtnInRow}`}
          >
            Open quote inbox
          </button>
          <p className="w-full text-center text-xs text-gray-500 lg:flex-[1_1_100%] xl:text-sm">
            After you pick suppliers, quotes appear here in real time — no refresh needed.
          </p>
          <button type="button" onClick={onNewJob} className={`${ffBtnGhost} lg:ml-auto`}>
            Cancel this job
          </button>
        </div>
      </div>
    </div>
  );
}
