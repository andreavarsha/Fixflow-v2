import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SupplierCard } from "./SupplierCard";
import { SupplierDiscoveryMap } from "./SupplierDiscoveryMap";
import {
  ffBtnPrimary,
  ffBtnSecondary,
  ffBtnInRow,
  ffCard,
} from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";
import { zoneByIdName } from "../../lib/zones";

const MAX_SELECT = 3;

type SupplierDiscoveryProps = {
  jobId: Id<"jobs">;
  category: string;
  jobLat: number;
  jobLng: number;
  zoneId?: string;
  onBack: () => void;
  onQuotesSent: () => void;
};

export function SupplierDiscovery({
  jobId,
  category,
  jobLat,
  jobLng,
  zoneId,
  onBack,
  onQuotesSent,
}: SupplierDiscoveryProps) {
  const suppliers = useQuery(api.suppliers.getSuppliersNearJob, { jobId });
  const selectSuppliers = useMutation(api.suppliers.selectSuppliers);
  const [selected, setSelected] = useState<Id<"users">[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const zoneName = zoneByIdName(zoneId);

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
      setError(toUserFacingError(err));
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
        <h2 className="text-base font-semibold text-gray-900">
          Nearby suppliers{zoneName ? ` · ${zoneName}` : ""}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Showing <strong>{category}</strong> pros near your job pin. Tap a pin
          or card to select — up to <strong>{MAX_SELECT}</strong>. Quotes update
          live on the map.
        </p>
      </div>

      <SupplierDiscoveryMap
        jobLat={jobLat}
        jobLng={jobLng}
        suppliers={suppliers ?? []}
        selected={selected}
        onToggle={toggleSupplier}
      />

      <div
        className="flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3 text-white shadow-md"
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
            No approved {category} suppliers are available near this pin. Try
            another category from the job summary, or re-run the demo seed.
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

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm md:static md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="flex flex-col gap-3 md:ml-auto md:flex-row md:justify-end">
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
