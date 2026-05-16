import { ffCard, ffPage, ffScreenSubtitle, ffScreenTitle } from "../../lib/fixflowUi";

export default function AdminDashboard() {
  return (
    <div className={ffPage}>
      <header className="mb-6">
        <h1 className={ffScreenTitle}>Admin</h1>
        <p className={ffScreenSubtitle}>Supplier approvals (coming in expansion round)</p>
      </header>
      <div className={ffCard}>
        <p className="text-sm leading-relaxed text-gray-600">
          Pending supplier approvals and moderation tools will appear here for{" "}
          <strong>Round 5</strong> of the build plan.
        </p>
      </div>
    </div>
  );
}
