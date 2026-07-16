type JobInvoiceProps = {
  jobId: string;
  category?: string;
  zoneName?: string;
  description: string;
  supplierName?: string;
  priceLKR?: number;
  duration?: string;
  paidAt?: number;
  completedAt?: number;
};

/** Opens a printable invoice window (browser Save as PDF). */
export function downloadJobInvoice(data: JobInvoiceProps) {
  const paidDate = data.paidAt
    ? new Date(data.paidAt).toLocaleString("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const price =
    data.priceLKR !== undefined
      ? `LKR ${data.priceLKR.toLocaleString("en-LK")}`
      : "Agreed amount";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Better Call Invoice ${data.jobId.slice(-8)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #0f172a; max-width: 640px; margin: 40px auto; padding: 0 24px; }
    h1 { font-size: 22px; margin: 0; }
    .muted { color: #64748b; font-size: 13px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 20px; }
    .row { display: flex; justify-content: space-between; gap: 16px; margin: 8px 0; font-size: 14px; }
    .label { color: #64748b; }
    .total { font-size: 20px; font-weight: 700; margin-top: 16px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Better Call invoice</h1>
  <p class="muted">Demo receipt for completed repair work</p>
  <div class="card">
    <div class="row"><span class="label">Invoice ID</span><span>FF-${data.jobId.slice(-8).toUpperCase()}</span></div>
    <div class="row"><span class="label">Paid on</span><span>${paidDate}</span></div>
    <div class="row"><span class="label">Issue type</span><span>${escapeHtml(data.category ?? "General")}</span></div>
    ${data.zoneName ? `<div class="row"><span class="label">Zone</span><span>${escapeHtml(data.zoneName)}</span></div>` : ""}
    <div class="row"><span class="label">Tradesperson</span><span>${escapeHtml(data.supplierName ?? "Supplier")}</span></div>
    ${data.duration ? `<div class="row"><span class="label">Timeline</span><span>${escapeHtml(data.duration)}</span></div>` : ""}
    <div class="row"><span class="label">Description</span><span>${escapeHtml(data.description)}</span></div>
    <p class="total">${price}</p>
    <p class="muted">Thank you for using Better Call.</p>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!win) {
    alert("Please allow pop-ups to download the invoice.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
