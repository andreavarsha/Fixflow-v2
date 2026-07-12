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
      <div className="w-full max-w-sm rounded-2xl border-2 border-emerald-500 bg-white p-8 text-center shadow-xl">
        <p className="text-4xl text-emerald-600" aria-hidden>
          ✓
        </p>
        <h2 id="invite-toast-title" className="mt-4 text-xl font-bold text-gray-900">
          {count} supplier{count === 1 ? "" : "s"} invited
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;ll see quotes here live — no need to refresh.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 text-sm font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
