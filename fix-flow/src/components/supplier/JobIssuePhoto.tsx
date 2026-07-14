import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type JobIssuePhotoProps = {
  jobId: Id<"jobs">;
};

export function JobIssuePhoto({ jobId }: JobIssuePhotoProps) {
  const photo = useQuery(api.quoteRequests.getJobPhotoForSupplier, { jobId });

  if (photo === undefined) {
    return (
      <div
        className="mt-4 h-40 animate-pulse rounded-xl bg-muted"
        aria-hidden
      />
    );
  }

  if (!photo.hasPhoto) return null;

  if (photo.url) {
    return (
      <img
        src={photo.url}
        alt="Photo of the issue from the homeowner"
        className="mt-4 max-h-56 w-full rounded-xl border border-border object-cover sm:max-h-64"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <p className="mt-4 rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      The homeowner attached a photo, but it could not be loaded. Ask them to
      re-submit the request with the image, or message them for details.
    </p>
  );
}
