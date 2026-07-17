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
import { useLanguage } from "../../lib/LanguageContext";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

function translateAddressLabel(label: string, lang: string): string {
  if (lang === "en") return label;

  const dictionary: Record<string, { si: string; ta: string }> = {
    // Cities/Zones
    "Kadawatha": { si: "කඩවත", ta: "கடவத்தை" },
    "Kadana": { si: "කඩවත", ta: "கடவத்தை" },
    "Rajagiriya": { si: "රාජගිරිය", ta: "இராஜகிரிய" },
    "Nawala": { si: "නාවල", ta: "நாவல" },
    // Districts
    "Colombo District": { si: "කොළඹ දිස්ත්‍රික්කය", ta: "கொழும்பு மாவட்டம்" },
    "Gampaha District": { si: "ගම්පහ දිස්ත්‍රික්කය", ta: "கம்பஹா மாவட்டம்" },
    // Provinces
    "Western Province": { si: "බස්නාහිර පළාත", ta: "மேல் மாகாணம்" },
    // Country
    "Sri Lanka": { si: "ශ්‍රී ලංකාව", ta: "இலங்கை" },
  };

  let translated = label;
  for (const [key, translations] of Object.entries(dictionary)) {
    const regex = new RegExp(key, "gi");
    translated = translated.replace(regex, translations[lang === "si" ? "si" : "ta"]);
  }
  return translated;
}

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
  const { t, language } = useLanguage();
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
      setGeoError(t("locGeoNotSupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError(t("locGeoError"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function searchAddress() {
    setGeoError("");
    setSuggestions([]);
    if (!address.trim()) {
      setGeoError(t("locEmptyAddressError"));
      return;
    }
    setSearching(true);
    try {
      const hits = await searchAddressAction({ query: address.trim() });
      if (hits.length === 0) {
        setGeoError(t("locNoMatchesError"));
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
    const translatedLabel = translateAddressLabel(hit.label, language);
    setAddress(translatedLabel.split(",").slice(0, 3).join(",").trim());
    setSuggestions([]);
    setGeoError("");
  }

  function jumpToZone(zoneId: (typeof DEMO_ZONES)[number]["id"]) {
    const z = DEMO_ZONES.find((d) => d.id === zoneId);
    if (!z) return;
    onChange({ lat: z.lat, lng: z.lng });
    setAddress(getZoneName(z.id, z.name));
    setSuggestions([]);
    setGeoError("");
  }

  const getZoneName = (zoneId: string, defaultName: string) => {
    if (language === "si") {
      switch (zoneId) {
        case "kadana": return "කඩවත";
        case "rajagiriya": return "රාජගිරිය";
        case "nawala": return "නාවල";
        default: return defaultName;
      }
    }
    if (language === "ta") {
      switch (zoneId) {
        case "kadana": return "கடவத்தை";
        case "rajagiriya": return "இராஜகிரிய";
        case "nawala": return "நாவல";
        default: return defaultName;
      }
    }
    return defaultName;
  };

  return (
    <div className="flex flex-col gap-3">
      <span className={ffLabel}>{t("locJobLocation")}</span>

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
          placeholder={t("locPlaceholder")}
          className={`${ffInput} sm:flex-1`}
          aria-label="Street or area address"
        />
        <button
          type="button"
          onClick={() => void searchAddress()}
          disabled={searching}
          className={`${ffBtnPrimary} sm:max-w-[8rem]`}
        >
          {searching ? t("locSearching") : t("locFind")}
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-card text-sm shadow-sm divide-y divide-border">
          {suggestions.map((hit) => (
            <li key={`${hit.lat},${hit.lng},${hit.label}`}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-foreground/90 transition-colors hover:bg-white/10 hover:text-foreground focus-visible:bg-white/10 focus-visible:outline-none active:bg-white/15 dark:hover:bg-white/10 focus-visible:outline-none dark:hover:bg-white/15 dark:focus-visible:bg-white/15 dark:active:bg-white/20"
                onClick={() => applyHit(hit)}
              >
                {translateAddressLabel(hit.label, language)}
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
          {locating ? t("locLocating") : t("locUseMyLocation")}
        </button>
        {DEMO_ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => jumpToZone(z.id)}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-white/10 hover:text-foreground dark:hover:bg-white/15"
          >
            {getZoneName(z.id, z.name)}
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
                <Popup>{t("locDragPopup")}</Popup>
              </Marker>
            </>
          )}
          <DragHandler onChange={onChange} />
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("locInstructions")}
      </p>

      {!hasPin && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
          {t("locSetLocationHint")}
        </p>
      )}

      {hasPin && zone && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:ring-teal-900/50">
          {t("locInZonePrefix")}<strong>{getZoneName(zone.id, zone.name)}</strong>{t("locInZoneSuffix")}
        </p>
      )}

      {hasPin && !zone && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
          {t("locOutsideZone")}
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
