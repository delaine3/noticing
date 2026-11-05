"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AdaptiveCheckInInvite({ todayCount, invitesEnabled, maxDailyInvites, pendingReviews, lastCheckinAt }: {
  todayCount: number; invitesEnabled: boolean; maxDailyInvites: number;
  pendingReviews: number; lastCheckinAt: string | null;
}) {
  const [hour, setHour] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const now = new Date();
      setHour(now.getHours());
      setNowMs(now.getTime());
      setDismissed(window.localStorage.getItem("noticing_checkin_dismissed") ===
        new Date().toLocaleDateString("en-CA"));
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  if (!invitesEnabled && pendingReviews === 0) return null;
  // There is no cap on manual check-ins. This only determines whether Today
  // suggests another check-in, with a spacing interval based on preferences.
  const desired = Number.isInteger(maxDailyInvites) ? Math.max(0, Math.min(24, maxDailyInvites)) : 2;
  const gapMinutes = Math.max(20, Math.round((14 * 60) / Math.max(1, desired)));
  const longEnoughSinceCheckin = !lastCheckinAt ||
    (nowMs !== null && nowMs - new Date(lastCheckinAt).getTime() >= gapMinutes * 60000);
  const offer = !dismissed && invitesEnabled && desired > 0 && hour !== null &&
    hour >= 8 && hour <= 22 && todayCount < desired && longEnoughSinceCheckin;
  if (!offer && !pendingReviews) return null;

  return (
    <section className="glass-card mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">
          Your wellbeing
        </p>
        <h2 className="mt-1 text-xl font-semibold">
          {pendingReviews > 0 ? "How did that suggestion work out?" : "How are you doing right now?"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          {pendingReviews > 0
            ? "You asked to revisit a suggestion. How did it go?"
            : "Want to check in for a moment?"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/check-in" className="submit-button">
          {pendingReviews > 0 ? "Review outcome" : "Check in"}
        </Link>
        {!pendingReviews ? (
          <button type="button" className="text-sm underline" onClick={() => {
            window.localStorage.setItem("noticing_checkin_dismissed",
              new Date().toLocaleDateString("en-CA"));
            setDismissed(true);
          }}>Not today</button>
        ) : null}
      </div>
    </section>
  );
}
