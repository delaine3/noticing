/**
 * Derive the calendar day in the browser's reported IANA time zone.
 * Fall back to UTC if the cookie is missing or malformed.
 */
export function dayInTimeZone(timeZone?: string, now: Date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const part = (name: string) => parts.find((x) => x.type === name)?.value ?? "";
    const date = part("year") + "-" + part("month") + "-" + part("day");
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch { /* Invalid timezone cookie; use UTC below. */ }
  return now.toISOString().slice(0, 10);
}
