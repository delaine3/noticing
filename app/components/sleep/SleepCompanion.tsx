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
  const afterNine = now.getHours() >= 21 || now.getHours() < 3;
  const lastWake = state.lastNight?.wake;
  const lastWakeStamp = lastWake?.action_date && lastWake?.action_time
    ? Date.parse(lastWake.action_date + "T" + lastWake.action_time.slice(0, 5) + ":00")
    : 0;
  const recentWake = lastWakeStamp > now.getTime() - 36 * 3600000;
  const showCard = afterNine || !!state.pendingBedtime || recentWake;
  const bedtimeTimestamp = state.pendingBedtime?.action_date && state.pendingBedtime?.action_time
    ? Date.parse(state.pendingBedtime.action_date + "T" + state.pendingBedtime.action_time.slice(0, 5) + ":00")
    : 0;
  const bedtimeAgeMinutes = bedtimeTimestamp ? (now.getTime() - bedtimeTimestamp) / 60000 : null;
  const newlyRecordedBedtime = bedtimeAgeMinutes !== null && bedtimeAgeMinutes >= 0 &&
    bedtimeAgeMinutes < 240;
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
      {state.pendingBedtime && newlyRecordedBedtime ? (
        <>
          <h2 className="mt-2 text-xl font-semibold">Bedtime recorded. Rest well 🌙</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            You recorded getting into bed at {state.pendingBedtime.action_time?.slice(0, 5)}.
            When you get up, you can record your wake time.
          </p>
        </>
      ) : state.pendingBedtime ? (
        <>
          <h2 className="mt-2 text-xl font-semibold">Good morning, whenever you&apos;re ready.</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            You recorded bedtime {state.pendingBedtime.action_date}
            {state.pendingBedtime.action_time ? " at " + state.pendingBedtime.action_time.slice(0, 5) : ""}.
            Record when you got up.
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
            {sleepBenefitForDate(parts.date)} When you head to bed, tap the button.
          </p>
          <button type="button" className="submit-button mt-4 disabled:opacity-50"
            disabled={busy} onClick={() => void save("Bedtime")}>
            {busy ? "Recording…" : "I'm going to bed"}
          </button>
        </>
      ) : recentWake && state.lastNight ? (
        <>
          <h2 className="mt-2 text-xl font-semibold">Last night&apos;s rest window</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {formatTimeInBed(state.lastNight.timeInBedMinutes)} between recorded bedtime and wake-up.
            <strong>Time in bed</strong>.
          </p>
        </>
      ) : null}
      {message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}
