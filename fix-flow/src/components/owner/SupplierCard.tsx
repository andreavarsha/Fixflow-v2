import type { Id } from "../../../convex/_generated/dataModel";

export type SupplierNearKadana = {
  _id: Id<"users">;
  name: string | undefined;
  category: string | undefined;
  rating: number | undefined;
  available: boolean | undefined;
  distanceKm: number;
};

type SupplierCardProps = {
  supplier: SupplierNearKadana;
  selected: boolean;
  selectionDisabled: boolean;
  onToggle: () => void;
};

export function SupplierCard({
  supplier,
  selected,
  selectionDisabled,
  onToggle,
}: SupplierCardProps) {
  const unavailable = supplier.available === false;
  const disabled = selectionDisabled || unavailable;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-full rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
        unavailable
          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-70"
          : selected
            ? "border-gray-900 bg-gray-50 shadow-md ring-2 ring-gray-900/10"
            : disabled
              ? "cursor-not-allowed border-gray-100 opacity-50"
              : "border-gray-200 bg-white hover:border-gray-400"
      } min-h-[72px] p-4`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-medium text-sm">{supplier.name ?? "Supplier"}</p>
          <p className="text-xs text-gray-500 mt-0.5">{supplier.category}</p>
        </div>
        <span className="text-xs border border-gray-300 px-2 py-0.5 shrink-0">
          {supplier.distanceKm.toFixed(1)} km away
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {supplier.rating !== undefined && (
          <span className="text-xs text-gray-600">
            ★ {supplier.rating.toFixed(1)}
          </span>
        )}
        <span
          className={`text-xs px-2 py-0.5 ${
            unavailable
              ? "bg-gray-200 text-gray-600"
              : "bg-green-100 text-green-800"
          }`}
        >
          {unavailable ? "Unavailable" : "Available"}
        </span>
        {!unavailable && (selected || !selectionDisabled) && (
          <span className="text-xs font-medium text-gray-600">
            Tap to {selected ? "deselect" : "select"}
          </span>
        )}
        {!unavailable && !selected && selectionDisabled && (
          <span className="text-xs text-gray-400">Max 3 — deselect one to add</span>
        )}
      </div>
    </button>
  );
}
