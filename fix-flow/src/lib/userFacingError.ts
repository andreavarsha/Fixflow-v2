type ErrorContext = "login" | "signup" | "general";

/** Strip Convex / network noise so we can match on the underlying message. */
function extractMessage(raw: string): string {
  let msg = raw.trim();

  const uncaught = msg.match(/Uncaught Error:\s*(.+?)(?:\s+Called by client)?$/i);
  if (uncaught) msg = uncaught[1].trim();

  msg = msg.replace(/\[CONVEX[^\]]*\]/gi, "").trim();
  msg = msg.replace(/\[Request ID:[^\]]+\]/gi, "").trim();
  msg = msg.replace(/^Server Error\s*/i, "").trim();

  return msg;
}

const EXACT: Record<string, string> = {
  "Not authenticated": "Please sign in again to continue.",
  "Only property owners can submit jobs": "Only homeowner accounts can report a repair issue.",
  "Only property owners can upload job photos": "Only homeowner accounts can upload photos.",
  "Only property owners can request quotes": "Only homeowner accounts can request quotes.",
  "Only suppliers can submit quotes": "Please sign in with a supplier account to send a quote.",
  "You are not part of this conversation": "You don't have access to this chat.",
  "You can only message suppliers invited to this job":
    "You can only message suppliers you've invited to quote on this job.",
  "You can only message the homeowner for this job":
    "You can only message the homeowner for this job.",
  "Cannot message yourself": "You can't send a message to yourself.",
  "Message cannot be empty": "Type a message before sending.",
  "Message is too long": "Please keep your message under 500 characters.",
  "Description is required": "Please describe the problem before continuing.",
  "Summary cannot be empty": "Please enter a short summary before saving.",
  "Not authorized": "You don't have permission to change this job.",
  "Can only edit classified jobs": "You can only edit the summary while the job is open.",
  "Job not found": "This job could not be found. It may have been removed.",
  "This job is not accepting quotes": "This job is no longer accepting quotes.",
  "You were not invited to quote on this job": "You weren't invited to quote on this job.",
  "Quote request is no longer active": "This quote request is no longer active.",
  "Duration is required": "Please say how long the work will take (for example, 2 days).",
  "Price must be greater than zero": "Please enter a price greater than zero.",
  "Quote not found for this job": "That quote could not be found for this job.",
  "Quote must be submitted before it can be accepted": "Wait until the supplier submits their quote before accepting.",
  "This job is not in progress": "This job is not waiting for completion.",
  "You are not the accepted tradesperson for this job":
    "Only the hired tradesperson can mark this job complete.",
  "Payment is not due for this job yet":
    "Payment is not ready yet — wait until the tradesperson marks the job complete.",
  "No accepted supplier on this job": "No tradesperson is assigned to this job.",
  "Job must be classified before requesting quotes":
    "Wait until we finish sorting your request, then try again.",
  "Select at least one supplier": "Choose at least one supplier to continue.",
  "One or more suppliers are not available for this job":
    "One of the suppliers you picked is no longer available. Refresh the list and try again.",
  "Supplier not found": "That supplier could not be found.",
  "Role is required (owner or supplier)": "Please choose whether you are a homeowner or supplier.",
};

function matchPartial(
  lower: string,
  cleaned: string,
  context: ErrorContext,
): string | null {
  if (lower.includes("too many requests")) {
    return cleaned;
  }

  if (
    lower.includes("invalidaccountid") ||
    lower.includes("invalid account") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password") ||
    lower.includes("incorrect password")
  ) {
    return context === "signup"
      ? "We couldn't create your account with those details. Try a different email or check your password."
      : "Email or password doesn't match our records. Check your details or sign up for a new account.";
  }

  if (lower.includes("invalid password") || lower.includes("password must")) {
    return "Password must be at least 8 characters.";
  }

  if (lower.includes("already exists") || lower.includes("already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("load failed")) {
    return "Connection problem. Check your internet and try again.";
  }

  if (lower.includes("not authenticated") || lower.includes("unauthorized")) {
    return EXACT["Not authenticated"];
  }

  if (lower.includes("description must be at most")) {
    return "Please shorten your description to 300 characters or fewer.";
  }

  if (lower.includes("you can select at most")) {
    return "You can choose up to three suppliers. Tap one to deselect before adding another.";
  }

  if (lower.includes("out_of_coverage") || lower.includes("not live at this pin")) {
    return "FixFlow is not live at this pin yet. Join the waitlist with your email.";
  }

  if (lower.includes("supplier accounts are not created")) {
    return "Supplier accounts are invited by FixFlow — sign up as a homeowner, or use a demo supplier login.";
  }

  if (lower.includes("already rated")) {
    return "You already left a rating for this job.";
  }

  return null;
}

/**
 * Turn thrown errors (including raw Convex auth errors) into short copy for the UI.
 */
export function toUserFacingError(
  err: unknown,
  context: ErrorContext = "general",
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Something went wrong. Please try again.";

  const cleaned = extractMessage(raw);
  const lower = cleaned.toLowerCase();

  if (EXACT[cleaned]) return EXACT[cleaned];

  const partial = matchPartial(lower, cleaned, context);
  if (partial) return partial;

  if (context === "login") {
    return "We couldn't sign you in. Check your email and password, or create an account.";
  }
  if (context === "signup") {
    return "We couldn't create your account. Try again or use a different email.";
  }

  if (cleaned.length > 0 && cleaned.length <= 160 && !looksTechnical(cleaned)) {
    return cleaned;
  }

  return "Something went wrong. Please try again.";
}

function looksTechnical(message: string): boolean {
  return (
    /\[CONVEX/i.test(message) ||
    /Request ID:/i.test(message) ||
    /Uncaught Error/i.test(message) ||
    /Called by client/i.test(message) ||
    /Server Error/i.test(message) ||
    /^[A-Z][a-z]+[A-Z]/.test(message)
  );
}
