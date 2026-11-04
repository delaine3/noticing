"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSleepMoment } from "../../actions/sleep";
import {
  formatTimeInBed, getSleepNightStatus, localClockParts, sleepBenefitForDate,
  type SleepMoment,
} from "../../lib/sleep-utils";

type Props = { events: SleepMoment[] };

export function SleepCompanion({ events }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const state = useMemo(() => getSleepNightStatus(events), [events]);

  useEffect(() => {
    const start = window.setTimeout(() => setNow(new Date()), 0);
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, []);

  if (!now) return null;
  const parts = localClockParts(now);
  const afterNine = now.getHours() >= 21;
  const lastWake = state.lastNight?.wake;
  const lastWakeStamp = lastWake?.action_date && lastWake?.action_time
    ? Date.parse(lastWake.action_date + "T" + lastWake.action_time.slice(0, 5) + ":00")
    : 0;
  const recentWake = lastWakeStamp > now.getTime() - 36 * 3600000;
  const showCard = afterNine || !!state.pendingBedtime || recentWake;
  if (!showCard) return null;

  async function save(kind: "Bedtime" | "Woke up") {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const local = localClockParts(new Date());
      const result = await saveSleepMoment(kind, local.date, local.time);
      setMessage(result.message);
      if (result.ok) router.refresh();
    } catch {
      setMessage("Couldn't confirm the save. Check your Logs before trying again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card mt-5 border border-[var(--border-soft)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--leaf-dark)]">
        🌙 Your evening and morning
      </p>
      {state.pendingBedtime ? (
        <>
          <h2 className="mt-2 text-xl font-semibold">Good morning, whenever you're ready.</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            You recorded bedtime {state.pendingBedtime.action_date}
            {state.pendingBedtime.action_time ? " at " + state.pendingBedtime.action_time.slice(0, 5) : ""}.
            Record when you got out of bed. We will not call that time asleep.
          </p>
          <button type="button" className="submit-button mt-4 disabled:opacity-50"
            disabled={busy} onClick={() => void save("Woke up")}>
            {busy ? "Recording…" : "I'm up. Record wake time"}
          </button>
        </>
      ) : afterNine ? (
        <>
          <h2 className="mt-2 text-xl font-semibold">Ready to wind down?</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {sleepBenefitForDate(parts.date)} There is no obligation to go to bed at 9 PM.
            Record when you're actually getting into bed.
          </p>
          <button type="button" className="submit-button mt-4 disabled:opacity-50"
            disabled={busy} onClick={() => void save("Bedtime")}>
            {busy ? "Recording…" : "I'm going to bed"}
          </button>
        </>
      ) : recentWake && state.lastNight ? (
        <>
          <h2 className="mt-2 text-xl font-semibold">Last night's rest window</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {formatTimeInBed(state.lastNight.timeInBedMinutes)} between recorded bedtime and wake-up.
            This is <strong>time in bed</strong>, not measured sleep duration.
          </p>
        </>
      ) : null}
      {message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}
