import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SupplierDiscovery } from "../../components/owner/SupplierDiscovery";
import { SupplierDiscoveryMap } from "../../components/owner/SupplierDiscoveryMap";
import { JobStatusTracker } from "../../components/owner/JobStatusTracker";
import { LiveQuotesDashboard } from "../../components/owner/LiveQuotesDashboard";
import { OwnerHomeDashboard } from "../../components/owner/OwnerHomeDashboard";
import { OwnerJobPaymentPanel } from "../../components/owner/OwnerJobPaymentPanel";
import { OwnerAppShell, type OwnerTab } from "../../components/owner/OwnerAppShell";
import { OwnerNeedsYou } from "../../components/owner/OwnerNeedsYou";
import { OwnerActivity } from "../../components/owner/OwnerActivity";
import { OwnerAnalyzing } from "../../components/owner/OwnerAnalyzing";
import { InviteToast } from "../../components/owner/InviteToast";
import { OwnerStepHint } from "../../components/layout/OwnerStepHint";
import { useLanguage } from "../../lib/LanguageContext";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffBtnSecondary,
  ffBtnInRow,
  ffCard,
  ffInput,
  ffLabel,
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
import { zoneByIdName } from "../../lib/zones";
import { isNeedsYouJob } from "../../lib/ownerJobMeta";

type JobView = "detail" | "discovery" | "quotes";

export default function OwnerDashboard() {
  const jobs = useQuery(api.jobs.listMyJobs);
  const [tab, setTab] = useState<OwnerTab>("report");
  const [jobId, setJobId] = useState<Id<"jobs"> | null>(null);
  const [jobView, setJobView] = useState<JobView>("detail");
  const [inviteToastCount, setInviteToastCount] = useState<number | null>(null);

  const needsCount =
    jobs?.filter((j) => isNeedsYouJob(j.workflowStatus)).length ?? 0;

  const job = useQuery(api.jobs.getJob, jobId ? { jobId } : "skip");

  const inDeepFlow =
    Boolean(jobId) &&
    (job === undefined ||
      job?.status === "classifying" ||
      jobView === "discovery" ||
      (jobView === "detail" &&
        job !== null &&
        job !== undefined &&
        job.status === "open"));

  const showNav =
    !inDeepFlow ||
    jobView === "quotes" ||
    (jobView === "detail" &&
      job !== null &&
      job !== undefined &&
      (job.status === "awaiting_payment" ||
        job.status === "in_progress" ||
        job.status === "completed"));

  function clearJob() {
    setJobId(null);
    setJobView("detail");
  }

  function openJob(id: Id<"jobs">, view: JobView = "detail") {
    setJobId(id);
    setJobView(view);
  }

  function handleTabChange(next: OwnerTab) {
    setTab(next);
    clearJob();
  }

  function handleJobCreated(id: Id<"jobs">) {
    setJobId(id);
    setJobView("detail");
  }

  useEffect(() => {
    if (inviteToastCount === null) return;
    const t = window.setTimeout(() => {
      setInviteToastCount(null);
      setTab("activity");
      clearJob();
    }, 2800);
    return () => window.clearTimeout(t);
  }, [inviteToastCount]);

  return (
    <OwnerAppShell
      tab={tab}
      onTabChange={handleTabChange}
      needsCount={needsCount}
      showNav={showNav && inviteToastCount === null}
    >
      {inviteToastCount !== null && (
        <InviteToast
          count={inviteToastCount}
          onDismiss={() => {
            setInviteToastCount(null);
            setTab("activity");
            clearJob();
          }}
        />
      )}

      {jobId ? (
        <ClassificationResult
          jobId={jobId}
          jobView={jobView}
          setJobView={setJobView}
          onClose={() => {
            clearJob();
            setTab("activity");
          }}
          onInvited={(count) => setInviteToastCount(count)}
        />
      ) : tab === "needs" ? (
        <OwnerNeedsYou
          onCompareQuotes={(id) => openJob(id, "quotes")}
          onConfirmPayment={(id) => openJob(id, "detail")}
          onGoActivity={() => setTab("activity")}
          onGoReport={() => setTab("report")}
        />
      ) : tab === "activity" ? (
        <OwnerActivity
          onOpenJob={(id) => openJob(id, "detail")}
          onOpenQuotes={(id) => openJob(id, "quotes")}
        />
      ) : (
        <OwnerHomeDashboard onJobCreated={handleJobCreated} />
      )}
    </OwnerAppShell>
  );
}

