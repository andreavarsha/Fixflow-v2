import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
/** Unread notification count for the bell badge (reactive). */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return notifications.filter((n) => !n.read).length;
  },
});



import { zoneById } from "./zones";

const categoryTranslations: Record<string, { si: string; ta: string }> = {
  "Plumbing": { si: "නල පද්ධති", ta: "குழாய் வேலை" },
  "Electrical": { si: "විදුලි වැඩ", ta: "மின்சார வேலை" },
  "Roofing": { si: "වහල වැඩ", ta: "கூரை வேலை" },
  "Carpentry": { si: "වඩු වැඩ", ta: "தச்சு வேலை" },
  "Painting": { si: "තීන්ත ආලේප කිරීම", ta: "வண்ணப்பூச்சு வேலை" },
  "Garden / Landscaping": { si: "ගෙවතු වගාව / භූමි අලංකරණය", ta: "தோட்டம் / இயற்கையழகு" },
  "General Maintenance": { si: "පොදු නඩත්තුව", ta: "பொது பராமரிப்பு" },
  "unclassified": { si: "වර්ගීකරණය නොකළ", ta: "வகைப்படுத்தப்படாதது" },
};

const zoneTranslations: Record<string, { si: string; ta: string }> = {
  "kadana": { si: "කඩවත", ta: "கடவத்தை" },
  "rajagiriya": { si: "රාජගිරිය", ta: "இராஜகிரிய" },
  "nawala": { si: "නාවල", ta: "நாவல" },
};

