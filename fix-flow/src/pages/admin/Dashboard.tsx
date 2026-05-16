import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ffBtnGhost,
  ffBtnPrimary,
  ffBtnSecondary,
  ffCard,
  ffPage,
  ffScreenSubtitle,
  ffScreenTitle,
} from "../../lib/fixflowUi";

type AdminSupplier = {
  _id: Id<"users">;
  name: string | undefined;
  email: string | undefined;
  category: string | undefined;
  rating: number | undefined;
  approved: boolean;
  suspended: boolean;
  available: boolean;
};

export default function AdminDashboard() {
  const suppliers = useQuery(api.suppliers.listAdminSuppliers);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const approveSupplier = useMutation(api.suppliers.approveSupplier);
  const setSuspended = useMutation(api.suppliers.setSupplierSuspended);

  const [busyId, setBusyId] = useState<Id<"users"> | null>(null);
  const [error, setError] = useState("");

  async function withBusy<T>(
    supplierId: Id<"users">,
    fn: () => Promise<T>,
  ): Promise<void> {
    setError("");
    setBusyId(supplierId);
    try {
      await fn();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const pending = (suppliers ?? []).filter((s) => !s.approved);
  const active = (suppliers ?? []).filter((s) => s.approved);

  return (
    <div className={ffPage}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
        <div className="min-w-0">
          <h1 className={ffScreenTitle}>Admin</h1>
          <p className={ffScreenSubtitle}>
            Review pending suppliers, suspend bad actors. Changes propagate to the
            owner discovery list in real time.
          </p>
        </div>
        <div
          className="relative shrink-0 rounded-full bg-white p-2.5 shadow-sm ring-1 ring-gray-200"
          title={unreadCount ? `${unreadCount} unread` : "Notifications"}
        >
          <span className="text-xl leading-none" aria-hidden>
            🔔
          </span>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </header>

      {error && (
        <p
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {suppliers === undefined && (
        <p className="text-sm text-gray-500">Loading suppliers…</p>
      )}

      {suppliers !== undefined && (
        <div className="flex flex-col gap-10">
          <Section
            title="Pending approval"
            subtitle={
              pending.length === 0
                ? "Nothing waiting — new sign-ups will appear here."
                : `${pending.length} supplier${pending.length === 1 ? "" : "s"} awaiting your decision.`
            }
          >
            {pending.length > 0 && (
              <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6 2xl:grid-cols-3">
                {pending.map((s) => (
                  <li key={s._id} className={`${ffCard} flex flex-col gap-3`}>
                    <SupplierIdentity supplier={s} />
                    <StatusPills supplier={s} />
                    <button
                      type="button"
                      disabled={busyId === s._id}
                      onClick={() =>
                        withBusy(s._id, () =>
                          approveSupplier({ supplierId: s._id }),
                        )
                      }
                      className={`${ffBtnPrimary} mt-auto`}
                    >
                      {busyId === s._id ? "Approving…" : "Approve supplier"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Active suppliers"
            subtitle={
              active.length === 0
                ? "No approved suppliers yet."
                : "Suspending a supplier removes them from owner discovery instantly."
            }
          >
            {active.length > 0 && (
              <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6 2xl:grid-cols-3">
                {active.map((s) => {
                  const busy = busyId === s._id;
                  return (
                    <li key={s._id} className={`${ffCard} flex flex-col gap-3`}>
                      <SupplierIdentity supplier={s} />
                      <StatusPills supplier={s} />
                      {s.suspended ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            withBusy(s._id, () =>
                              setSuspended({
                                supplierId: s._id,
                                suspended: false,
                              }),
                            )
                          }
                          className={`${ffBtnSecondary} mt-auto`}
                        >
                          {busy ? "Updating…" : "Reinstate supplier"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            withBusy(s._id, () =>
                              setSuspended({
                                supplierId: s._id,
                                suspended: true,
                              }),
                            )
                          }
                          className={`${ffBtnGhost} mt-auto self-start text-red-600 hover:bg-red-50 hover:text-red-700`}
                        >
                          {busy ? "Suspending…" : "Suspend supplier"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function SupplierIdentity({ supplier }: { supplier: AdminSupplier }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
      <p className="font-semibold text-gray-900">
        {supplier.name ?? "Unnamed supplier"}
      </p>
      <p className="text-xs text-gray-500">
        {supplier.email ?? "no email on file"}
      </p>
      <p className="text-sm text-gray-700">
        {supplier.category ?? "Uncategorised"}
        {supplier.rating !== undefined && (
          <span className="ml-2 text-gray-500">
            ★ {supplier.rating.toFixed(1)}
          </span>
        )}
      </p>
    </div>
  );
}

function StatusPills({ supplier }: { supplier: AdminSupplier }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill
        label={supplier.approved ? "Approved" : "Pending"}
        tone={supplier.approved ? "good" : "warn"}
      />
      <Pill
        label={supplier.suspended ? "Suspended" : "Not suspended"}
        tone={supplier.suspended ? "bad" : "neutral"}
      />
      <Pill
        label={supplier.available ? "Available" : "Unavailable"}
        tone={supplier.available ? "good" : "neutral"}
      />
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 ring-amber-100"
        : tone === "bad"
          ? "bg-red-50 text-red-800 ring-red-100"
          : "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${toneClass}`}
    >
      {label}
    </span>
  );
}