export function getCategoryLabel(category: string, lang: string): string {
  const translations: Record<string, { si: string; ta: string }> = {
    Plumbing: { si: "නල පද්ධති", ta: "குழாய் வேலை" },
    Electrical: { si: "විදුලි පද්ධති", ta: "மின்சார வேலை" },
    Carpentry: { si: "වඩු වැඩ", ta: "தச்சு வேலை" },
    Roofing: { si: "වහලවල්", ta: "கூரை வேலை" },
    "General Maintenance": { si: "පොදු නඩත්තුව", ta: "பொது பராமரிப்பு" },
  };

  const key = category as keyof typeof translations;
  if (translations[key]) {
    return lang === "en" ? category : translations[key][lang === "si" ? "si" : "ta"];
  }
  return category;
}

function ClassificationResult({
  jobId,
  jobView,
  setJobView,
  onClose,
  onInvited,
}: {
  jobId: Id<"jobs">;
  jobView: JobView;
  setJobView: (v: JobView) => void;
  onClose: () => void;
  onInvited: (count: number) => void;
}) {
  const { t, language } = useLanguage();
  const job = useQuery(api.jobs.getJob, { jobId });
  const nearbySuppliers = useQuery(api.suppliers.getSuppliersNearJob, { jobId });
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
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (job === undefined || job === null || job.status === "classifying") return;
    // Open jobs: surface details so owners can edit without hunting for a toggle.
    if (job.status === "open") {
      setShowDetails(true);
    }
  }, [job]);


  useEffect(() => {
    if (job === undefined || job === null || job.status === "classifying") return;
    if (job.category && JOB_CATEGORIES.includes(job.category as JobCategory)) {
      setCategoryDraft(job.category as JobCategory);
    }
    if (job.urgency && JOB_URGENCIES.includes(job.urgency)) {
      setUrgencyDraft(job.urgency);
    }
  }, [job]);

  if (job === undefined) {
    return <p className="text-sm text-muted-foreground">{t("loadingJob")}</p>;
  }

  if (job === null) {
    return (
      <div>
        <p className="text-sm text-destructive">{t("cantLoadJob")}</p>
        <button type="button" onClick={onClose} className={`${ffBtnGhost} mt-4`}>
          {t("cancel")}
        </button>
      </div>
    );
  }

  if (job.status === "classifying") {
    return (
      <OwnerAnalyzing
        hasPhoto={Boolean(job.photoUrl)}
        zoneId={job.zoneId}
        onBack={onClose}
      />
    );
  }

  const urgency = job.urgency ?? "Medium";
  const urgencyStyle = {
    High: "bg-primary/10 text-primary ring-1 ring-primary/25 dark:bg-primary/15",
    Medium:
      "bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50",
    Low: "bg-teal-50 text-teal-800 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900/50",
  };

  const summary = job.aiSummary ?? "";
  const zoneName = zoneByIdName(job.zoneId);
  const zoneLabel = job.zoneId
    ? language === "si"
      ? job.zoneId === "kadana"
        ? "කඳාන"
        : job.zoneId === "rajagiriya"
          ? "රාජගිරිය"
          : job.zoneId === "nawala"
            ? "නාවල"
            : zoneName
      : language === "ta"
        ? job.zoneId === "kadana"
          ? "கந்தானை"
          : job.zoneId === "rajagiriya"
            ? "இராஜகிரிய"
            : job.zoneId === "nawala"
              ? "நாவல"
              : zoneName
        : zoneName
    : "";
  const hasJobLocation = job.lat != null && job.lng != null;

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
      setJobView("quotes");
      return;
    }
    if (step === 2) {
      if (loadedJob.category && !jobLocked) setJobView("discovery");
      else setJobView("detail");
      return;
    }
    setJobView("detail");
  }

  function canGoToOwnerStep(step: 1 | 2 | 3) {
    if (step === 1) return true;
    if (step === 2) return Boolean(loadedJob.category) && !jobLocked;
    if (step === 3) return true;
    return false;
  }

  if (jobView === "quotes") {
    return (
      <LiveQuotesDashboard
        jobId={jobId}
        onBack={() => setJobView("detail")}
        onGoToSuppliers={() => goToOwnerStep(2)}
        onStepClick={goToOwnerStep}
        canGoToStep={canGoToOwnerStep}
      />
    );
  }

  if (jobView === "discovery" && job.category) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setJobView("detail")}
          className={`${ffBtnGhost} mb-4 text-left`}
        >
          ← {t("editDetails")}
        </button>
        <header className="mb-6">
          <h1 className={ffScreenTitle}>{t("findNearbySuppliers")}</h1>
          <p className={ffScreenSubtitle}>
            {t("distancesFromPin")}
          </p>
        </header>
        {hasJobLocation ? (
          <SupplierDiscovery
            jobId={jobId}
            category={job.category}
            jobLat={job.lat ?? 7.0167}
            jobLng={job.lng ?? 79.9833}
            zoneId={job.zoneId}
            onBack={() => setJobView("detail")}
            onQuotesSent={(count) => {
              onInvited(count);
            }}
          />
        ) : (
          <div className={`${ffCard} text-sm text-muted-foreground`}>
            <p className="font-medium text-foreground">{t("locationIsMissing")}</p>
            <p className="mt-2 leading-relaxed">
              {t("locationIsMissingDesc")}
            </p>
            <button
              type="button"
              onClick={() => setJobView("detail")}
              className={`${ffBtnSecondary} mt-4`}
            >
              {t("backToJobDetails")}
            </button>
          </div>
        )}
      </div>
    );
  }

  const invitedCount = job.invitedCount ?? 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
            aria-hidden
          >
            ←
          </span>
          {t("activityTitle")}
        </button>
        {!jobLocked && (
          <button
            type="button"
            onClick={() => {
              setShowDetails(true);
              setShowCategoryEdit(true);
              setSummaryDraft(job.aiSummary ?? job.description);
              setEditingSummary(true);
            }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-white/10"
          >
            {t("editDetails")}
          </button>
        )}
      </div>

      {job.status === "open" ? (
        <OwnerStepHint
          active={1}
          onStepClick={goToOwnerStep}
          canGoToStep={canGoToOwnerStep}
        />
      ) : (
        <JobStatusTracker jobId={jobId} />
      )}

      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("issueLogged")}
        </p>
        <h1 className={ffScreenTitle}>
          {job.category ? getCategoryLabel(job.category, language) : t("repairRequestFallback")}
        </h1>
        <p className={ffScreenSubtitle}>
          {jobLocked
            ? t("statusEditsLocked")
            : t("reviewDetailsFindPros")}
        </p>
      </header>

      <OwnerJobPaymentPanel
        jobId={jobId}
        status={job.status}
        acceptedQuote={job.acceptedQuote ?? null}
        description={job.description}
        category={job.category}
        zoneId={job.zoneId}
        paidAt={job.paidAt}
      />

      <div className={`${ffCard} overflow-hidden p-0`}>
        {job.photoUrl ? (
          <img
            src={job.photoUrl}
            alt="Issue photo"
            className="max-h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-muted/50 text-sm text-muted-foreground">
            {t("noPhotoAttached")}
          </div>
        )}

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {job.category && (
              <span className="rounded-full bg-highlight/25 px-3 py-1 text-sm font-semibold text-highlight-foreground ring-1 ring-highlight/40">
                {getCategoryLabel(job.category, language)}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${urgencyStyle[urgency]}`}
            >
              {t((urgency.toLowerCase() + "Urgency") as any)}
            </span>
            {zoneLabel && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground ring-1 ring-border">
                {zoneLabel}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("professionalsRequested")}
              </p>
              <p className="mt-0.5 text-lg font-bold text-foreground">
                {invitedCount === 0
                  ? t("noneYet")
                  : `${invitedCount} ${t("invitedCountText")}`}
              </p>
            </div>
            {invitedCount > 0 && (
              <button
                type="button"
                onClick={() => setJobView("quotes")}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("viewQuotes")}
              </button>
            )}
          </div>

          {hasJobLocation && job.status === "open" && (
            <SupplierDiscoveryMap
              jobLat={job.lat!}
              jobLng={job.lng!}
              suppliers={nearbySuppliers ?? []}
              selected={[]}
              onToggle={() => undefined}
              heightClassName="h-40 sm:h-48"
              compact
            />
          )}

          {job.classificationFailed && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
              {t("cantReachAi")}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-sm font-semibold text-primary hover:underline"
              aria-expanded={showDetails}
            >
              {showDetails ? t("hideDetails") : t("seeDetails")}
            </button>
            {showDetails && (
              <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <div>
                  <p className={ffLabel}>{t("yourDescription")}</p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {job.description}
                  </p>
                </div>
                {summary && (
                  <div>
                    <p className={ffLabel}>{t("aiSummary")}</p>
                    {editingSummary && !jobLocked ? (
                      <div className="mt-2 flex flex-col gap-3">
                        <textarea
                          value={summaryDraft}
                          onChange={(e) => setSummaryDraft(e.target.value)}
                          rows={4}
                          className={`${ffInput} resize-none`}
                        />
                        {saveError && (
                          <p className="text-sm text-destructive">{saveError}</p>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => void handleSaveSummary()}
                            disabled={saving || !summaryDraft.trim()}
                            className={`${ffBtnPrimary} ${ffBtnInRow}`}
                          >
                            {saving ? t("saving") : t("saveSummary")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSummary(false);
                              setSaveError("");
                            }}
                            className={`${ffBtnSecondary} ${ffBtnInRow}`}
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                          {summary}
                        </p>
                        {!jobLocked && (
                          <button
                            type="button"
                            onClick={() => {
                              setSummaryDraft(summary);
                              setEditingSummary(true);
                            }}
                            className={`${ffBtnGhost} shrink-0 sm:w-auto`}
                          >
                            {t("editText")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!jobLocked && (
            <>
              {!showCategoryEdit ? (
                <button
                  type="button"
                  onClick={() => setShowCategoryEdit(true)}
                  className={`${ffBtnGhost} w-fit text-sm`}
                >
                  {t("adjustCategoryUrgency")}
                </button>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <div className="min-w-[200px] flex-1">
                      <label htmlFor="job-category" className={ffLabel}>
                        {t("tradeCategory")}
                      </label>
                      <select
                        id="job-category"
                        value={categoryDraft}
                        onChange={(e) =>
                          setCategoryDraft(e.target.value as JobCategory)
                        }
                        className={ffInput}
                      >
                        {JOB_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {getCategoryLabel(c, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-[140px] sm:w-40">
                      <label htmlFor="job-urgency" className={ffLabel}>
                        {t("labelUrgency")}
                      </label>
                      <select
                        id="job-urgency"
                        value={urgencyDraft}
                        onChange={(e) =>
                          setUrgencyDraft(e.target.value as JobUrgency)
                        }
                        className={ffInput}
                      >
                        {JOB_URGENCIES.map((u) => (
                          <option key={u} value={u}>
                            {t((u.toLowerCase() + "Urgency") as any)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {categorySaveError && (
                    <p className="text-sm text-destructive">{categorySaveError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveCategory()}
                      disabled={savingCategory}
                      className={`${ffBtnPrimary} ${ffBtnInRow}`}
                    >
                      {savingCategory ? t("saving") : t("save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryEdit(false);
                        setCategorySaveError("");
                      }}
                      className={`${ffBtnSecondary} ${ffBtnInRow}`}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!jobLocked && (
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setJobView("discovery")}
                disabled={!job.category}
                className={ffBtnPrimary}
              >
                {t("findNearbySuppliers")}
              </button>
              <button
                type="button"
                onClick={() => setJobView("quotes")}
                className={`${ffBtnGhost} mt-3`}
              >
                {t("openQuoteInbox")}
              </button>
            </div>
          )}

          {(job.status === "in_progress" ||
            job.status === "awaiting_payment" ||
            job.status === "completed") && (
            <button
              type="button"
              onClick={() => setJobView("quotes")}
              className={`${ffBtnSecondary} mt-1`}
            >
              {t("viewQuotes")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
