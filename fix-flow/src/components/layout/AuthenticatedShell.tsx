import type { ReactNode } from "react";
import { DashboardAccountMenu } from "./DashboardAccountMenu";

/** Fixed account control on all signed-in dashboards (owner, supplier). */
export function AuthenticatedShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
        <div className="pointer-events-auto">
          <DashboardAccountMenu />
        </div>
      </div>
      {children}
    </div>
  );
}
