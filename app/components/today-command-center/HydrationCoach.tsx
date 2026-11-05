"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assessHydration } from "../../lib/coaching";

type Props = {
  totalMl: number;
  fluidGoalMl: number;
  fluidRestricted: boolean | null;
  allDrinksLogged: boolean;
};

export function HydrationCoach({ totalMl, fluidGoalMl, fluidRestricted, allDrinksLogged }: Props) {
  // Local clock rather than server UTC; initial midday copy is replaced
  // immediately after mount.
  const [hour, setHour] = useState(12);
  useEffect(() => {
    const tick = () => setHour(new Date().getHours());
    const start = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 60000);
    return () => { window.clearTimeout(start); window.clearInterval(interval); };
  }, []);
  const assessment = assessHydration(totalMl, fluidGoalMl, hour, fluidRestricted, allDrinksLogged);
  const progress = Math.round(assessment.fraction * 100);

  return (
    <section className="glass-card mt-5 p-5" aria-label="Fluid intake">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">Today&apos;s fluids</p>
          <h2 className="mt-1 text-3xl font-semibold">{assessment.headline}</h2>
        </div>
        {fluidRestricted !== true ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Daily goal: {assessment.goalMl.toLocaleString("en-US")} ml
          </p>
        ) : <p className="text-sm text-[var(--ink-soft)]">Your doctor&apos;s fluid limit</p>}
      </div>
      {fluidRestricted !== true ? (
        <div role="progressbar" aria-label="Daily drink goal progress" aria-valuemin={0}
          aria-valuemax={assessment.goalMl} aria-valuenow={Math.min(assessment.loggedMl, assessment.goalMl)}
          className="mt-4 h-3 overflow-hidden rounded-full bg-[#e3e9df]">
          <div className="h-full rounded-full bg-[#37869d] transition-all"
            style={{ width: progress + "%" }} />
        </div>
      ) : null}
      <p className="mt-3 text-sm leading-6">{assessment.guidance}</p>
      {assessment.caution ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{assessment.caution}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/logs/new?type=Water" className="secondary-button">Record a drink</Link>
        <Link href="/coaching/settings" className="text-sm font-semibold underline">Adjust goal</Link>
      </div>
    </section>
  );
}
