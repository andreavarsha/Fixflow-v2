type Step = 1 | 2 | 3;

const labels: Record<Step, string> = {
  1: "Details",
  2: "Suppliers",
  3: "Quotes",
};

export function OwnerStepHint({
  active,
  compact,
}: {
  active: Step;
  compact?: boolean;
}) {
  const steps: Step[] = [1, 2, 3];
  return (
    <nav
      className={`flex flex-wrap items-center gap-x-1 gap-y-2 text-xs sm:text-sm md:gap-x-2 ${compact ? "" : "mb-6"}`}
      aria-label="Job progress"
    >
      {steps.map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          {i > 0 && (
            <span className="mx-0.5 text-gray-300" aria-hidden>
              →
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              n === active
                ? "bg-gray-900 text-white"
                : n < active
                  ? "bg-gray-200 text-gray-700"
                  : "bg-gray-100 text-gray-500"
            }`}
          >
            {n}. {labels[n]}
          </span>
        </span>
      ))}
    </nav>
  );
}
