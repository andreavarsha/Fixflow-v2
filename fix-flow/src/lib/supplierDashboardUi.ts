export type SupplierLang = "en" | "si" | "ta";

const copy = {
  en: {
    dashboardTitle: "Your dashboard",
    dashboardSubtitle: "Quote requests and alerts",
    incomingRequests: "Incoming requests",
    loading: "Loading…",
    emptyTitle: "Nothing here yet",
    emptyBody:
      "When a homeowner picks you and asks for a quote, the job summary appears below. The bell updates live when there's news.",
    statusPending: "Awaiting your quote",
    statusQuoted: "Quote submitted",
    statusAccepted: "Quote accepted",
    statusRejected: "Not selected",
    urgency: (level: string) => `${level} urgency`,
    summaryLanguage: "Job summary language",
    langEn: "English",
    langSi: "සිංහල",
    langTa: "தமிழ்",
    quoteSubmittedTitle: "Your quote is with the homeowner",
    quoteSubmittedPrice: (price: string) => `Price: LKR ${price}`,
    quoteSubmittedDays: (days: number) =>
      days === 1 ? `Duration: ${days} day` : `Duration: ${days} days`,
    quoteSubmittedFinal: "Marked as final — homeowner can accept",
    quoteSubmittedDraft: "Not final yet — check the box below when ready",
    sendQuote: "Send your quote",
    sendQuoteHint:
      "Homeowners see updates instantly. Check \"Final quote\" when you're happy for them to accept it.",
    priceLabel: "Price (LKR)",
    daysLabel: "Estimated duration (days)",
    notesLabel: "Notes",
    notesOptional: "(optional)",
    notesPlaceholder: "Materials, access, warranty…",
    finalQuote: "This is my final quote",
    finalQuoteHint: "The homeowner can only accept after this is checked.",
    submitQuote: "Submit quote",
    updateQuote: "Update quote",
    sending: "Sending…",
    jobClosed: "This homeowner has closed quoting for now.",
    noAction: "No further action needed on this request.",
    invalidPrice: "Enter a valid price in Sri Lankan Rupees (LKR).",
    invalidDays: "Enter how many days the job will take (whole number, at least 1).",
  },
  si: {
    dashboardTitle: "ඔබේ උපකරණ පුවරුව",
    dashboardSubtitle: "මිල ගණන් ඉල්ලීම් සහ දැනුම්දීම්",
    incomingRequests: "ලැබෙන ඉල්ලීම්",
    loading: "පූරණය වෙමින්…",
    emptyTitle: "තවම කිසිවක් නැත",
    emptyBody:
      "ගෘහස්ථයෙක් ඔබ තෝරා මිල ගණන් ඉල්ලූ විට, රැකියා සාරාංශය මෙහි දිස්වේ. පුවත් ඇති විට සීනුව සජීවීව යාවත්කාලීන වේ.",
    statusPending: "ඔබේ මිල ගණන් බලාපොරොත්තුවෙන්",
    statusQuoted: "මිල ගණන් යැව්වා",
    statusAccepted: "මිල ගණන් පිළිගත්තා",
    statusRejected: "තෝරා නැත",
    urgency: (level: string) => `${level} අත්‍යවශ්‍යතාව`,
    summaryLanguage: "රැකියා සාරාංශ භාෂාව",
    langEn: "English",
    langSi: "සිංහල",
    langTa: "தமிழ்",
    quoteSubmittedTitle: "ඔබේ මිල ගණන් ගෘහස්ථයා වෙත යැව්වා",
    quoteSubmittedPrice: (price: string) => `මිල: LKR ${price}`,
    quoteSubmittedDays: (days: number) =>
      days === 1 ? `කාලය: දින ${days}` : `කාලය: දින ${days}`,
    quoteSubmittedFinal: "අවසාන ලෙස සලකුණු කළා — ගෘහස්ථයාට පිළිගත හැක",
    quoteSubmittedDraft: "තව අවසාන නොවේ — සූදානම් වූ විට පහළින් සලකුණු කරන්න",
    sendQuote: "ඔබේ මිල ගණන් යවන්න",
    sendQuoteHint:
      "ගෘහස්ථයින් වහාම යාවත්කාලීන දකිති. පිළිගැනීමට සූදානම් වූ විට \"අවසාන මිල ගණන්\" සලකුණු කරන්න.",
    priceLabel: "මිල (LKR)",
    daysLabel: "ඇස්තමේන්තු කාලය (දින)",
    notesLabel: "සටහන්",
    notesOptional: "(විකල්ප)",
    notesPlaceholder: "Materials, access, warranty…",
    finalQuote: "මෙය මගේ අවසාන මිල ගණන්",
    finalQuoteHint: "මෙය සලකුණු කළ පසු පමණක් ගෘහස්ථයාට පිළිගත හැක.",
    submitQuote: "මිල ගණන් යවන්න",
    updateQuote: "මිල ගණන් යාවත්කාලීන කරන්න",
    sending: "යවමින්…",
    jobClosed: "ගෘහස්ථයා මේ වේලාවට මිල ගණන් වසා ඇත.",
    noAction: "මෙම ඉල්ලීමට තව ක්‍රියාවක් අවශ්‍ය නොවේ.",
    invalidPrice: "ශ්‍රී ලංකා රුපියල් (LKR) වල වලංගු මිලක් ඇතුළත් කරන්න.",
    invalidDays: "රැකියාවට දින කීයක් ගතවේද යන්න සංඛ්‍යාවක් ලෙස ඇතුළත් කරන්න (අවම වශයෙන් 1).",
  },
  ta: {
    dashboardTitle: "உங்கள் டாஷ்போர்டு",
    dashboardSubtitle: "மதிப்பீட்டு கோரிக்கைகள் மற்றும் அறிவிப்புகள்",
    incomingRequests: "வரும் கோரிக்கைகள்",
    loading: "ஏற்றுகிறது…",
    emptyTitle: "இன்னும் எதுவும் இல்லை",
    emptyBody:
      "வீட்டு உரிமையாளர் உங்களைத் தேர்ந்தெடுத்து மதிப்பீடு கேட்டால், வேலை சுருக்கம் இங்கே தோன்றும். செய்தி வந்தால் மணி உடனடியாக புதுப்பிக்கப்படும்.",
    statusPending: "உங்கள் மதிப்பீட்டை காத்திருக்கிறது",
    statusQuoted: "மதிப்பீடு அனுப்பப்பட்டது",
    statusAccepted: "மதிப்பீடு ஏற்கப்பட்டது",
    statusRejected: "தேர்ந்தெடுக்கப்படவில்லை",
    urgency: (level: string) => `${level} அவசரம்`,
    summaryLanguage: "வேலை சுருக்க மொழி",
    langEn: "English",
    langSi: "සිංහල",
    langTa: "தமிழ்",
    quoteSubmittedTitle: "உங்கள் மதிப்பீடு வீட்டு உரிமையாளரிடம் உள்ளது",
    quoteSubmittedPrice: (price: string) => `விலை: LKR ${price}`,
    quoteSubmittedDays: (days: number) =>
      days === 1 ? `காலம்: ${days} நாள்` : `காலம்: ${days} நாட்கள்`,
    quoteSubmittedFinal: "இறுதி என குறிக்கப்பட்டது — வீட்டு உரிமையாளர் ஏற்கலாம்",
    quoteSubmittedDraft: "இன்னும் இறுதி அல்ல — தயாரான பிறகு கீழே குறியிடுங்கள்",
    sendQuote: "உங்கள் மதிப்பீட்டை அனுப்புங்கள்",
    sendQuoteHint:
      "வீட்டு உரிமையாளர்கள் உடனடியாக புதுப்பிப்புகளைக் காண்கிறார்கள். ஏற்கத் தயாரானபோது \"இறுதி மதிப்பீடு\" என்பதைத் தேர்ந்தெடுக்கவும்.",
    priceLabel: "விலை (LKR)",
    daysLabel: "மதிப்பிடப்பட்ட காலம் (நாட்கள்)",
    notesLabel: "குறிப்புகள்",
    notesOptional: "(விரும்பினால்)",
    notesPlaceholder: "Materials, access, warranty…",
    finalQuote: "இது எனது இறுதி மதிப்பீடு",
    finalQuoteHint: "இது குறிக்கப்பட்ட பிறகே வீட்டு உரிமையாளர் ஏற்க முடியும்.",
    submitQuote: "மதிப்பீட்டை அனுப்பு",
    updateQuote: "மதிப்பீட்டை புதுப்பி",
    sending: "அனுப்புகிறது…",
    jobClosed: "வீட்டு உரிமையாளர் இப்போது மதிப்பீட்டை மூடியுள்ளார்.",
    noAction: "இந்த கோரிக்கைக்கு மேலும் நடவடிக்கை தேவையில்லை.",
    invalidPrice: "இலங்கை ரூபாய் (LKR) இல் செல்லுபடியான விலையை உள்ளிடவும்.",
    invalidDays: "வேலைக்கு எத்தனை நாட்கள் எடுக்கும் என்பதை எண்ணாக உள்ளிடவும் (குறைந்தது 1).",
  },
} as const;

export function supplierUi(lang: SupplierLang) {
  return copy[lang];
}

export function parseDurationDays(duration: string | undefined): string {
  if (!duration?.trim()) return "";
  const dayMatch = duration.trim().match(/^(\d+(?:\.\d+)?)\s*day/i);
  if (dayMatch) return String(Math.max(1, Math.round(Number(dayMatch[1]))));
  const num = duration.match(/(\d+(?:\.\d+)?)/);
  if (num) return String(Math.max(1, Math.round(Number(num[1]))));
  return "";
}

export function formatDurationDays(days: number): string {
  const n = Math.max(1, Math.round(days));
  return n === 1 ? "1 day" : `${n} days`;
}

export function statusBadgeClass(
  status: "pending" | "quoted" | "accepted" | "rejected",
): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "quoted":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    case "accepted":
      return "bg-blue-50 text-blue-900 ring-blue-200";
    case "rejected":
      return "bg-gray-100 text-gray-600 ring-gray-200";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200";
  }
}
