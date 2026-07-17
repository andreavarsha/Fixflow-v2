import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatResponseMinutes } from "../../lib/supplierDashboardUi";
import { useLanguage } from "../../lib/LanguageContext";
import { getCategoryLabel } from "../../pages/owner/Dashboard";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export type MapSupplier = {
  _id: Id<"users">;
  name?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm: number;
  lat: number;
  lng: number;
  quoteStatus?: "pending" | "quoted" | "accepted" | "rejected";
  priceLKR?: number;
  isFinal?: boolean;
  /** Not yet populated by the backend — falls back to "New" until it is. */
  completedJobs?: number;
  avgResponseMinutes?: number;
};

type SupplierDiscoveryMapProps = {
  jobLat: number;
  jobLng: number;
  suppliers: MapSupplier[];
  selected: Id<"users">[];
  onToggle: (id: Id<"users">) => void;
  heightClassName?: string;
  compact?: boolean;
};

function FitBounds({
  jobLat,
  jobLng,
  suppliers,
}: {
  jobLat: number;
  jobLng: number;
  suppliers: MapSupplier[];
}) {
  const map = useMap();
  useEffect(() => {
    const points: L.LatLngExpression[] = [[jobLat, jobLng]];
    for (const s of suppliers) {
      points.push([s.lat, s.lng]);
    }
    if (points.length === 1) {
      map.setView([jobLat, jobLng], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 14 });
  }, [map, jobLat, jobLng, suppliers]);
  return null;
}

function quoteBadge(s: MapSupplier, t: (key: any) => string): string | null {
  if (s.quoteStatus === "quoted" && s.priceLKR !== undefined) {
    return `${t("quotedStatusPrefix")} LKR ${s.priceLKR.toLocaleString("en-LK")}${s.isFinal ? ` · ${t("supplierQuoteFinal")}` : ` · ${t("supplierQuoteNegotiable")}`}`;
  }
  if (s.quoteStatus === "pending") return t("supplierAwaitingQuote");
  if (s.quoteStatus === "accepted") return s.quoteStatus ? t("supplierAccepted") : null;
  if (s.quoteStatus === "rejected") return s.quoteStatus ? t("supplierNotSelectedText") : null;
  return null;
}

export function SupplierDiscoveryMap({
  jobLat,
  jobLng,
  suppliers,
  selected,
  onToggle,
  heightClassName = "h-64 sm:h-80",
  compact,
}: SupplierDiscoveryMapProps) {
  const { t, language } = useLanguage();

  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-border ${heightClassName}`}
    >
      <MapContainer
        center={[jobLat, jobLng]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={!compact}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds jobLat={jobLat} jobLng={jobLng} suppliers={suppliers} />
        <CircleMarker
          center={[jobLat, jobLng]}
          radius={8}
          pathOptions={{
            color: "rgb(20, 184, 166)",
            fillColor: "rgb(20, 184, 166)",
            fillOpacity: 0.4,
          }}
        >
          <Popup>
            <span className="text-xs font-semibold text-gray-900">
              {t("locJobLocation")}
            </span>
          </Popup>
        </CircleMarker>
        {suppliers.map((s) => {
          const isSelected = selected.includes(s._id);
          const badge = quoteBadge(s, t);
          return (
            <Marker
              key={s._id}
              position={[s.lat, s.lng]}
              opacity={isSelected ? 1 : 0.85}
              eventHandlers={{
                click: () => onToggle(s._id),
              }}
            >
              <Popup>
                <div className="min-w-[10rem] text-sm">
                  <p className="font-semibold text-gray-900">
                    {s.name ?? "Supplier"}
                  </p>
                  <p className="text-gray-600">
                    {s.category ? getCategoryLabel(s.category, language) : ""}
                  </p>
                  <p className="mt-1 text-gray-700">
                    {s.rating !== undefined
                      ? `★ ${s.rating.toFixed(1)}`
                      : t("supplierNoRating")}
                    {s.reviewCount !== undefined
                      ? ` · ${t("reviewsCount").replace("{count}", String(s.reviewCount))}`
                      : ""}
                  </p>
                  <p className="text-gray-500">
                    {s.distanceKm.toFixed(1)} {t("kmAway")}
                    {s.completedJobs !== undefined
                      ? ` · ${t("jobsDone").replace("{count}", String(s.completedJobs))}`
                      : ` · ${t("supplierNew")}`}
                    {s.avgResponseMinutes !== undefined
                      ? ` · ${formatResponseMinutes(s.avgResponseMinutes)} ${t("supplierResponse")}`
                      : ""}
                  </p>
                  {badge && (
                    <p className="mt-1 font-medium text-teal-800">{badge}</p>
                  )}
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground"
                    onClick={() => onToggle(s._id)}
                  >
                    {isSelected ? t("supplierDeselectBtn") : t("supplierSelectBtn")}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
