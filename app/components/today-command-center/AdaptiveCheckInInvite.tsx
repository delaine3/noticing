"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AdaptiveCheckInInvite({ todayCount, invitesEnabled, pendingReviews, lastCheckinAt }: {
  todayCount: number; invitesEnabled: boolean; pendingReviews: number; lastCheckinAt: string | null;
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
  const longEnoughSinceCheckin = !lastCheckinAt ||
    (nowMs !== null && nowMs - new Date(lastCheckinAt).getTime() >= 4 * 3600000);
  const offer = !dismissed && invitesEnabled && hour !== null &&
    ((todayCount === 0 && hour >= 9 && hour <= 21) ||
     (todayCount === 1 && hour >= 17 && hour <= 21 && longEnoughSinceCheckin));
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
            ? "A follow-up you requested is ready. Your answer can improve future suggestions."
            : "A short check-in can help you decide what your body and mind need next."}
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
