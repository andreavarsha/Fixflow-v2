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
    <div className="relative min-h-dvh bg-background">
      {/* Desktop / tablet top header rail */}
      {showNav && (
        <nav
          className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur lg:block"
          aria-label="Owner navigation"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5 xl:max-w-6xl">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-primary flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Better Call
              </span>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="flex items-center gap-2.5">
              <RailButton
                active={tab === "report"}
                onClick={() => onTabChange("report")}
                label="Request Repair"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                }
              />
              <RailButton
                active={tab === "needs"}
                onClick={() => onTabChange("needs")}
                label="Action Required"
                badge={needsCount}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                }
              />
              <RailButton
                active={tab === "activity"}
                onClick={() => onTabChange("activity")}
                label="Activity History"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
              />
            </div>

            {/* Empty space placeholder to clear the absolute-positioned avatar trigger */}
            <div className="w-10 h-10" />
          </div>
        </nav>
      )}

      <div
        className={`${ffPage} ${
          showNav
            ? "pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.25rem))] lg:pb-10"
            : ""
        }`}
      >
        {children}
      </div>

      {/* Mobile bottom bar */}
      {showNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          aria-label="Owner navigation"
        >
          <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2.5">
            <MobileTab
              active={tab === "needs"}
              onClick={() => onTabChange("needs")}
              label="Action"
              badge={needsCount}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              }
            />
            <MobileTab
              active={tab === "report"}
              onClick={() => onTabChange("report")}
              label="Report"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
            />
            <MobileTab
              active={tab === "activity"}
              onClick={() => onTabChange("activity")}
              label="Activity"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              }
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
  icon,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && (
        <span
          className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            active
              ? "bg-primary-foreground text-primary"
              : "bg-destructive text-destructive-foreground"
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
  icon,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-[5.5rem] flex-col items-center gap-1 px-2 py-1 transition ${
        active ? "text-primary scale-105" : "text-muted-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        {icon}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
      {badge > 0 && (
        <span className="absolute right-2 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
