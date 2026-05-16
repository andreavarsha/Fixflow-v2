import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SupplierCard } from "./SupplierCard";

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
      setError(`You can select at most ${MAX_SELECT} suppliers`);
      return;
    }
    setSelected([...selected, id]);
  }

  async function handleRequestQuotes() {
    if (selected.length === 0) {
      setError("Select at least one supplier");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await selectSuppliers({ jobId, supplierIds: selected });
      setSuccess(true);
      onQuotesSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to request quotes");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="border border-gray-200 p-6 flex flex-col gap-3">
        <p className="text-sm font-medium">Quote requests sent</p>
        <p className="text-xs text-gray-500">
          {selected.length} supplier{selected.length === 1 ? "" : "s"} notified.
          They will appear in the Convex dashboard as quoteRequest records.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm underline text-gray-500 self-start"
        >
          ← Back to classification
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          Nearby suppliers · {category}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Within 15 km of Kadana · select up to {MAX_SELECT}
        </p>
      </div>

      {suppliers === undefined && (
        <p className="text-sm text-gray-500">Loading suppliers...</p>
      )}

      {suppliers !== undefined && suppliers.length === 0 && (
        <p className="text-sm text-gray-500 border border-gray-200 p-4">
          No suppliers found for this category nearby. Run{" "}
          <code className="text-xs">suppliers.indexAllSuppliers</code> in the
          Convex dashboard if seed data was added before geospatial indexing.
        </p>
      )}

      {suppliers !== undefined && suppliers.length > 0 && (
        <ul className="flex flex-col gap-3">
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

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 py-2 text-sm hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleRequestQuotes}
          disabled={submitting || selected.length === 0}
          className="flex-1 bg-black text-white py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting
            ? "Sending..."
            : `Request Quotes (${selected.length})`}
        </button>
      </div>
    </div>
  );
}
