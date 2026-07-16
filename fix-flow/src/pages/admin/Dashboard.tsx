import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router-dom";
import { MapContainer, CircleMarker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ffBtnPrimary,
  ffBtnSecondary,
  ffCard,
  ffInput,
  ffLabel,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";
import { JOB_CATEGORIES, JOB_URGENCIES, type JobUrgency } from "../../lib/jobCategories";
import { toUserFacingError } from "../../lib/userFacingError";

// Helper to keep map centered on selected job location
function MapCenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [map, lat, lng]);
  return null;
}

function renderStars(rating: number | undefined) {
  if (rating === undefined || rating === 0) return <span className="text-muted-foreground/50 text-xs">Unrated</span>;
  const rounded = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className="text-amber-500 font-semibold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-muted-foreground/30">{"★".repeat(5 - rounded)}</span>
      <span className="ml-1 text-[10px] text-muted-foreground">({rating.toFixed(1)})</span>
    </span>
  );
}

export default function AdminDashboard() {
  const jobs = useQuery(api.admin.listAllJobs);
  const users = useQuery(api.admin.listAllUsers);
  const overrideJob = useMutation(api.admin.overrideJob);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<"moderation" | "archive" | "analytics" >("moderation");

  // Audit Job modal state
  const [selectedJobId, setSelectedJobId] = useState<Id<"jobs"> | null>(null);
  
  // Filter States - Moderation Tab
  const [modSearch, setModSearch] = useState("");
  const [modStatus, setModStatus] = useState<string>("all");
  const [modUrgency, setModUrgency] = useState<string>("all");
  const [modCategory, setModCategory] = useState<string>("all");

  // Filter States - Archive Tab
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveRating, setArchiveRating] = useState<string>("all");

  // Override Form states
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [urgency, setUrgency] = useState<JobUrgency>("Medium");
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummarySi, setAiSummarySi] = useState("");
  const [aiSummaryTa, setAiSummaryTa] = useState("");

  const selectedJob = jobs?.find((j) => j._id === selectedJobId);
  const quotes = useQuery(
    api.admin.getJobQuotes,
    selectedJobId ? { jobId: selectedJobId } : "skip"
  );

  // Sync form state when selected job changes
  useEffect(() => {
    if (selectedJob) {
      setCategory(selectedJob.category ?? "");
      setSubcategory(selectedJob.subcategory ?? "");
      setUrgency((selectedJob.urgency as JobUrgency) ?? "Medium");
      setAiSummary(selectedJob.aiSummary ?? "");
      setAiSummarySi(selectedJob.aiSummary_si ?? "");
      setAiSummaryTa(selectedJob.aiSummary_ta ?? "");
      setSuccessMessage("");
      setError("");
    }
  }, [selectedJobId, selectedJob]);

  async function handleSignOut() {
    try {
      await signOut();
      void navigate("/login", { replace: true });
    } catch (err: unknown) {
      console.error(err);
    }
  }

  async function handleOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJobId) return;

    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      await overrideJob({
        jobId: selectedJobId,
        category,
        subcategory: subcategory.trim() || "General",
        urgency,
        aiSummary: aiSummary.trim(),
        aiSummary_si: aiSummarySi.trim() || undefined,
        aiSummary_ta: aiSummaryTa.trim() || undefined,
      });
      setSuccessMessage("AI classification successfully overridden by human-in-the-loop!");
    } catch (err: unknown) {
      setError(toUserFacingError(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Active Moderation Filter logic
  const moderationJobs = jobs?.filter((job) => {
    // Exclude completed status
    if (job.status === "completed") return false;

    // Filter by search term
    if (modSearch.trim()) {
      const term = modSearch.toLowerCase();
      const match =
        job.description.toLowerCase().includes(term) ||
        (job.category?.toLowerCase() || "").includes(term) ||
        (job.ownerEmail?.toLowerCase() || "").includes(term) ||
        (job.ownerName?.toLowerCase() || "").includes(term);
      if (!match) return false;
    }

    // Filter by status
    if (modStatus !== "all" && job.status !== modStatus) return false;

    // Filter by urgency
    if (modUrgency !== "all" && job.urgency !== modUrgency) return false;

    // Filter by category
    if (modCategory !== "all" && job.category !== modCategory) return false;

    return true;
  });

  // Archive Filter logic
  const archivedJobs = jobs?.filter((job) => {
    // Only completed status
    if (job.status !== "completed") return false;

    // Filter by search term
    if (archiveSearch.trim()) {
      const term = archiveSearch.toLowerCase();
      const match =
        job.description.toLowerCase().includes(term) ||
        (job.category?.toLowerCase() || "").includes(term) ||
        (job.hiredSupplierName?.toLowerCase() || "").includes(term) ||
        (job.ownerName?.toLowerCase() || "").includes(term) ||
        (job.ownerEmail?.toLowerCase() || "").includes(term);
      if (!match) return false;
    }

    // Filter by rating
    if (archiveRating !== "all") {
      const ratingVal = Number(archiveRating);
      if (job.rating === undefined || job.rating < ratingVal) return false;
    }

    return true;
  });

  // Analytics Computation
  const suppliers = users?.filter((u) => u.role === "supplier") ?? [];
  const owners = users?.filter((u) => u.role === "owner") ?? [];
  
  // Total stats
  const totalRevenue = jobs
    ?.filter((j) => j.status === "completed" && j.priceLKR !== undefined)
    .reduce((sum, j) => sum + (j.priceLKR ?? 0), 0) ?? 0;

  const averageRating = (() => {
    const jobsWithRatings = jobs?.filter((j) => j.rating !== undefined) ?? [];
    return jobsWithRatings.length > 0
      ? jobsWithRatings.reduce((sum, j) => sum + (j.rating ?? 0), 0) / jobsWithRatings.length
      : 0;
  })();

  // Group jobs by month
  const monthlyJobCounts: Record<string, number> = {};
  jobs?.forEach((job) => {
    const date = new Date(job._creationTime);
    const label = date.toLocaleString("en-US", { month: "short", year: "numeric" });
    monthlyJobCounts[label] = (monthlyJobCounts[label] || 0) + 1;
  });
  const monthlyBars = Object.entries(monthlyJobCounts).map(([label, count]) => ({
    label,
    count,
  }));
  const maxJobsInMonth = Math.max(...monthlyBars.map((b) => b.count), 1);

  // Supplier rating summaries
  const supplierLeaderboard = suppliers.map((sup) => {
    const supJobs = jobs?.filter((j) => j.acceptedSupplierId === sup._id) ?? [];
    const supCompleted = supJobs.filter((j) => j.status === "completed");
    const supRatings = supCompleted.filter((j) => j.rating !== undefined);
    
    const calculatedRating =
      supRatings.length > 0
        ? supRatings.reduce((sum, j) => sum + (j.rating ?? 0), 0) / supRatings.length
        : sup.rating ?? 5.0;

    return {
      ...sup,
      completedJobsCount: supCompleted.length,
      avgRating: calculatedRating,
    };
  }).sort((a, b) => b.avgRating - a.avgRating || b.completedJobsCount - a.completedJobsCount);

  // Owner submitted audits
  const ownerStats = owners.map((own) => {
    const ownJobs = jobs?.filter((j) => j.ownerId === own._id) ?? [];
    const active = ownJobs.filter((j) => j.status !== "completed").length;
    return {
      ...own,
      totalSubmitted: ownJobs.length,
      activeJobs: active,
    };
  }).sort((a, b) => b.totalSubmitted - a.totalSubmitted);

  return (
    <div className={ffPage}>
      {/* Header */}
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={ffScreenTitle}>Admin Workspace</h1>
          <p className={ffScreenSubtitle}>
            Human-in-the-loop oversight portal. Monitor ratings, override AI classifications, and audit quotes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
          className={`${ffBtnSecondary} w-auto self-start px-4 text-sm`}
        >
          Sign out
        </button>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("moderation")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "moderation"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Active Moderation Queue ({moderationJobs?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archive")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "archive"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Completed Archives ({archivedJobs?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Marketplace Analytics
        </button>
      </div>

      {/* Tab 1: Active Moderation Queue */}
      {activeTab === "moderation" && (
        <div>
          {/* Moderation Filters */}
          <div className={`${ffCard} mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4`}>
            <div>
              <label htmlFor="search-mod" className={ffLabel}>Search Jobs</label>
              <input
                id="search-mod"
                type="text"
                placeholder="Description, owner..."
                value={modSearch}
                onChange={(e) => setModSearch(e.target.value)}
                className={ffInput}
              />
            </div>
            <div>
              <label htmlFor="filter-status" className={ffLabel}>Job Status</label>
              <select
                id="filter-status"
                value={modStatus}
                onChange={(e) => setModStatus(e.target.value)}
                className={ffInput}
              >
                <option value="all">All Active States</option>
                <option value="classifying">Classifying</option>
                <option value="open">Open Marketplace</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_payment">Awaiting Payment</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-urgency" className={ffLabel}>Urgency</label>
              <select
                id="filter-urgency"
                value={modUrgency}
                onChange={(e) => setModUrgency(e.target.value)}
                className={ffInput}
              >
                <option value="all">All Urgency</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-category" className={ffLabel}>Category</label>
              <select
                id="filter-category"
                value={modCategory}
                onChange={(e) => setModCategory(e.target.value)}
                className={ffInput}
              >
                <option value="all">All Categories</option>
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Moderation Table */}
          <div className={ffCard}>
            {jobs === undefined ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading active jobs list…</p>
            ) : moderationJobs?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No active jobs match the filter constraints.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Created</th>
                      <th className="pb-3 font-semibold">Homeowner</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Urgency</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold text-center">Quotes</th>
                      <th className="pb-3 font-semibold text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {moderationJobs?.map((job) => (
                      <tr key={job._id} className="hover:bg-muted/10">
                        <td className="py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(job._creationTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5">
                          <span className="font-semibold text-foreground block">{job.ownerName ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground block">{job.ownerEmail}</span>
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                            {job.category ?? "Unclassified"}
                          </span>
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className={`text-xs font-semibold ${
                            job.urgency === "High"
                              ? "text-red-500"
                              : job.urgency === "Medium"
                                ? "text-amber-500"
                                : "text-teal-500"
                          }`}>
                            {job.urgency ?? "Medium"}
                          </span>
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            job.status === "classifying"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse"
                              : "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-xs truncate text-muted-foreground">
                          {job.description}
                        </td>
                        <td className="py-3.5 text-center font-semibold text-foreground">
                          {job.quotesCount}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedJobId(job._id)}
                            className={`${ffBtnSecondary} w-auto text-xs px-3 py-1`}
                          >
                            Audit & Override
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Completed Archives */}
      {activeTab === "archive" && (
        <div>
          {/* Completed Filters */}
          <div className={`${ffCard} mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2`}>
            <div>
              <label htmlFor="search-archive" className={ffLabel}>Search Archive</label>
              <input
                id="search-archive"
                type="text"
                placeholder="Description, owner, tradesperson..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className={ffInput}
              />
            </div>
            <div>
              <label htmlFor="filter-rating" className={ffLabel}>Min Rating Filter</label>
              <select
                id="filter-rating"
                value={archiveRating}
                onChange={(e) => setArchiveRating(e.target.value)}
                className={ffInput}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars only</option>
                <option value="4">4 Stars or higher</option>
                <option value="3">3 Stars or higher</option>
              </select>
            </div>
          </div>

          {/* Archived Completed Jobs Table */}
          <div className={ffCard}>
            {jobs === undefined ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading completed archive…</p>
            ) : archivedJobs?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No completed jobs match your filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Date Completed</th>
                      <th className="pb-3 font-semibold">Homeowner</th>
                      <th className="pb-3 font-semibold">Hired Tradesperson</th>
                      <th className="pb-3 font-semibold">Cost (LKR)</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Customer Rating</th>
                      <th className="pb-3 font-semibold">Review Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {archivedJobs?.map((job) => (
                      <tr key={job._id} className="hover:bg-muted/10">
                        <td className="py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {job.workCompletedAt
                            ? new Date(job.workCompletedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="py-3.5">
                          <span className="font-semibold text-foreground block">{job.ownerName ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground block">{job.ownerEmail}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-semibold text-foreground block">{job.hiredSupplierName ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground block">{job.hiredSupplierEmail}</span>
                        </td>
                        <td className="py-3.5 font-bold text-foreground whitespace-nowrap">
                          {job.priceLKR !== undefined ? `LKR ${job.priceLKR.toLocaleString("en-LK")}` : "—"}
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                            {job.category ?? "General"}
                          </span>
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          {renderStars(job.rating)}
                        </td>
                        <td className="py-3.5 text-xs text-muted-foreground max-w-xs italic truncate">
                          {job.comment ? `"${job.comment}"` : "No review comments."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Marketplace Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key Aggregate Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className={ffCard}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marketplace Volume</h4>
              <p className="mt-2 text-2xl font-bold text-foreground">{jobs?.length ?? "…"}</p>
              <span className="text-[10px] text-muted-foreground block mt-1">Total submitted jobs to date</span>
            </div>
            <div className={ffCard}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Invoices Settled</h4>
              <p className="mt-2 text-2xl font-bold text-emerald-500">
                LKR {totalRevenue.toLocaleString("en-LK")}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-1">Platform gross transaction value</span>
            </div>
            <div className={ffCard}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Customer Satisfaction</h4>
              <p className="mt-2 text-2xl font-bold text-amber-500">
                {averageRating > 0 ? `★ ${averageRating.toFixed(1)}` : "★ —"}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-1">Hired tradesperson feedback avg</span>
            </div>
            <div className={ffCard}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Registrations</h4>
              <p className="mt-2 text-2xl font-bold text-primary">
                {users?.length ?? "…"}
              </p>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {suppliers.length} Tradespersons · {owners.length} Homeowners
              </span>
            </div>
          </section>

          {/* SVG Monthly Chart & Leaderboard split */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Monthly Growth */}
            <div className={`${ffCard} lg:col-span-5`}>
              <h3 className="text-base font-bold text-foreground mb-4">Jobs Received Per Month</h3>
              {monthlyBars.length === 0 ? (
                <p className="text-sm text-muted-foreground">No historical monthly data found.</p>
              ) : (
                <div className="space-y-4">
                  {monthlyBars.map((bar) => {
                    const percent = Math.max(8, (bar.count / maxJobsInMonth) * 100);
                    return (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-muted-foreground">{bar.label}</span>
                          <span className="font-bold text-foreground">{bar.count} jobs</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-[#0076b6] dark:bg-[#56c3b7] rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Supplier Leaderboard */}
            <div className={`${ffCard} lg:col-span-7`}>
              <h3 className="text-base font-bold text-foreground mb-4">Top Rated Tradespersons</h3>
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registered suppliers found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                        <th className="pb-2 font-semibold">Tradesperson</th>
                        <th className="pb-2 font-semibold">Category</th>
                        <th className="pb-2 font-semibold text-center">Jobs Completed</th>
                        <th className="pb-2 font-semibold text-right">Average Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {supplierLeaderboard.slice(0, 5).map((sup) => (
                        <tr key={sup._id} className="hover:bg-muted/10">
                          <td className="py-2.5">
                            <span className="font-semibold text-foreground block">{sup.name}</span>
                            <span className="text-[10px] text-muted-foreground block">{sup.email}</span>
                          </td>
                          <td className="py-2.5 font-medium text-foreground">{sup.category ?? "General"}</td>
                          <td className="py-2.5 text-center font-bold text-foreground">{sup.completedJobsCount}</td>
                          <td className="py-2.5 text-right">{renderStars(sup.avgRating)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Homeowner Audit Logs */}
          <div className={ffCard}>
            <h3 className="text-base font-bold text-foreground mb-4">Homeowner Submission Audits</h3>
            {owners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registered homeowners found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                      <th className="pb-2 font-semibold">Homeowner</th>
                      <th className="pb-2 font-semibold">Email</th>
                      <th className="pb-2 font-semibold text-center">Total Jobs Submitted</th>
                      <th className="pb-2 font-semibold text-center">Active Jobs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ownerStats.map((own) => (
                      <tr key={own._id} className="hover:bg-muted/10">
                        <td className="py-2.5 font-semibold text-foreground">{own.name ?? "Unknown"}</td>
                        <td className="py-2.5 text-muted-foreground">{own.email}</td>
                        <td className="py-2.5 text-center font-bold text-foreground">{own.totalSubmitted}</td>
                        <td className="py-2.5 text-center text-muted-foreground">{own.activeJobs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit & Classification Override Overlay Modal */}
      {selectedJobId && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className={`${ffCard} w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border shadow-2xl relative`}>
            {/* Close modal */}
            <button
              type="button"
              onClick={() => setSelectedJobId(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close dialog"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-foreground">Job Audit & Override</h3>
            <p className="mt-1 text-xs text-muted-foreground mb-6">
              Job ID: {selectedJob._id} · Owner: {selectedJob.ownerName} ({selectedJob.ownerEmail})
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Side: Map and Details */}
              <div className="space-y-4">
                {/* Leaflet Map Preview */}
                {selectedJob.lat !== undefined && selectedJob.lng !== undefined && (
                  <div className="h-48 w-full overflow-hidden rounded-xl border border-border">
                    <MapContainer
                      center={[selectedJob.lat, selectedJob.lng]}
                      zoom={14}
                      className="h-full w-full"
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapCenterController lat={selectedJob.lat} lng={selectedJob.lng} />
                      <CircleMarker
                        center={[selectedJob.lat, selectedJob.lng]}
                        radius={10}
                        pathOptions={{
                          color: "#0076b6",
                          fillColor: "#0076b6",
                          fillOpacity: 0.85,
                        }}
                      />
                    </MapContainer>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Original Description</span>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.addressNote && (
                  <div className="rounded-xl bg-teal-50/50 p-4 border border-teal-100/60 dark:bg-teal-950/20 dark:border-teal-900/50">
                    <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Homeowner Address Note</span>
                    <p className="mt-1 text-xs font-medium text-teal-900 dark:text-teal-200">{selectedJob.addressNote}</p>
                  </div>
                )}

                {/* Quotes Audit list */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Active Quotes ({quotes?.length ?? 0})</span>
                  {quotes === undefined ? (
                    <p className="text-xs text-muted-foreground">Loading quotes log…</p>
                  ) : quotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No quotes or invitations sent for this job yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                            <th className="pb-1 font-semibold">Supplier</th>
                            <th className="pb-1 font-semibold">Status</th>
                            <th className="pb-1 font-semibold">Price</th>
                            <th className="pb-1 font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotes.map((q) => (
                            <tr key={q._id} className="border-b border-border/60 hover:bg-muted/10">
                              <td className="py-2 font-medium text-foreground">
                                {q.supplierName ?? "Tradesperson"}
                                <span className="block text-[9px] text-muted-foreground">{q.supplierEmail}</span>
                              </td>
                              <td className="py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase ${
                                    q.status === "accepted"
                                      ? "bg-[#4CAF50]/15 text-[#4CAF50] dark:bg-[#4CAF50]/20"
                                      : q.status === "quoted"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {q.status}
                                </span>
                              </td>
                              <td className="py-2 font-semibold text-foreground">
                                {q.priceLKR !== undefined ? `LKR ${q.priceLKR.toLocaleString("en-LK")}` : "—"}
                              </td>
                              <td className="py-2 text-muted-foreground">{q.duration ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Override Form */}
              <div className="border-t border-border pt-6 lg:border-t-0 lg:pt-0 lg:pl-6 lg:border-l">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">AI Classification Override</span>
                <form onSubmit={(e) => { void handleOverride(e); }} className="flex flex-col gap-4">
                  {successMessage && (
                    <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-200" role="alert">
                      {successMessage}
                    </p>
                  )}
                  {error && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="modal-category" className={ffLabel}>Category</label>
                      <select
                        id="modal-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={ffInput}
                        required
                      >
                        <option value="" disabled>Select category</option>
                        {JOB_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="modal-subcategory" className={ffLabel}>Subcategory</label>
                      <input
                        id="modal-subcategory"
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className={ffInput}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modal-urgency" className={ffLabel}>Urgency</label>
                    <select
                      id="modal-urgency"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as JobUrgency)}
                      className={ffInput}
                      required
                    >
                      {JOB_URGENCIES.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modal-summary-en" className={ffLabel}>Summary (English)</label>
                    <textarea
                      id="modal-summary-en"
                      value={aiSummary}
                      onChange={(e) => setAiSummary(e.target.value)}
                      className={ffInput}
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="modal-summary-si" className={ffLabel}>Sinhala Summary (සිංහල)</label>
                      <textarea
                        id="modal-summary-si"
                        value={aiSummarySi}
                        onChange={(e) => setAiSummarySi(e.target.value)}
                        className={ffInput}
                        rows={2}
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-summary-ta" className={ffLabel}>Tamil Summary (தமிழ்)</label>
                      <textarea
                        id="modal-summary-ta"
                        value={aiSummaryTa}
                        onChange={(e) => setAiSummaryTa(e.target.value)}
                        className={ffInput}
                        rows={2}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} className={ffBtnPrimary}>
                    {submitting ? "Saving overrides…" : "Submit Human-in-the-Loop Override"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedJobId(null)}
                    className={`${ffBtnSecondary} mt-1`}
                  >
                    Close Dialog
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
