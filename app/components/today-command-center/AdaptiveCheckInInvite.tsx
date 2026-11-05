"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AdaptiveCheckInInvite({ todayCount, invitesEnabled, pendingReviews }: {
  todayCount: number; invitesEnabled: boolean; pendingReviews: number;
}) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setHour(new Date().getHours()), 0);
    return () => window.clearTimeout(t);
  }, []);
  if (!invitesEnabled && pendingReviews === 0) return null;
  const offer = invitesEnabled && hour !== null &&
    ((todayCount === 0 && hour >= 9 && hour <= 21) ||
     (todayCount === 1 && hour >= 17 && hour <= 21));
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
      <Link href="/check-in" className="submit-button">
        {pendingReviews > 0 ? "Review outcome" : "Check in"}
      </Link>
    </section>
  );
}
