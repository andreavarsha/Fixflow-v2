/** Two-letter avatar fallback from a display name, or the local part of an email. */
export function initials(name: string | undefined, email: string | undefined): string {
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
