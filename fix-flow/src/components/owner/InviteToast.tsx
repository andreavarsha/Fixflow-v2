import { IconCheckBadge } from "../icons";
import { useLanguage } from "../../lib/LanguageContext";

type InviteToastProps = {
  count: number;
  onDismiss: () => void;
};

export function InviteToast({ count, onDismiss }: InviteToastProps) {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-toast-title"
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-teal-500 bg-card p-8 text-center shadow-xl">
        <IconCheckBadge
          size={40}
          className="mx-auto text-teal-600 dark:text-teal-400"
        />
        <h2
          id="invite-toast-title"
          className="mt-4 text-xl font-bold text-foreground"
        >
          {t("inviteSuccessTitle").replace("{count}", String(count))}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("inviteSuccessDesc")}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {t("inviteContinueBtn")}
        </button>
      </div>
    </div>
  );
}
