type Step = 1 | 2 | 3;

const labels: Record<Step, string> = {
  1: "Details",
  2: "Suppliers",
  3: "Quotes",
};

export function OwnerStepHint({
  active,
  compact,
  onStepClick,
  canGoToStep,
}: {
  active: Step;
  compact?: boolean;
  /** When set, completed steps and the active step become navigation buttons. */
  onStepClick?: (step: Step) => void;
  /** Optional guard — return false to disable a step (e.g. Suppliers without category). */
  canGoToStep?: (step: Step) => boolean;
}) {
  const steps: Step[] = [1, 2, 3];
  return (
    <nav
      className={`flex flex-wrap items-center gap-x-1 gap-y-2 text-xs sm:text-sm md:gap-x-2 ${compact ? "" : "mb-6"}`}
      aria-label="Job progress"
    >
      {steps.map((n, i) => {
        const enabled =
          onStepClick !== undefined &&
          n !== active &&
          (canGoToStep === undefined || canGoToStep(n));
        const pillClass =
          n === active
            ? "bg-gray-900 text-white"
            : n < active
              ? "bg-gray-200 text-gray-700"
              : "bg-gray-100 text-gray-500";

        return (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && (
              <span className="mx-0.5 text-gray-300" aria-hidden>
                →
              </span>
            )}
            {enabled ? (
              <button
                type="button"
                onClick={() => onStepClick(n)}
                className={`rounded-full px-2.5 py-1 font-medium underline-offset-2 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${pillClass}`}
                aria-current={n === active ? "step" : undefined}
              >
                {n}. {labels[n]}
              </button>
            ) : (
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${pillClass}`}
                aria-current={n === active ? "step" : undefined}
              >
                {n}. {labels[n]}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
