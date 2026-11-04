"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Only the IANA time zone is stored, never the device's geographic position. */
export function TimezoneSync() {
  const router = useRouter();
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone || zone.length > 80) return;
    const value = encodeURIComponent(zone);
    const present = document.cookie.split("; ").find((cookie) => cookie.startsWith("noticing_timezone="));
    if (present === "noticing_timezone=" + value) return;
    document.cookie = "noticing_timezone=" + value + "; Path=/; SameSite=Lax; Max-Age=2592000";
    router.refresh();
  }, [router]);
  return null;
}
