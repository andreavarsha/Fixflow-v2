import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ffBtnGhost } from "../../lib/fixflowUi";
import { initials } from "../../lib/initials";
import { ThemeToggle } from "../ThemeToggle";

const ROLE_LABEL = {
  owner: "Homeowner",
  supplier: "Supplier",
  admin: "Admin",
} as const;

export function DashboardAccountMenu() {
  const user = useQuery(api.users.getUser);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      void navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  const label = user?.role ? ROLE_LABEL[user.role] : "Account";
  const displayName = user?.name?.trim() || user?.email || "Signed in";
  const avatar = initials(user?.name, user?.email);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-primary/30 transition hover:brightness-105"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        title="Account"
      >
        {user === undefined ? (
          <span className="h-4 w-4 animate-pulse rounded-full bg-primary-foreground/40" />
        ) : (
          avatar
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-card py-2 shadow-lg ring-1 ring-border/50"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            {user?.email && user.name && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
            <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <div className="px-2 py-1">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className={`${ffBtnGhost} w-full justify-center text-sm text-destructive hover:bg-destructive/10 hover:text-destructive`}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
