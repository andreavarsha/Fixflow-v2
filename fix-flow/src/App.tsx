import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Login from "./pages/Login";
import Signup from "./pages/SignUp.tsx";
import OwnerDashboard from "./pages/owner/Dashboard.tsx";
import SupplierDashboard from "./pages/supplier/Dashboard.tsx";
import RolePicker from "./pages/RolePicker";
import { AuthenticatedShell } from "./components/layout/AuthenticatedShell";
import { ffPage } from "./lib/fixflowUi";

/**
 * Convex `<Authenticated>` renders null while `useConvexAuth().isLoading` is true.
 * Dashboard routes used only `<Authenticated>`, so token refresh / mutations could leave
 * a blank viewport (reads as a black flash when dark theme variables apply to `body`).
 */
function AuthLoadingScreen({ title }: { title?: string }) {
  return (
    <div className={`${ffPage} flex min-h-dvh flex-col items-center justify-center`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
          aria-hidden
        />
        <div>
          <p className="text-base font-medium text-gray-900">{title ?? "Loading…"}</p>
          <p className="mt-1 text-sm text-gray-500">One moment.</p>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <AuthLoadingScreen title="Connecting…" />
      </AuthLoading>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <Navigate to="/login" replace />
      </Unauthenticated>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <>
            <AuthLoading>
              <AuthLoadingScreen />
            </AuthLoading>
            <Authenticated>
              <AuthenticatedShell>
                <RolePicker />
              </AuthenticatedShell>
            </Authenticated>
            <Unauthenticated>
              <Navigate to="/login" />
            </Unauthenticated>
          </>
        }
      />

      <Route
        path="/owner/dashboard"
        element={
          <RequireAuth>
            <AuthenticatedShell>
              <OwnerDashboard />
            </AuthenticatedShell>
          </RequireAuth>
        }
      />
      <Route
        path="/supplier/dashboard"
        element={
          <RequireAuth>
            <AuthenticatedShell>
              <SupplierDashboard />
            </AuthenticatedShell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
