import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "../../lib/LanguageContext";
import {
  IconGarden,
  IconLockDoor,
  IconPlumbing,
  IconRoof,
} from "../icons";
import {
  JobLocationPicker,
  type LatLng,
} from "./JobLocationPicker";
import { WaitlistCapture } from "./WaitlistCapture";
import { resolveZone } from "../../lib/zones";
import {
  ffBtnPrimary,
  ffBtnSecondary,
  ffCard,
  ffInput,
  ffLabel,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";
import type { JobCategory } from "../../lib/jobCategories";

type CommonIssueKey = "roofCard" | "gardenCard" | "plumbingCard" | "lockDoorCard";
type CommonIssueDescKey = "roofDesc" | "gardenDesc" | "plumbingDesc" | "lockDoorDesc";

const COMMON_ISSUES: {
  labelKey: CommonIssueKey;
  category: JobCategory;
  descriptionKey: CommonIssueDescKey;
  Icon: typeof IconRoof;
}[] = [
  {
    labelKey: "roofCard",
    category: "Roofing",
    descriptionKey: "roofDesc",
    Icon: IconRoof,
  },
  {
    labelKey: "gardenCard",
    category: "Garden / Landscaping",
    descriptionKey: "gardenDesc",
    Icon: IconGarden,
  },
  {
    labelKey: "plumbingCard",
    category: "Plumbing",
    descriptionKey: "plumbingDesc",
    Icon: IconPlumbing,
  },
  {
    labelKey: "lockDoorCard",
    category: "Carpentry",
    descriptionKey: "lockDoorDesc",
    Icon: IconLockDoor,
  },
];

type OwnerHomeDashboardProps = {
  onJobCreated: (jobId: Id<"jobs">) => void;
};

export function OwnerHomeDashboard({ onJobCreated }: OwnerHomeDashboardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [description, setDescription] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [preferredCategory, setPreferredCategory] = useState<JobCategory | null>(
    null,
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [addressNote, setAddressNote] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
  const submitJob = useMutation(api.jobs.submitJob);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

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

  function handleSelectIssue(issue: (typeof COMMON_ISSUES)[number]) {
    setSelectedIssue(issue.labelKey);
    setPreferredCategory(issue.category);
    setDescription(t(issue.descriptionKey));
  }

  function clearPhoto() {
    setPhoto(null);
  }

  function goToStep2() {
    setError("");
    if (!location) {
      setError(t("errorSetLocation"));
      return;
    }
    const zone = resolveZone(location.lat, location.lng);
    if (!zone) {
      setShowWaitlist(true);
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    const fallback = selectedIssue
      ? t(COMMON_ISSUES.find((i) => i.labelKey === selectedIssue)!.descriptionKey)
      : "";
    const finalDescription = trimmed || fallback;
    if (!finalDescription) {
      setError(t("errorPickIssue"));
      return;
    }
    if (!location) {
      setError(t("errorSetLocation"));
      setStep(1);
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
        description: finalDescription,
        photoId,
        lat: location.lat,
        lng: location.lng,
        addressNote: addressNote.trim() || undefined,
        preferredCategory: preferredCategory ?? undefined,
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
      <header className="mb-6 text-center">
        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep(1);
            }}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
              aria-hidden
            >
              ←
            </span>
            {t("backToLocation")}
          </button>
        )}
        <h1 className={ffScreenTitle}>{t("formTitle")}</h1>
        <p className={ffScreenSubtitle}>
          {step === 1 ? t("step1Title") : t("step2Title")}
        </p>
        <div className="mt-4 flex justify-center gap-2" aria-hidden>
          <span
            className={`h-1.5 w-10 rounded-full ${step >= 1 ? "bg-highlight" : "bg-muted"}`}
          />
          <span
            className={`h-1.5 w-10 rounded-full ${step === 2 ? "bg-highlight" : "bg-muted"}`}
          />
        </div>
      </header>

      <div className={`${ffCard} overflow-hidden p-0`}>
        {step === 1 ? (
          <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7">
            <JobLocationPicker value={location} onChange={setLocation} />

            <div>
              <label htmlFor="address-note" className={ffLabel}>
                {t("labelAddress")}
              </label>
              <input
                id="address-note"
                type="text"
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder={t("placeholderAddress")}
                maxLength={200}
                className={ffInput}
              />
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("addressTip")}
              </p>
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
              type="button"
              onClick={goToStep2}
              disabled={!location}
              className={ffBtnPrimary}
            >
              {t("btnContinue")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="flex flex-col gap-6 px-5 py-6 sm:px-6 sm:py-7"
          >
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("issueTypeLabel")}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {COMMON_ISSUES.map((issue) => {
                  const selected = selectedIssue === issue.labelKey;
                  return (
                     <button
                       key={issue.labelKey}
                       type="button"
                       onClick={() => handleSelectIssue(issue)}
                       className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm font-medium transition ${
                         selected
                           ? "border-highlight bg-highlight/20 text-highlight-foreground ring-2 ring-highlight/50"
                           : "border-border bg-card text-foreground/90 hover:border-highlight/60 hover:bg-white/10"
                       }`}
                     >
                       <issue.Icon size={44} />
                       {t(issue.labelKey)}
                     </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="issue-desc" className={ffLabel}>
                {t("labelDescription")}{" "}
                <span className="font-normal text-muted-foreground">
                  {selectedIssue ? "(optional)" : ""}
                </span>
              </label>
              <textarea
                id="issue-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("placeholderDescription")}
                maxLength={300}
                rows={4}
                required={!selectedIssue}
                className={`${ffInput} resize-none`}
              />
              <p className="mt-1.5 text-right text-xs text-muted-foreground/70">
                {description.length}/300
              </p>
            </div>

            <div>
              <span className={ffLabel}>
                {t("labelPhoto")}
              </span>
              {photoPreview ? (
                <div className="mt-1.5 overflow-hidden rounded-xl border border-border">
                  <img
                    src={photoPreview}
                    alt="Selected issue photo"
                    className="max-h-48 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {photo?.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="shrink-0 text-xs font-semibold text-destructive hover:underline"
                    >
                      {t("btnRemove")}
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="issue-photo"
                  className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-center transition hover:border-primary/40 hover:bg-muted"
                >
                  <span className="text-sm font-medium text-foreground/90">
                    {t("addPhotoTitle")}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {t("addPhotoSubtitle")}
                  </span>
                  <input
                    id="issue-photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            {error && (
              <p
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className={`${ffBtnSecondary} sm:flex-1`}
              >
                {t("btnBack")}
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  (!description.trim() && !selectedIssue) ||
                  !location
                }
                className={`${ffBtnPrimary} sm:flex-1`}
              >
                {submitting ? t("submitting") : t("btnSubmit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
