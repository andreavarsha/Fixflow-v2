import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { QuoteSubmitForm } from "../../components/supplier/QuoteSubmitForm";

const urgencyStyle = {
  High: "text-red-700",
  Medium: "text-amber-700",
  Low: "text-green-700",
};

export default function SupplierDashboard() {
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const quoteRequests = useQuery(api.quoteRequests.listForSupplier);

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
          <p className="text-sm text-gray-500">Gampaha · Kadana</p>
        </div>
        <div className="relative" title="Unread notifications">
          <span className="text-2xl" aria-hidden>
            🔔
          </span>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>

      <h2 className="text-sm font-medium mb-4">Incoming quote requests</h2>

      {quoteRequests === undefined && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {quoteRequests !== undefined && quoteRequests.length === 0 && (
        <div className="border border-gray-200 p-6">
          <p className="text-sm text-gray-500">
            No quote requests yet. When an owner requests a quote, it will appear
            here and the bell badge will update live.
          </p>
        </div>
      )}

      {quoteRequests !== undefined && quoteRequests.length > 0 && (
        <ul className="flex flex-col gap-3">
          {quoteRequests.map((request) => (
            <li
              key={request._id}
              className="border border-gray-300 p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {request.status}
                </span>
                {request.jobUrgency && (
                  <span
                    className={`text-xs font-medium ${
                      urgencyStyle[request.jobUrgency]
                    }`}
                  >
                    {request.jobUrgency} urgency
                  </span>
                )}
              </div>
              {request.jobCategory && (
                <p className="text-sm font-medium">{request.jobCategory}</p>
              )}
              <p className="text-sm text-gray-700">
                {request.jobSummary ?? request.jobDescription}
              </p>
              <QuoteSubmitForm
                jobId={request.jobId}
                jobLabel={request.jobCategory ?? "Job"}
                disabled={request.status !== "pending"}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
