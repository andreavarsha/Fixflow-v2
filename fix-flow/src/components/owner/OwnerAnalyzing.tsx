import { IconCheckBadge } from "../icons";
import { zoneByIdName } from "../../lib/zones";
import { ffCard, ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";
import { useLanguage } from "../../lib/LanguageContext";

type OwnerAnalyzingProps = {
  hasPhoto: boolean;
  zoneId?: string;
  onBack?: () => void;
};

export function OwnerAnalyzing({ hasPhoto, zoneId, onBack }: OwnerAnalyzingProps) {
  const { t } = useLanguage();
  const zoneName = zoneByIdName(zoneId);

  return (
    <div className="mx-auto w-full max-w-md">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card"
            aria-hidden
          >
            ←
          </span>
          {t("analyzingBack")}
        </button>
      )}

      <div className={`${ffCard} flex flex-col items-center py-10 text-center`}>
        <div
          className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
        <h1 className={ffScreenTitle}>{t("analyzingTitle")}</h1>
        <p className={ffScreenSubtitle}>{t("analyzingSubtitle")}</p>

        <ul className="mt-8 w-full max-w-xs space-y-3 text-left text-sm">
          <li className="flex items-start gap-2 text-foreground">
            <IconCheckBadge
              size={18}
              className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400"
            />
            <span>{hasPhoto ? t("analyzingPhotoRec") : t("analyzingNoPhoto")}</span>
          </li>
          <li className="flex items-start gap-2 text-foreground">
            <IconCheckBadge
              size={18}
              className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400"
            />
            <span>
              {t("analyzingLocationConfirmed")}
              {zoneName ? ` (${zoneName})` : ""}
            </span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground/60">
            <span className="font-semibold" aria-hidden>
              ·
            </span>
            <span>{t("analyzingClassifying")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
