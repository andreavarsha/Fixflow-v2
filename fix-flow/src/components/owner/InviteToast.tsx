type InviteToastProps = {
  count: number;
  onDismiss: () => void;
};

export function InviteToast({ count, onDismiss }: InviteToastProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-toast-title"
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-teal-500 bg-card p-8 text-center shadow-xl">
        <p className="text-4xl text-teal-600 dark:text-teal-400" aria-hidden>
          ✓
        </p>
        <h2 id="invite-toast-title" className="mt-4 text-xl font-bold text-foreground">
          {count} supplier{count === 1 ? "" : "s"} invited
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ll see quotes here live — no need to refresh.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
