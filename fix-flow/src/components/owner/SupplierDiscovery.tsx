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
  onQuotesSent: (count: number) => void;
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
      onQuotesSent(selected.length);
    } catch (err: unknown) {
      setError(toUserFacingError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={ffCard}>
        <h2 className="text-base font-semibold text-foreground">
          Nearby suppliers{zoneName ? ` · ${zoneName}` : ""}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Showing <strong>{category}</strong> pros near your job pin
          (distance from the pin). Tap a pin or card to select — up to{" "}
          <strong>{MAX_SELECT}</strong>. Quotes update live on the map.
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
        className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-md"
        aria-live="polite"
      >
        <span className="text-sm font-medium">Selected</span>
        <span className="text-lg font-bold tabular-nums">
          {selected.length}/{MAX_SELECT}
        </span>
      </div>

      {suppliers === undefined && (
        <p className="text-center text-sm text-muted-foreground">Finding suppliers…</p>
      )}

      {suppliers !== undefined && suppliers.length === 0 && (
        <div className={`${ffCard} text-sm text-muted-foreground`}>
          <p className="font-medium text-foreground">No one nearby right now</p>
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
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm md:static md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="flex flex-col gap-3 md:ml-auto md:flex-row md:justify-end">
          <button type="button" onClick={onBack} className={`${ffBtnSecondary} ${ffBtnInRow}`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void handleRequestQuotes();
            }}
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
