import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  JobLocationPicker,
  type LatLng,
} from "./JobLocationPicker";
import { WaitlistCapture } from "./WaitlistCapture";
import { resolveZone } from "../../lib/zones";
import {
  ffBtnPrimary,
  ffCard,
  ffInput,
  ffLabel,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";

const COMMON_ISSUES: { label: string; description: string }[] = [
  {
    label: "Leak",
    description: "Water leaking — need a plumber to inspect and fix.",
  },
  {
    label: "No power",
    description: "No power or electrical issue — need an electrician.",
  },
  {
    label: "Lock/door",
    description: "Door or lock problem — need a locksmith or carpenter.",
  },
  {
    label: "Garden",
    description: "Garden or outdoor maintenance needed.",
  },
  {
    label: "Painting",
    description: "Need painting or wall touch-up work.",
  },
];

type OwnerHomeDashboardProps = {
  onJobCreated: (jobId: Id<"jobs">) => void;
};

export function OwnerHomeDashboard({ onJobCreated }: OwnerHomeDashboardProps) {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const submitJob = useMutation(api.jobs.submitJob);

  async function uploadPhoto(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("Photo upload failed");
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    if (!location) {
      setError("Set the job location on the map before continuing.");
      return;
    }

    const zone = resolveZone(location.lat, location.lng);
    if (!zone) {
      setShowWaitlist(true);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const photoId = photo ? await uploadPhoto(photo) : undefined;
      const id = await submitJob({
        description: description.trim(),
        photoId,
        lat: location.lat,
        lng: location.lng,
      });
      onJobCreated(id);
    } catch (err: unknown) {
      const message = toUserFacingError(err);
      if (
        message.toLowerCase().includes("waitlist") ||
        message.toLowerCase().includes("not live")
      ) {
        setShowWaitlist(true);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (showWaitlist && location) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <WaitlistCapture
          location={location}
          onBack={() => setShowWaitlist(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
      <header className="mb-6 flex flex-col items-center text-center pr-0 sm:pr-0">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl font-light text-primary-foreground shadow-md"
          aria-hidden
        >
          +
        </div>
        <h1 className={ffScreenTitle}>Report an issue</h1>
        <p className={ffScreenSubtitle}>
          Pin the location, describe it, add a photo.
        </p>
      </header>

      <div className={`${ffCard} overflow-hidden p-0`}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7"
        >
          <JobLocationPicker value={location} onChange={setLocation} />

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Or start from a common issue
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_ISSUES.map((issue) => (
                <button
                  key={issue.label}
                  type="button"
                  onClick={() => setDescription(issue.description)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/90 transition hover:border-primary hover:bg-accent"
                >
                  {issue.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="issue-desc" className={ffLabel}>
              What&apos;s the problem?
            </label>
            <textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water leaking under the kitchen sink, getting worse."
              maxLength={300}
              rows={4}
              required
              className={`${ffInput} resize-none`}
            />
            <p className="mt-1.5 text-right text-xs text-muted-foreground/70">
              {description.length}/300
            </p>
          </div>

          <div>
            <span className={ffLabel}>
              Photo <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <label
              htmlFor="issue-photo"
              className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-center transition hover:border-primary/40 hover:bg-muted"
            >
              <span className="text-sm font-medium text-foreground/90">
                {photo ? photo.name : "Add a photo"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Helps us classify the issue faster
              </span>
              <input
                id="issue-photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error && (
            <p
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !description.trim() || !location}
            className={ffBtnPrimary}
          >
            {submitting ? "Submitting…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
