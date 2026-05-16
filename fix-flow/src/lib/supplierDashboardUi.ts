export type SupplierLang = "en" | "si" | "ta";

const copy = {
  en: {
    roleLabel: "Tradesperson",
    dashboardTitle: "FixFlow",
    dashboardSubtitle:
      "Review homeowner requests, send quotes, and chat — all in one place.",
    incomingRequests: "Incoming requests",
    incomingHint: "New jobs appear when a homeowner invites you to quote.",
    filterAll: "All",
    filterAction: "Needs quote",
    filterSubmitted: "Submitted",
    filterActive: "Active jobs",
    filterClosed: "Closed",
    statAwaiting: "Awaiting quote",
    statSubmitted: "Quotes sent",
    statWon: "Accepted",
    statLost: "Not selected",
    notificationsTitle: "Notifications",
    notificationsHint: "Messages and updates from homeowners.",
    notificationsHintOpenChat:
      "Tap a message to open the chat on that job. Messages are not emailed — check here or open Message homeowner.",
    notificationsEmpty: "You're all caught up.",
    loading: "Loading…",
    emptyTitle: "No requests yet",
    emptyBody:
      "When a homeowner picks you for a quote, the job will show up here. Your notification bell updates live.",
    emptyFiltered: "Nothing in this view — try another filter.",
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
    awaitingPayment:
      "Waiting for the homeowner to pay. You will be notified when payment is confirmed.",
    jobPaidComplete: "Payment received — this job is complete. Thank you!",
    notSelected: "The homeowner chose another tradesperson for this job.",
    invalidPrice: "Enter a valid price in Sri Lankan Rupees (LKR).",
    invalidDays: "Enter how many days the job will take (whole number, at least 1).",
  },
  si: {
    roleLabel: "වෘත්තික",
    dashboardTitle: "FixFlow",
    dashboardSubtitle:
      "ගෘහස්ථ ඉල්ලීම්, මිල ගණන් යැවීම සහ කතාබහ — එකම ස්ථානයකින්.",
    incomingRequests: "ලැබෙන ඉල්ලීම්",
    incomingHint: "ගෘහස්ථයෙක් ඔබට මිල ගණන් ඉල්ලූ විට නව රැකියා දිස්වේ.",
    filterAll: "සියල්ල",
    filterAction: "මිල ගණන් අවශ්‍ය",
    filterSubmitted: "යැව්වා",
    filterActive: "සක්‍රිය රැකියා",
    filterClosed: "වසා ඇත",
    statAwaiting: "මිල ගණන් බලාපොරොත්තු",
    statSubmitted: "යැවූ මිල ගණන්",
    statWon: "පිළිගත්",
    statLost: "තෝරා නැත",
    notificationsTitle: "දැනුම්දීම්",
    notificationsHint: "ගෘහස්ථයින්ගෙන් පණිවිඩ සහ යාවත්කාලීන.",
    notificationsHintOpenChat:
      "පණිවිඩයක් තට්ටු කරන්න — එම රැකියාවේ කතාබහ විවෘත වේ.",
    notificationsEmpty: "සියල්ල නිමයි.",
    loading: "පූරණය වෙමින්…",
    emptyTitle: "තවම ඉල්ලීම් නැත",
    emptyBody:
      "ගෘහස්ථයෙක් ඔබට මිල ගණන් ඉල්ලූ විට රැකියා මෙහි දිස්වේ.",
    emptyFiltered: "මෙම දර්ශනයේ කිසිවක් නැත — වෙනත් පෙරහනක් උත්සාහ කරන්න.",
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
    awaitingPayment: "ගෘහස්ථයාගේ ගෙවීම බලාපොරොත්තුවෙන්.",
    jobPaidComplete: "ගෙවීම ලැබුණා — රැකියාව නිමයි.",
    notSelected: "ගෘහස්ථයා වෙනත් වෘත්තිකයෙකු තෝරා ගත්තා.",
    invalidPrice: "ශ්‍රී ලංකා රුපියල් (LKR) වල වලංගු මිලක් ඇතුළත් කරන්න.",
    invalidDays: "රැකියාවට දින කීයක් ගතවේද යන්න සංඛ්‍යාවක් ලෙස ඇතුළත් කරන්න (අවම වශයෙන් 1).",
  },
  ta: {
    roleLabel: "தொழில்முறை",
    dashboardTitle: "FixFlow",
    dashboardSubtitle:
      "வீட்டு உரிமையாளர் கோரிக்கைகள், மதிப்பீடு, அரட்டை — ஒரே இடத்தில்.",
    incomingRequests: "வரும் கோரிக்கைகள்",
    incomingHint: "வீட்டு உரிமையாளர் உங்களை அழைக்கும்போது புதிய வேலைகள் தோன்றும்.",
    filterAll: "அனைத்தும்",
    filterAction: "மதிப்பீடு தேவை",
    filterSubmitted: "அனுப்பப்பட்டது",
    filterActive: "செயலில் உள்ள வேலைகள்",
    filterClosed: "மூடப்பட்டது",
    statAwaiting: "காத்திருக்கிறது",
    statSubmitted: "அனுப்பிய மதிப்பீடுகள்",
    statWon: "ஏற்கப்பட்டது",
    statLost: "தேர்ந்தெடுக்கப்படவில்லை",
    notificationsTitle: "அறிவிப்புகள்",
    notificationsHint: "வீட்டு உரிமையாளர்களிடமிருந்து செய்திகள்.",
    notificationsHintOpenChat:
      "செய்தியைத் தட்டவும் — அந்த வேலையின் அரட்டை திறக்கும்.",
    notificationsEmpty: "அனைத்தும் பார்க்கப்பட்டது.",
    loading: "ஏற்றுகிறது…",
    emptyTitle: "இன்னும் கோரிக்கைகள் இல்லை",
    emptyBody:
      "வீட்டு உரிமையாளர் உங்களைத் தேர்ந்தெடுத்தால் வேலை இங்கே தோன்றும்.",
    emptyFiltered: "இந்த காட்சியில் எதுவும் இல்லை — வேறு வடிகட்டியை முயற்சிக்கவும்.",
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
    awaitingPayment: "வீட்டு உரிமையாளரின் பணம் காத்திருக்கிறது.",
    jobPaidComplete: "பணம் உறுதி — வேலை முடிந்தது.",
    notSelected: "வீட்டு உரிமையாளர் வேறு தொழில்முறையாளரைத் தேர்ந்தெடுத்தார்.",
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
