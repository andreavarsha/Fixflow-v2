import { zoneByIdName } from "../../lib/zones";
import { ffCard, ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";

type OwnerAnalyzingProps = {
  hasPhoto: boolean;
  zoneId?: string;
  onBack?: () => void;
};

export function OwnerAnalyzing({ hasPhoto, zoneId, onBack }: OwnerAnalyzingProps) {
  const zoneName = zoneByIdName(zoneId);

  return (
    <div className="mx-auto w-full max-w-md">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white"
            aria-hidden
          >
            ←
          </span>
          New request
        </button>
      )}

      <div className={`${ffCard} flex flex-col items-center py-10 text-center`}>
        <div
          className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
          aria-hidden
        />
        <h1 className={ffScreenTitle}>Reading your request…</h1>
        <p className={ffScreenSubtitle}>Usually under a few seconds</p>

        <ul className="mt-8 w-full max-w-xs space-y-3 text-left text-sm">
          <li className="flex items-start gap-2 text-gray-800">
            <span className="font-semibold text-emerald-600" aria-hidden>
              ✓
            </span>
            <span>{hasPhoto ? "Photo received" : "No photo attached"}</span>
          </li>
          <li className="flex items-start gap-2 text-gray-800">
            <span className="font-semibold text-emerald-600" aria-hidden>
              ✓
            </span>
            <span>
              Location confirmed
              {zoneName ? ` — ${zoneName}` : ""}
            </span>
          </li>
          <li className="flex items-start gap-2 text-gray-400">
            <span className="font-semibold" aria-hidden>
              ·
            </span>
            <span>Classifying issue…</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
