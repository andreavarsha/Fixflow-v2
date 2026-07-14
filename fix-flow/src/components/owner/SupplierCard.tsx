import type { Id } from "../../../convex/_generated/dataModel";

export type NearbySupplierCard = {
  _id: Id<"users">;
  name: string | undefined;
  category: string | undefined;
  rating: number | undefined;
  reviewCount?: number | undefined;
  available: boolean | undefined;
  distanceKm: number;
  quoteStatus?: "pending" | "quoted" | "accepted" | "rejected";
  priceLKR?: number;
  isFinal?: boolean;
};

type SupplierCardProps = {
  supplier: NearbySupplierCard;
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
      className={`min-h-[72px] w-full rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
        unavailable
          ? "cursor-not-allowed border-border bg-muted/50 opacity-70"
          : selected
            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/15"
            : disabled
              ? "cursor-not-allowed border-border opacity-50"
              : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {supplier.name ?? "Supplier"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{supplier.category}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {supplier.distanceKm.toFixed(1)} km away
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {supplier.rating !== undefined && (
          <span className="text-xs text-muted-foreground">
            <span className="text-amber-500">★</span> {supplier.rating.toFixed(1)}
            {supplier.reviewCount !== undefined ? ` (${supplier.reviewCount})` : ""}
          </span>
        )}
        {supplier.quoteStatus === "quoted" && supplier.priceLKR !== undefined && (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
            LKR {supplier.priceLKR.toLocaleString("en-LK")}
            {supplier.isFinal ? " · Final" : " · Negotiable"}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            unavailable
              ? "bg-muted text-muted-foreground"
              : "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
          }`}
        >
          {unavailable ? "Unavailable" : "Available"}
        </span>
        {!unavailable && (selected || !selectionDisabled) && (
          <span className="text-xs font-medium text-muted-foreground">
            Tap to {selected ? "deselect" : "select"}
          </span>
        )}
      </div>
    </button>
  );
}
