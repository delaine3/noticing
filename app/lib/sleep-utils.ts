export type SleepMoment = {
  id: number;
  log_type: string;
  action_date: string | null;
  action_time: string | null;
  notes?: string | null;
};

const benefits = [
  "Regular sleep helps your brain consolidate memories, including things learned during the day.",
  "Consistent sleep and waking times can make it easier for your body clock to anticipate rest.",
  "A full night of sleep supports attention and decision-making the following day.",
  "Sleep is important for immune function and recovery from normal daily activity.",
  "Giving yourself enough time for sleep can support emotional regulation.",
  "Rest helps the body recover after exercise and other physical activity.",
  "A steady bedtime routine gives your mind a repeatable signal that the day is winding down.",
] as const;

export function sleepBenefitForDate(localDate: string): string {
  // A different benefit for consecutive dates, repeating after one week.
  const date = Date.parse(localDate + "T12:00:00Z");
  if (!Number.isFinite(date)) return benefits[0];
  return benefits[Math.floor(date / 86400000) % benefits.length];
}

export function localClockParts(now: Date) {
  return {
    date: now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0"),
    time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
  };
}

function stamp(moment: SleepMoment): number | null {
  if (!moment.action_date || !moment.action_time ||
      !/^\d{4}-\d{2}-\d{2}$/.test(moment.action_date) ||
      !/^\d{2}:\d{2}/.test(moment.action_time)) return null;
  const instant = Date.parse(moment.action_date + "T" + moment.action_time.slice(0, 5) + ":00");
  return Number.isFinite(instant) ? instant : null;
}

export function getSleepNightStatus(events: SleepMoment[]) {
  const sorted = events.filter((item) => item.log_type === "Bedtime" || item.log_type === "Woke up")
    .map((item) => ({ item, at: stamp(item) }))
    .filter((entry): entry is { item: SleepMoment; at: number } => entry.at !== null)
    .sort((a, b) => a.at - b.at || a.item.id - b.item.id);
  let pending: { item: SleepMoment; at: number } | null = null;
  let lastNight: { bedtime: SleepMoment; wake: SleepMoment; timeInBedMinutes: number } | null = null;
  for (const event of sorted) {
    if (event.item.log_type === "Bedtime") {
      pending = event;
    } else if (pending) {
      const minutes = Math.round((event.at - pending.at) / 60000);
      // 0–24 hours is a bounded interval to prevent matching unrelated days.
      if (minutes > 0 && minutes <= 1440) {
        lastNight = { bedtime: pending.item, wake: event.item, timeInBedMinutes: minutes };
      }
      pending = null;
    }
  }
  return { pendingBedtime: pending?.item ?? null, lastNight };
}

export function formatTimeInBed(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h + "h " + String(m).padStart(2, "0") + "m";
}
