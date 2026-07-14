import { useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
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
import { api } from "../../../convex/_generated/api";
import { DEFAULT_MAP_CENTER, DEMO_ZONES, resolveZone } from "../../lib/zones";
import {
  ffBtnPrimary,
  ffBtnSecondary,
  ffInput,
  ffLabel,
} from "../../lib/fixflowUi";
import { toUserFacingError } from "../../lib/userFacingError";

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

type AddressHit = { lat: number; lng: number; label: string };

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 14), {
      animate: true,
    });
  }, [map, position.lat, position.lng]);
  return null;
}

function DragHandler({ onChange }: { onChange: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function JobLocationPicker({ value, onChange }: JobLocationPickerProps) {
  const searchAddressAction = useAction(api.geocode.searchAddress);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressHit[]>([]);

  // Preview center only — do not claim a zone until the user sets a pin.
  const mapCenter = value ?? DEFAULT_MAP_CENTER;
  const hasPin = value !== null;

  const zone = useMemo(
    () => (hasPin && value ? resolveZone(value.lat, value.lng) : null),
    [hasPin, value],
  );

  function useMyLocation() {
    setGeoError("");
    setSuggestions([]);
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
          "Couldn’t read your location. Enter an address or drag the pin instead.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function searchAddress() {
    setGeoError("");
    setSuggestions([]);
    if (!address.trim()) {
      setGeoError("Enter an address, e.g. Rajagiriya, Budgamuwa Rd.");
      return;
    }
    setSearching(true);
    try {
      const hits = await searchAddressAction({ query: address.trim() });
      if (hits.length === 0) {
        setGeoError(
          "No matches found. Try “Rajagiriya” or “Nawala”, then fine-tune the pin.",
        );
        return;
      }
      if (hits.length === 1) {
        applyHit(hits[0]);
        return;
      }
      setSuggestions(hits);
    } catch (err: unknown) {
      setGeoError(toUserFacingError(err));
    } finally {
      setSearching(false);
    }
  }

  function applyHit(hit: AddressHit) {
    onChange({ lat: hit.lat, lng: hit.lng });
    setAddress(hit.label.split(",").slice(0, 3).join(",").trim());
    setSuggestions([]);
    setGeoError("");
  }

  function jumpToZone(zoneId: (typeof DEMO_ZONES)[number]["id"]) {
    const z = DEMO_ZONES.find((d) => d.id === zoneId);
    if (!z) return;
    onChange({ lat: z.lat, lng: z.lng });
    setAddress(z.name);
    setSuggestions([]);
    setGeoError("");
  }

  return (
    <div className="flex flex-col gap-3">
      <span className={ffLabel}>Job location</span>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void searchAddress();
            }
          }}
          placeholder="e.g. Rajagiriya, Budgamuwa Rd"
          className={`${ffInput} sm:flex-1`}
          aria-label="Street or area address"
        />
        <button
          type="button"
          onClick={() => void searchAddress()}
          disabled={searching}
          className={`${ffBtnPrimary} sm:max-w-[8rem]`}
        >
          {searching ? "Searching…" : "Find"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-card text-sm shadow-sm">
          {suggestions.map((hit) => (
            <li key={`${hit.lat},${hit.lng},${hit.label}`}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-foreground/90 hover:bg-accent"
                onClick={() => applyHit(hit)}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className={`${ffBtnSecondary} text-sm sm:max-w-none`}
        >
          {locating ? "Locating…" : "Use my current location"}
        </button>
        {DEMO_ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => jumpToZone(z.id)}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border hover:bg-accent"
          >
            {z.name}
          </button>
        ))}
      </div>

      <div className="h-56 w-full overflow-hidden rounded-xl border border-border sm:h-64">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPin && value && (
            <>
              <Recenter position={value} />
              <Marker
                position={[value.lat, value.lng]}
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
            </>
          )}
          <DragHandler onChange={onChange} />
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Type an address and tap Find, use GPS, pick a demo area, or tap the map
        to drop a pin. Drag the pin to fine-tune.
      </p>

      {!hasPin && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
          Set a job location to continue. FixFlow is live in{" "}
          <strong>Kadana</strong>, <strong>Rajagiriya</strong>, and{" "}
          <strong>Nawala</strong>.
        </p>
      )}

      {hasPin && zone && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:ring-teal-900/50">
          ✓ You&apos;re in <strong>{zone.name}</strong> — FixFlow is live here.
        </p>
      )}

      {hasPin && !zone && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
          This pin is outside our demo zones (Kadana, Rajagiriya, Nawala). You
          can join the waitlist after trying to submit.
        </p>
      )}

      {geoError && (
        <p className="text-sm text-amber-800 dark:text-amber-300" role="status">
          {geoError}
        </p>
      )}
    </div>
  );
}
