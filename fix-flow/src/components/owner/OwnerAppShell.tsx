import type { ReactNode } from "react";
import { ffPage } from "../../lib/fixflowUi";

export type OwnerTab = "needs" | "report" | "activity";

type OwnerAppShellProps = {
  tab: OwnerTab;
  onTabChange: (tab: OwnerTab) => void;
  needsCount: number;
  showNav: boolean;
  children: ReactNode;
};

export function OwnerAppShell({
  tab,
  onTabChange,
  needsCount,
  showNav,
  children,
}: OwnerAppShellProps) {
  return (
    <div className="relative min-h-dvh bg-gray-50">
      {/* Desktop / tablet top rail */}
      {showNav && (
        <nav
          className="sticky top-0 z-30 hidden border-b border-gray-200 bg-white/95 backdrop-blur lg:block"
          aria-label="Owner navigation"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-6 py-3 xl:max-w-6xl">
            <RailButton
              active={tab === "needs"}
              onClick={() => onTabChange("needs")}
              label="Needs you"
              badge={needsCount}
            />
            <button
              type="button"
              onClick={() => onTabChange("report")}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-light leading-none transition ${
                tab === "report"
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
              aria-label="Report an issue"
              aria-current={tab === "report" ? "page" : undefined}
            >
              +
            </button>
            <RailButton
              active={tab === "activity"}
              onClick={() => onTabChange("activity")}
              label="Activity"
            />
          </div>
        </nav>
      )}

      <div
        className={`${ffPage} ${
          showNav
            ? "pb-[max(7.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] lg:pb-10"
            : ""
        }`}
      >
        {children}
      </div>

      {/* Mobile bottom bar */}
      {showNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          aria-label="Owner navigation"
        >
          <div className="mx-auto flex max-w-lg items-end justify-around px-4 pt-2 pb-2">
            <MobileTab
              active={tab === "needs"}
              onClick={() => onTabChange("needs")}
              label="Needs you"
              badge={needsCount}
            />
            <button
              type="button"
              onClick={() => onTabChange("report")}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-3xl font-light leading-none text-white shadow-lg"
              aria-label="Report an issue"
              aria-current={tab === "report" ? "page" : undefined}
            >
              +
            </button>
            <MobileTab
              active={tab === "activity"}
              onClick={() => onTabChange("activity")}
              label="Activity"
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function RailButton({
  active,
  onClick,
  label,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
      {badge > 0 && (
        <span
          className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            active ? "bg-white text-gray-900" : "bg-red-600 text-white"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function MobileTab({
  active,
  onClick,
  label,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-[5.5rem] flex-col items-center gap-1 px-2 py-1 ${
        active ? "text-gray-900" : "text-gray-500"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${
          active
            ? "border-gray-900 bg-gray-900"
            : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        <span
          className={`h-3 w-3 rounded-sm ${active ? "bg-white" : "bg-gray-300"}`}
        />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </span>
      {badge > 0 && (
        <span className="absolute right-1 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