/** Recent notifications for the dashboard sidebar (newest first). */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 15 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const sorted = notifications
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit);

    return Promise.all(
      sorted.map(async (n) => {
        let message_en = n.message;
        let message_si = n.message;
        let message_ta = n.message;

        const job = n.jobId ? await ctx.db.get(n.jobId) : null;

        if (n.type === "quote_request" || n.type === "new_job") {
          if (job) {
            let placeEn = "";
            let placeSi = "";
            let placeTa = "";
            if (job.zoneId) {
              const zoneTrans = zoneTranslations[job.zoneId];
              const zoneNameDb = zoneById(job.zoneId)?.name ?? "";
              placeEn = ` in ${zoneNameDb}`;
              placeSi = ` - ${zoneTrans?.si || zoneNameDb}`;
              placeTa = ` - ${zoneTrans?.ta || zoneNameDb}`;
            }

            const catTrans = categoryTranslations[job.category || ""] || {
              si: job.category || "කාර්යය",
              ta: job.category || "வேலை",
            };
            const catEn = job.category || "Job";

            message_en = job.aiSummary
              ? `${job.aiSummary} (${catEn}${placeEn})`
              : `New quote request${placeEn}`;

            message_si = (job.aiSummary_si || job.aiSummary)
              ? `${job.aiSummary_si || job.aiSummary} (${catTrans.si}${placeSi})`
              : `නව මිල ගණන් ඉල්ලීමක්${placeSi}`;

            message_ta = (job.aiSummary_ta || job.aiSummary)
              ? `${job.aiSummary_ta || job.aiSummary} (${catTrans.ta}${placeTa})`
              : `புதிய விலை கோரிக்கை${placeTa}`;
          }
        } else if (n.type === "quote_not_selected") {
          message_en = "Your quote was not selected for this job. Thank you for participating.";
          message_si = "මෙම කාර්යය සඳහා ඔබේ මිල ගණන් තෝරාගෙන නොමැත. සහභාගී වීම ගැන ස්තුතියි.";
          message_ta = "இந்த வேலைக்கு உங்கள் விலை சலுகை தேர்வு செய்யப்படவில்லை. பங்கேற்றதற்கு நன்றி.";
        } else if (n.type === "quote_accepted") {
          if (n.message.includes("your quote was accepted")) {
            const snippet = job ? job.description.slice(0, 60) : "";
            message_en = `"${snippet}…" — your quote was accepted. Complete the work, then mark the job done in your dashboard.`;
            message_si = `"${snippet}…" — ඔබේ මිල ගණන් පිළිගනු ලැබීය. කාර්යය සම්පූර්ණ කර, ඔබේ උපකරණ පුවරුවේ එය සලකුණු කරන්න.`;
            message_ta = `"${snippet}…" — உங்கள் விலை சலுகை ஏற்கப்பட்டது. வேலையை முடித்து, உங்கள் டாஷ்போர்டில் அதை குறிக்கவும்.`;
          } else {
            // Owner notification
            const supplier = job?.acceptedSupplierId ? await ctx.db.get(job.acceptedSupplierId) : null;
            const supplierName = supplier?.name ?? "a tradesperson";
            message_en = `You hired ${supplierName}. They will mark the job complete when finished, then you can pay.`;
            message_si = `ඔබ ${supplierName} තෝරා ගත්තේය. ඔවුන් කාර්යය නිම වූ පසු එය සලකුණු කරනු ඇත, එවිට ඔබට ගෙවිය හැකිය.`;
            message_ta = `நீங்கள் ${supplierName} ஐ நியமித்துள்ளீர்கள். அவர்கள் வேலையை முடித்ததும் குறிப்பார்கள், பின்னர் நீங்கள் பணம் செலுத்தலாம்.`;
          }
        } else if (n.type === "job_ready_for_payment") {
          const supplier = job?.acceptedSupplierId ? await ctx.db.get(job.acceptedSupplierId) : null;
          const supplierName = supplier?.name ?? "Your tradesperson";

          const quote = job
            ? await ctx.db
                .query("quoteRequests")
                .withIndex("by_job", (q) => q.eq("jobId", job._id))
                .filter((q) => q.eq(q.field("status"), "accepted"))
                .first()
            : null;
          const amount = quote?.priceLKR
            ? `LKR ${quote.priceLKR.toLocaleString("en-LK")}`
            : "the agreed amount";

          message_en = `${supplierName} marked the job complete. Please pay ${amount}.`;
          message_si = `${supplierName} කාර්යය සම්පූර්ණ කළ බව සලකුණු කළේය. කරුණාකර ${amount} ගෙවන්න.`;
          message_ta = `${supplierName} வேலையை முடித்துவிட்டார். தயவுசெய்து ${amount} செலுத்தவும்.`;
        } else if (n.type === "payment_received") {
          const quote = job
            ? await ctx.db
                .query("quoteRequests")
                .withIndex("by_job", (q) => q.eq("jobId", job._id))
                .filter((q) => q.eq(q.field("status"), "accepted"))
                .first()
            : null;
          const amount = quote?.priceLKR
            ? `LKR ${quote.priceLKR.toLocaleString("en-LK")}`
            : "Payment";

          message_en = `${amount} confirmed by the homeowner. Thank you!`;
          message_si = `නිවාස හිමියා විසින් ${amount} තහවුරු කරන ලදී. ස්තුතියි!`;
          message_ta = `வீட்டு உரிமையாளரால் ${amount} உறுதிப்படுத்தப்பட்டது. நன்றி!`;
        } else if (n.type === "new_message") {
          let sender = "homeowner";
          let content = "";
          if (n.message.startsWith("New message from ")) {
            const part = n.message.slice("New message from ".length);
            const idx = part.indexOf(":");
            if (idx !== -1) {
              sender = part.slice(0, idx);
              content = part.slice(idx + 1).trim();
            } else {
              content = part;
            }
          } else {
            content = n.message;
          }

          const senderEn =
            sender === "homeowner"
              ? "homeowner"
              : sender === "tradesperson"
                ? "tradesperson"
                : sender;
          const senderSi =
            sender === "homeowner"
              ? "නිවාස හිමියා"
              : sender === "tradesperson"
                ? "වෘත්තිකයා"
                : sender;
          const senderTa =
            sender === "homeowner"
              ? "வீட்டு உரிமையாளர்"
              : sender === "tradesperson"
                ? "தொழில்முறை வல்லுநர்"
                : sender;

          message_en = `New message from ${senderEn}: ${content}`;
          message_si = `${senderSi} වෙතින් නව පණිවිඩයක්: ${content}`;
          message_ta = `${senderTa} இடமிருந்து புதிய செய்தி: ${content}`;
        } else {
          // Check for Reminder or Follow up question text prefixes
          if (n.message.startsWith("Reminder:")) {
            message_en = "Reminder: Your job is awaiting payment. Please complete the demo flow.";
            message_si =
              "මතක් කිරීම: ඔබේ කාර්යය සඳහා ගෙවීම් අපේක්ෂාවෙන් පවතී. කරුණාකර ඩෙමෝ ගෙවීම් පියවර සම්පූර්ණ කරන්න.";
            message_ta =
              "நினைவூட்டல்: உங்கள் வேலைக்கான கட்டணம் நிலுவையில் உள்ளது. தயவுசெய்து டெமோ கட்டணத்தை முடிக்கவும்.";
          } else if (n.message.startsWith("Follow up question:")) {
            const question = n.message.slice("Follow up question:".length).trim();
            message_en = `Follow up question: ${question}`;
            message_si = `පසු විපරම් ප්‍රශ්නය: ${question}`;
            message_ta = `பின்தொடרתல் கேள்வி: ${question}`;
          }
        }

        return {
          _id: n._id,
          type: n.type,
          message: n.message,
          message_en,
          message_si,
          message_ta,
          read: n.read,
          jobId: n.jobId,
          createdAt: n._creationTime,
        };
      })
    );
  },
});

/** Mark notifications for a job read (e.g. when opening chat). */
export const markReadForJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const n of notifications) {
      if (n.jobId === jobId && !n.read) {
        await ctx.db.patch(n._id, { read: true });
      }
    }
  },
});
