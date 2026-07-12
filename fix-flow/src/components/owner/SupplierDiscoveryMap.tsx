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
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function quoteBadge(s: MapSupplier): string | null {
  if (s.quoteStatus === "quoted" && s.priceLKR !== undefined) {
    return `Quoted LKR ${s.priceLKR.toLocaleString("en-LK")}${s.isFinal ? " · Final" : " · Negotiable"}`;
  }
  if (s.quoteStatus === "pending") return "Awaiting quote";
  if (s.quoteStatus === "accepted") return "Accepted";
  if (s.quoteStatus === "rejected") return "Not selected";
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
  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-gray-200 ${heightClassName}`}
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
          radius={10}
          pathOptions={{
            color: "#111827",
            fillColor: "#111827",
            fillOpacity: 0.85,
          }}
        >
          <Popup>Your job</Popup>
        </CircleMarker>
        {suppliers.map((s) => {
          const isSelected = selected.includes(s._id);
          const badge = quoteBadge(s);
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
                  <p className="text-gray-600">{s.category}</p>
                  <p className="mt-1 text-gray-700">
                    {s.rating !== undefined
                      ? `★ ${s.rating.toFixed(1)}`
                      : "No rating yet"}
                    {s.reviewCount !== undefined
                      ? ` · ${s.reviewCount} reviews`
                      : ""}
                  </p>
                  <p className="text-gray-500">{s.distanceKm.toFixed(1)} km away</p>
                  {badge && (
                    <p className="mt-1 font-medium text-emerald-800">{badge}</p>
                  )}
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md bg-gray-900 px-2 py-1.5 text-xs font-medium text-white"
                    onClick={() => onToggle(s._id)}
                  >
                    {isSelected ? "Deselect" : "Select for quote"}
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
