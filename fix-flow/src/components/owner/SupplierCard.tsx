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
      className={`w-full text-left border p-4 transition-colors ${
        unavailable
          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
          : selected
            ? "border-black bg-gray-50 ring-1 ring-black"
            : disabled
              ? "border-gray-200 bg-white opacity-50 cursor-not-allowed"
              : "border-gray-300 bg-white hover:border-black"
      }`}
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
        {selected && !unavailable && (
          <span className="text-xs font-medium">Selected</span>
        )}
      </div>
    </button>
  );
}
