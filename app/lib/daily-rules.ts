export type DailyLog = {
  id: number;
  log_type: string;
  title: string | null;
  notes: string | null;
  effect: string | null;
  action_date: string | null;
  action_time: string | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
  meal_size: string | null;
  meal_source: string | null;
  water_amount_ml: number | null;
  occurred_at: string;
};

export type ReportItem = {
  label: string;
  status: "gold" | "check" | "warning" | "code-red" | "demerit" | "neutral";
  emoji: string;
  message: string;
};

export type TimeBucket = {
  label: string;
  endTime: string | null;
  logs: DailyLog[];
};

function timeToMinutes(time: string | null) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function hasLog(logs: DailyLog[], types: string[]) {
  return logs.some((log) => types.includes(log.log_type));
}

function getFirstLog(logs: DailyLog[], types: string[]) {
  return logs
    .filter((log) => types.includes(log.log_type))
    .sort((a, b) => {
      const aMinutes = timeToMinutes(a.action_time) ?? Number.POSITIVE_INFINITY;
      const bMinutes = timeToMinutes(b.action_time) ?? Number.POSITIVE_INFINITY;

      return aMinutes - bMinutes;
    })[0];
}

export function getEffectEmoji(effect: string | null) {
  if (effect === "helpful") return "🌿";
  if (effect === "harmful") return "⚠️";
  return "";
}

export function getTimeBuckets(logs: DailyLog[]): TimeBucket[] {
  const buckets: TimeBucket[] = [
    { label: "Before 10am", endTime: "10:00", logs: [] },
    { label: "10am to 2pm", endTime: "14:00", logs: [] },
    { label: "2pm to 6pm", endTime: "18:00", logs: [] },
    { label: "6pm to 10pm", endTime: "22:00", logs: [] },
    { label: "After 10pm", endTime: null, logs: [] },
    { label: "All day", endTime: null, logs: [] },
  ];

  logs.forEach((log) => {
    const minutes = timeToMinutes(log.action_time);

    if (minutes === null) {
      buckets[5].logs.push(log);
      return;
    }

    if (minutes < 10 * 60) {
      buckets[0].logs.push(log);
      return;
    }

    if (minutes < 14 * 60) {
      buckets[1].logs.push(log);
      return;
    }

    if (minutes < 18 * 60) {
      buckets[2].logs.push(log);
      return;
    }

    if (minutes < 22 * 60) {
      buckets[3].logs.push(log);
      return;
    }

    buckets[4].logs.push(log);
  });

  return buckets.map((bucket) => ({
    ...bucket,
    logs: bucket.logs.sort((a, b) => {
      const aMinutes = timeToMinutes(a.action_time) ?? Number.POSITIVE_INFINITY;
      const bMinutes = timeToMinutes(b.action_time) ?? Number.POSITIVE_INFINITY;

      return aMinutes - bMinutes;
    }),
  }));
}

