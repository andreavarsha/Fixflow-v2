import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ffBtnGhost } from "../../lib/fixflowUi";

const ROLE_LABEL = {
  owner: "Homeowner",
  supplier: "Supplier",
  admin: "Admin",
} as const;

function initials(name: string | undefined, email: string | undefined): string {
  const fromName = name?.trim();
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fromName.slice(0, 2).toUpperCase();
  }
  const local = email?.split("@")[0] ?? "?";
  return local.slice(0, 2).toUpperCase();
}

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
      navigate("/login", { replace: true });
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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white shadow-sm ring-1 ring-gray-900 transition hover:bg-gray-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        title="Account"
      >
        {user === undefined ? (
          <span className="h-4 w-4 animate-pulse rounded-full bg-gray-600" />
        ) : (
          avatar
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg ring-1 ring-black/5"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">
              {displayName}
            </p>
            {user?.email && user.name && (
              <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
            )}
            <p className="mt-2 text-xs font-medium text-gray-600">{label}</p>
          </div>
          <div className="px-2 py-1">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className={`${ffBtnGhost} w-full justify-center text-sm text-red-700 hover:bg-red-50 hover:text-red-800`}
            >
              {signingOut ? "Signing out…" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
