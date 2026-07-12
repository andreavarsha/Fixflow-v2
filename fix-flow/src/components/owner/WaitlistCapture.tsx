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

type WaitlistCaptureProps = {
  location: LatLng;
  onBack: () => void;
};

export function WaitlistCapture({ location, onBack }: WaitlistCaptureProps) {
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
        <p className="text-lg font-semibold text-gray-900">
          {already ? "You're already on the list" : "You're on the waitlist"}
        </p>
        <p className="text-sm leading-relaxed text-gray-600">
          We&apos;ll reach out when FixFlow expands to your area. Thanks for the
          interest — it helps us show investors where demand is.
        </p>
        <button type="button" onClick={onBack} className={ffBtnPrimary}>
          Adjust pin and try again
        </button>
      </div>
    );
  }

  return (
    <div className={`${ffCard} flex flex-col gap-4`}>
      <div>
        <p className="text-lg font-semibold text-gray-900">
          Not in our demo zones yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          FixFlow is live in Kadana, Rajagiriya, and Nawala. Leave your email and
          we&apos;ll notify you when we expand.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="waitlist-email" className={ffLabel}>
            Email
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={submitting} className={ffBtnPrimary}>
            {submitting ? "Saving…" : "Join waitlist"}
          </button>
          <button type="button" onClick={onBack} className="text-sm text-gray-600 underline">
            Move the pin instead
          </button>
        </div>
      </form>
    </div>
  );
}