export function getDailyReport(logs: DailyLog[]): ReportItem[] {
  const report: ReportItem[] = [];

  const firstMeal = getFirstLog(logs, ["First meal"]);
  const firstMealMinutes = timeToMinutes(firstMeal?.action_time ?? null);

  if (!firstMeal) {
    report.push({
      label: "First meal",
      status: "demerit",
      emoji: "🚫",
      message:
        "No first meal logged. The body was left unmanaged. Fix this tomorrow.",
    });
  } else if (firstMealMinutes !== null && firstMealMinutes < 10 * 60) {
    report.push({
      label: "First meal",
      status: "gold",
      emoji: "⭐",
      message: "First meal before 10am. Excellent. Gold star behavior.",
    });
  } else if (firstMealMinutes !== null && firstMealMinutes < 14 * 60) {
    report.push({
      label: "First meal",
      status: "check",
      emoji: "✅",
      message: "First meal before 2pm. Acceptable. Keep this as the minimum.",
    });
  } else if (firstMealMinutes !== null && firstMealMinutes < 18 * 60) {
    report.push({
      label: "First meal",
      status: "warning",
      emoji: "👎",
      message:
        "First meal before 6pm. Too late. You made the day harder than it needed to be.",
    });
  } else {
    report.push({
      label: "First meal",
      status: "code-red",
      emoji: "🚨",
      message:
        "First meal after 6pm. Code Red. This is how the day turns feral.",
    });
  }

  const wokeUp = getFirstLog(logs, ["Woke up"]);
  const wakeMinutes = timeToMinutes(wokeUp?.action_time ?? null);
  function getTotalWaterMl(logs: DailyLog[]) {
    return logs.reduce((total, log) => total + (log.water_amount_ml ?? 0), 0);
  }
  if (!wokeUp) {
    report.push({
      label: "Wake time",
      status: "neutral",
      emoji: "📝",
      message: "Wake time not logged. Tomorrow, log the starting point first.",
    });
  } else if (wakeMinutes !== null && wakeMinutes < 9 * 60) {
    report.push({
      label: "Wake time",
      status: "gold",
      emoji: "⭐",
      message: "Wake time logged before 9am. Strong start.",
    });
  } else if (wakeMinutes !== null && wakeMinutes < 11 * 60) {
    report.push({
      label: "Wake time",
      status: "check",
      emoji: "✅",
      message: "Wake time logged before 11am. Fine. Keep the day moving.",
    });
  } else {
    report.push({
      label: "Wake time",
      status: "warning",
      emoji: "👎",
      message: "Late wake. No shame spiral, but the day needs structure fast.",
    });
  }
  const totalWaterMl = getTotalWaterMl(logs);

  if (totalWaterMl >= 1500) {
    report.push({
      label: "Water",
      status: "gold",
      emoji: "⭐",
      message: `Water logged: ${totalWaterMl}ml. Hydrated citizen behavior.`,
    });
  } else if (totalWaterMl >= 750) {
    report.push({
      label: "Water",
      status: "check",
      emoji: "✅",
      message: `Water logged: ${totalWaterMl}ml. Acceptable, but do not get cocky.`,
    });
  } else if (totalWaterMl > 0) {
    report.push({
      label: "Water",
      status: "warning",
      emoji: "👎",
      message: `Only ${totalWaterMl}ml logged. That is decorative hydration. Drink more.`,
    });
  } else {
    report.push({
      label: "Water",
      status: "demerit",
      emoji: "🚫",
      message: "No water logged. Dry goblin management failure.",
    });
  }

  const sunlight = getFirstLog(logs, ["Sunlight"]);
  const sunlightMinutes = timeToMinutes(sunlight?.action_time ?? null);

  if (!sunlight) {
    report.push({
      label: "Sunlight",
      status: "demerit",
      emoji: "🚫",
      message: "No sunlight logged. The mammal protocol was ignored.",
    });
  } else if (sunlightMinutes !== null && sunlightMinutes < 14 * 60) {
    report.push({
      label: "Sunlight",
      status: "gold",
      emoji: "⭐",
      message: "Sunlight before 2pm. Elite body management.",
    });
  } else if (sunlightMinutes !== null && sunlightMinutes < 18 * 60) {
    report.push({
      label: "Sunlight",
      status: "check",
      emoji: "✅",
      message: "Sunlight before 6pm. Good save.",
    });
  } else {
    report.push({
      label: "Sunlight",
      status: "warning",
      emoji: "👎",
      message:
        "Sunlight logged late. Better than nothing, but tomorrow needs earlier light.",
    });
  }

  if (
    hasLog(logs, [
      "Movement",
      "Exercise",
      "Treadmill walk",
      "Strength training",
    ])
  ) {
    report.push({
      label: "Movement",
      status: "check",
      emoji: "✅",
      message: "Movement logged.",
    });
  } else {
    report.push({
      label: "Movement",
      status: "demerit",
      emoji: "🚫",
      message:
        "No movement logged. Do it now: five minutes counts. No speeches.",
    });
  }

  if (hasLog(logs, ["Wash Up"])) {
    report.push({
      label: "Wash up",
      status: "check",
      emoji: "✅",
      message: "Wash-up logged. System reset achieved.",
    });
  } else {
    report.push({
      label: "Wash up",
      status: "neutral",
      emoji: "📝",
      message: "No wash-up logged. If the day felt sticky, this may be why.",
    });
  }

  if (hasLog(logs, ["App work"])) {
    report.push({
      label: "Useful task",
      status: "check",
      emoji: "✅",
      message: "App work logged. Future-you received value.",
    });
  } else {
    report.push({
      label: "Useful task",
      status: "neutral",
      emoji: "📝",
      message: "No useful task logged. Not a crime, but track the pattern.",
    });
  }

  if (hasLog(logs, ["TikTok avoided"])) {
    report.push({
      label: "Attention",
      status: "gold",
      emoji: "⭐",
      message: "TikTok avoided. Attention defended. Excellent.",
    });
  } else if (hasLog(logs, ["TikTok used"])) {
    report.push({
      label: "Attention",
      status: "warning",
      emoji: "👎",
      message:
        "TikTok used. Check the cost. Did it help, or did it eat the day?",
    });
  }

  const thoughtLoop = getFirstLog(logs, ["Recurring thought"]);

  if (thoughtLoop?.intensity_score && thoughtLoop.intensity_score >= 7) {
    report.push({
      label: "Thought loop",
      status: "code-red",
      emoji: "🚨",
      message:
        "High-intensity thought loop logged. Do body maintenance before analysis.",
    });
  } else if (thoughtLoop) {
    report.push({
      label: "Thought loop",
      status: "warning",
      emoji: "👎",
      message:
        "Thought loop logged. Evidence collected. Do not feed it more attention.",
    });
  }

  return report;
}
