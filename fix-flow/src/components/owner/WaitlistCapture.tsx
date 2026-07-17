import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ffBtnPrimary,
  ffCard,
  ffInput,
  ffLabel,
} from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";
import type { LatLng } from "./JobLocationPicker";
import { useLanguage } from "../../lib/LanguageContext";

type WaitlistCaptureProps = {
  location: LatLng;
  onBack: () => void;
};

export function WaitlistCapture({ location, onBack }: WaitlistCaptureProps) {
  const { t } = useLanguage();
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [already, setAlready] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await joinWaitlist({
        email: email.trim(),
        lat: location.lat,
        lng: location.lng,
      });
      setAlready(result.alreadyJoined);
      setDone(true);
    } catch (err: unknown) {
      setError(toUserFacingError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className={`${ffCard} flex flex-col gap-3`}>
        <p className="text-lg font-semibold text-foreground">
          {already ? t("waitlistAlreadyTitle") : t("waitlistSuccessTitle")}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("waitlistSuccessDesc")}
        </p>
        <button type="button" onClick={onBack} className={ffBtnPrimary}>
          {t("waitlistAdjustPinBtn")}
        </button>
      </div>
    );
  }

  return (
    <div className={`${ffCard} flex flex-col gap-4`}>
      <div>
        <p className="text-lg font-semibold text-foreground">
          {t("waitlistTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("waitlistDesc")}
        </p>
      </div>
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="waitlist-email" className={ffLabel}>
            {t("waitlistEmailLabel")}
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ffInput}
            placeholder="you@example.com"
          />
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
          <button type="submit" disabled={submitting} className={ffBtnPrimary}>
            {submitting ? t("submitting") : t("waitlistJoinBtn")}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline"
          >
            {t("waitlistMovePinBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}
