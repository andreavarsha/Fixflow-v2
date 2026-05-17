import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SupplierDiscovery } from "../../components/owner/SupplierDiscovery";
import { LiveQuotesDashboard } from "../../components/owner/LiveQuotesDashboard";
import { OwnerHomeDashboard } from "../../components/owner/OwnerHomeDashboard";
import { OwnerJobPaymentPanel } from "../../components/owner/OwnerJobPaymentPanel";
import { OwnerPastJobs } from "../../components/owner/OwnerPastJobs";
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
import { toUserFacingError } from "../../lib/userFacingError";
import {
  JOB_CATEGORIES,
  JOB_URGENCIES,
  type JobCategory,
  type JobUrgency,
} from "../../lib/jobCategories";

export default function OwnerDashboard() {
  const [jobId, setJobId] = useState<Id<"jobs"> | null>(null);

  if (jobId) {
    return (
      <ClassificationResult
        jobId={jobId}
        onNewJob={() => setJobId(null)}
        onOpenJob={setJobId}
      />
    );
  }

  return (
    <div className={ffPage}>
      <OwnerHomeDashboard onJobCreated={setJobId} />
    </div>
  );
}

function ClassificationResult({
  jobId,
  onNewJob,
  onOpenJob,
}: {
  jobId: Id<"jobs">;
  onNewJob: () => void;
  onOpenJob: (id: Id<"jobs">) => void;
}) {
  const job = useQuery(api.jobs.getJob, { jobId });
  const updateSummary = useMutation(api.jobs.updateSummary);
  const updateJobClassification = useMutation(api.jobs.updateJobClassification);
  const [editingSummary, setEditingSummary] = useState(false);
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<JobCategory>("General Maintenance");
  const [urgencyDraft, setUrgencyDraft] = useState<JobUrgency>("Medium");
  const [categorySaveError, setCategorySaveError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
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
    if (job.category && JOB_CATEGORIES.includes(job.category as JobCategory)) {
      setCategoryDraft(job.category as JobCategory);
    }
    if (job.urgency && JOB_URGENCIES.includes(job.urgency as JobUrgency)) {
      setUrgencyDraft(job.urgency as JobUrgency);
    }
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
          <p className={ffScreenSubtitle}>This usually takes a few seconds</p>
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
      setSaveError(toUserFacingError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCategory() {
    setCategorySaveError("");
    setSavingCategory(true);
    try {
      await updateJobClassification({
        jobId,
        category: categoryDraft,
        urgency: urgencyDraft,
      });
      setShowCategoryEdit(false);
    } catch (err: unknown) {
      setCategorySaveError(toUserFacingError(err));
    } finally {
      setSavingCategory(false);
    }
  }

  const loadedJob = job;

  const jobLocked =
    loadedJob.status === "in_progress" ||
    loadedJob.status === "awaiting_payment" ||
    loadedJob.status === "completed";

  function goToOwnerStep(step: 1 | 2 | 3) {
    if (step === 3) {
      setShowLiveQuotes(true);
      setShowDiscovery(false);
      return;
    }
    setShowLiveQuotes(false);
    if (step === 2) {
      if (loadedJob.category && !jobLocked) setShowDiscovery(true);
      else setShowDiscovery(false);
      return;
    }
    setShowDiscovery(false);
  }

  function canGoToOwnerStep(step: 1 | 2 | 3) {
    if (step === 1) return true;
    if (step === 2) return Boolean(loadedJob.category) && !jobLocked;
    if (step === 3) return true;
    return false;
  }

  if (showLiveQuotes) {
    return (
      <LiveQuotesDashboard
        jobId={jobId}
        onBack={() => goToOwnerStep(1)}
        onGoToSuppliers={() => goToOwnerStep(2)}
        onStepClick={goToOwnerStep}
        canGoToStep={canGoToOwnerStep}
      />
    );
  }

  if (showDiscovery && job.category) {
    return (
      <div className={ffPage}>
        <OwnerStepHint
          active={2}
          onStepClick={goToOwnerStep}
          canGoToStep={canGoToOwnerStep}
        />
        <button
          type="button"
          onClick={() => goToOwnerStep(3)}
          className={`${ffBtnGhost} -mt-2 mb-4 text-left`}
        >
          View quote inbox →
        </button>
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
      <OwnerStepHint
        active={1}
        onStepClick={goToOwnerStep}
        canGoToStep={canGoToOwnerStep}
      />
      <header className="mb-6 pr-12 sm:pr-14">
        <h1 className={ffScreenTitle}>FixFlow AI</h1>
        <p className={ffScreenSubtitle}>Here&apos;s what we understood</p>
      </header>

      <OwnerJobPaymentPanel
        jobId={jobId}
        status={job.status}
        acceptedQuote={job.acceptedQuote ?? null}
      />

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

            <div className="flex flex-col gap-3">
              {job.classificationFailed && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
                  We couldn&apos;t reach the AI classifier — please check the category below
                  or adjust it before finding suppliers.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
              {job.category && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                  {job.category}
                </span>
              )}
              {job.subcategory && job.subcategory !== "Needs review" && (
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

              {!showCategoryEdit ? (
                <button
                  type="button"
                  onClick={() => setShowCategoryEdit(true)}
                  className={`${ffBtnGhost} w-fit text-sm`}
                >
                  Adjust category & urgency
                </button>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    Change category <span className="font-normal text-gray-500">(optional)</span>
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <div className="min-w-[200px] flex-1">
                      <label htmlFor="job-category" className={ffLabel}>
                        Trade category
                      </label>
                      <select
                        id="job-category"
                        value={categoryDraft}
                        onChange={(e) => setCategoryDraft(e.target.value as JobCategory)}
                        className={ffInput}
                      >
                        {JOB_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-[140px] sm:w-40">
                      <label htmlFor="job-urgency" className={ffLabel}>
                        Urgency
                      </label>
                      <select
                        id="job-urgency"
                        value={urgencyDraft}
                        onChange={(e) => setUrgencyDraft(e.target.value as JobUrgency)}
                        className={ffInput}
                      >
                        {JOB_URGENCIES.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {categorySaveError && (
                    <p className="text-sm text-red-600">{categorySaveError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveCategory()}
                      disabled={savingCategory}
                      className={`${ffBtnPrimary} ${ffBtnInRow}`}
                    >
                      {savingCategory ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryEdit(false);
                        setCategorySaveError("");
                        if (job.category && JOB_CATEGORIES.includes(job.category as JobCategory)) {
                          setCategoryDraft(job.category as JobCategory);
                        }
                        if (job.urgency) setUrgencyDraft(job.urgency as JobUrgency);
                      }}
                      className={`${ffBtnSecondary} ${ffBtnInRow}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
            {jobLocked ? "Job actions" : "Next steps"}
          </p>
          {!jobLocked && (
            <>
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
            </>
          )}
          {job.status === "open" && (
            <button
              type="button"
              onClick={() => setShowLiveQuotes(true)}
              className={`${ffBtnSecondary} ${ffBtnInRow}`}
            >
              Open quote inbox
            </button>
          )}
          <button type="button" onClick={onNewJob} className={`${ffBtnGhost} lg:ml-auto`}>
            All my requests
          </button>
        </div>
      </div>

      <OwnerPastJobs onOpenJob={onOpenJob} currentJobId={jobId} />
    </div>
  );
}
