import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, resolveZone } from "../../lib/zones";
import { ffBtnSecondary, ffLabel } from "../../lib/fixflowUi";

// Fix default marker icons when bundling with Vite
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

export type LatLng = { lat: number; lng: number };

type JobLocationPickerProps = {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
};

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [map, position.lat, position.lng]);
  return null;
}

function DragHandler({
  onChange,
}: {
  onChange: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function JobLocationPicker({ value, onChange }: JobLocationPickerProps) {
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);

  const position = value ?? DEFAULT_MAP_CENTER;
  const zone = useMemo(
    () => resolveZone(position.lat, position.lng),
    [position.lat, position.lng],
  );

  function useMyLocation() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError(
          "Couldn’t read your location. Drag the pin or tap the map instead.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={ffLabel}>Job location</span>
        <button
          type="button"
          onClick={useMyLocation}
          className={`${ffBtnSecondary} text-sm sm:max-w-none`}
        >
          {locating ? "Locating…" : "Use my current location"}
        </button>
      </div>

      <div className="h-56 w-full overflow-hidden rounded-xl border border-gray-200 sm:h-64">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter position={position} />
          <DragHandler onChange={onChange} />
          <Marker
            position={[position.lat, position.lng]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const ll = m.getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          >
            <Popup>Drag me to the job site</Popup>
          </Marker>
        </MapContainer>
      </div>

      {zone ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100">
          You&apos;re in <strong>{zone.name}</strong> — FixFlow is live here.
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
          This pin is outside our demo zones (Kadana, Rajagiriya, Nawala). You
          can join the waitlist after trying to submit.
        </p>
      )}

      {geoError && (
        <p className="text-sm text-amber-800" role="status">
          {geoError}
        </p>
      )}
    </div>
  );
}
