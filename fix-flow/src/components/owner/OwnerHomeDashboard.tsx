import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { OwnerStepHint } from "../layout/OwnerStepHint";
import { OwnerPastJobs } from "./OwnerPastJobs";
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
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 pr-12 sm:pr-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Homeowner
        </p>
        <h1 className={ffScreenTitle}>FixFlow AI</h1>
        <p className={ffScreenSubtitle}>
          Report a repair, compare quotes, and hire a tradesperson — all in one
          place.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
        <section className="lg:col-span-7 xl:col-span-8">
          <div className={`${ffCard} overflow-hidden p-0`}>
            <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-5 py-4 sm:px-6 sm:py-5">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                New repair request
              </h2>
              <p className="mt-1 max-w-lg text-sm text-gray-600">
                Pin where the work is, describe the issue, then invite nearby
                pros.
              </p>
              <div className="mt-4">
                <OwnerStepHint active={1} compact />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7"
            >
              <JobLocationPicker value={location} onChange={setLocation} />

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
                  rows={5}
                  required
                  className={`${ffInput} resize-none`}
                />
                <p className="mt-1.5 text-right text-xs text-gray-400">
                  {description.length}/300
                </p>
              </div>

              <div>
                <span className={ffLabel}>
                  Photo <span className="font-normal text-gray-500">(optional)</span>
                </span>
                <label
                  htmlFor="issue-photo"
                  className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <span className="text-2xl" aria-hidden>
                    📷
                  </span>
                  <span className="mt-2 text-sm font-medium text-gray-800">
                    {photo ? photo.name : "Add a photo"}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
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
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !description.trim() || !location}
                className={`${ffBtnPrimary} sm:max-w-xs`}
              >
                {submitting ? "Analysing…" : "Continue"}
              </button>
            </form>
          </div>
        </section>

        <aside className="lg:col-span-5 xl:col-span-4">
          <OwnerPastJobs onOpenJob={onJobCreated} variant="sidebar" />
        </aside>
      </div>
    </div>
  );
}
