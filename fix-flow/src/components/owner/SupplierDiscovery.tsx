import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SupplierCard } from "./SupplierCard";
import {
  ffBtnPrimary,
  ffBtnSecondary,
  ffBtnInRow,
  ffCard,
} from "../../lib/fixflowUi";

const MAX_SELECT = 3;

type SupplierDiscoveryProps = {
  jobId: Id<"jobs">;
  category: string;
  onBack: () => void;
  onQuotesSent: () => void;
};

export function SupplierDiscovery({
  jobId,
  category,
  onBack,
  onQuotesSent,
}: SupplierDiscoveryProps) {
  const suppliers = useQuery(api.suppliers.getSuppliersNearKadana, { category });
  const selectSuppliers = useMutation(api.suppliers.selectSuppliers);
  const [selected, setSelected] = useState<Id<"users">[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggleSupplier(id: Id<"users">) {
    setError("");
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
      return;
    }
    if (selected.length >= MAX_SELECT) {
      setError(`You can choose up to ${MAX_SELECT} suppliers. Tap one to deselect.`);
      return;
    }
    setSelected([...selected, id]);
  }

  async function handleRequestQuotes() {
    if (selected.length === 0) {
      setError("Select at least one supplier to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await selectSuppliers({ jobId, supplierIds: selected });
      setSuccess(true);
      onQuotesSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`${ffCard} flex flex-col gap-4`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl" aria-hidden>
          ✓
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">Requests sent</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            We&apos;ve notified {selected.length} supplier
            {selected.length === 1 ? "" : "s"}. Opening your quote inbox…
          </p>
        </div>
        <button type="button" onClick={onBack} className={ffBtnSecondary}>
          Back to job details
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={ffCard}>
        <h2 className="text-base font-semibold text-gray-900">Nearby suppliers</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Showing <strong>{category}</strong> pros within about{" "}
          <strong>15 km</strong> of Kadana. Tap a card to select — up to{" "}
          <strong>{MAX_SELECT}</strong>.
        </p>
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 ring-1 ring-gray-100">
          Tip: Grayed-out cards are unavailable and can&apos;t be selected.
        </p>
      </div>

      <div
        className="hidden md:flex md:items-center md:justify-between md:rounded-xl md:bg-gray-900 md:px-5 md:py-3.5 md:text-white md:shadow-md"
        aria-live="polite"
      >
        <span className="text-sm font-medium">Selection</span>
        <span className="text-lg font-bold tabular-nums">
          {selected.length} / {MAX_SELECT}
        </span>
      </div>

      <div
        className="flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3 text-white shadow-md md:hidden"
        aria-live="polite"
      >
        <span className="text-sm font-medium">Selected</span>
        <span className="text-lg font-bold tabular-nums">
          {selected.length}/{MAX_SELECT}
        </span>
      </div>

      {suppliers === undefined && (
        <p className="text-center text-sm text-gray-500">Finding suppliers…</p>
      )}

      {suppliers !== undefined && suppliers.length === 0 && (
        <div className={`${ffCard} text-sm text-gray-600`}>
          <p className="font-medium text-gray-900">No one nearby right now</p>
          <p className="mt-2 leading-relaxed">
            Try another category or ask your teammate to run indexing if data was
            seeded recently (
            <code className="rounded bg-gray-100 px-1 text-xs">suppliers.indexAllSuppliers</code>
            ).
          </p>
        </div>
      )}

      {suppliers !== undefined && suppliers.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <li key={supplier._id}>
              <SupplierCard
                supplier={supplier}
                selected={selected.includes(supplier._id)}
                selectionDisabled={
                  !selected.includes(supplier._id) &&
                  selected.length >= MAX_SELECT
                }
                onToggle={() => toggleSupplier(supplier._id)}
              />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm md:static md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none xl:pt-2">
        <p className="hidden text-sm text-gray-500 md:block xl:text-center xl:flex-1">
          {selected.length} of {MAX_SELECT} selected — tap cards to change
        </p>
        <div className="flex flex-col gap-3 md:ml-auto md:flex-row md:justify-end xl:min-w-[min(100%,28rem)]">
          <button type="button" onClick={onBack} className={`${ffBtnSecondary} ${ffBtnInRow}`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRequestQuotes}
            disabled={submitting || selected.length === 0}
            className={`${ffBtnPrimary} ${ffBtnInRow}`}
          >
            {submitting
              ? "Sending…"
              : `Request quotes (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
