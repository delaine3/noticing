import { DailyLog } from "./log-types";
import { ReportItem } from "./report-item";

export type TimeBucket = {
  label: string;
  logs: DailyLog[];
};

type NextAction = {
  title: string;
  body: string;
  href: string;
  label: string;
};

export const quickActions = [
  { label: "Daily check-in", href: "/logs/new?type=Daily%20check-in" },
  { label: "I slept", href: "/logs/new?type=Sleep" },
  { label: "I woke up", href: "/logs/new?type=Woke%20up" },
  { label: "I ate", href: "/logs/new?type=First%20meal" },
  { label: "I had a drink", href: "/logs/new?type=Water" },
  { label: "I went outside", href: "/logs/new?type=Sunlight" },
  { label: "I moved", href: "/logs/new?type=Movement" },
  { label: "I applied to a job", href: "/logs/new?type=Job%20application" },
  { label: "I followed up", href: "/logs/new?type=Job%20follow-up" },
  { label: "I finished some work", href: "/logs/new?type=Focused%20work" },
  { label: "I had a recurring thought", href: "/logs/new?type=Recurring%20thought" },
];

function timeToMinutes(time: string | null) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function hasLog(logs: DailyLog[], types: string[]) {
  return logs.some((log) => types.includes(log.log_type));
}

function getFirstLog(logs: DailyLog[], types: string[]) {
  return logs
    .filter((log) => types.includes(log.log_type))
    .sort((a, b) =>
      (timeToMinutes(a.action_time) ?? Number.POSITIVE_INFINITY) -
      (timeToMinutes(b.action_time) ?? Number.POSITIVE_INFINITY)
    )[0];
}

function formatRecordedTime(time: string | null) {
  return time ? time.slice(0, 5) : "time not entered";
}

// The database field is used for water, coffee and other drinks.
// This is recorded drink volume, not an estimate of total hydration.
export function getTotalWaterMl(logs: DailyLog[]) {
  return logs.reduce((total, log) => total + (log.water_amount_ml ?? 0), 0);
}

export function getEffectEmoji(effect: string | null) {
  if (effect === "restorative") return "⭐";
  if (effect === "helpful") return "🌿";
  if (effect === "unhelpful") return "🫠";
  if (effect === "harmful") return "⚠️";
  if (effect === "detrimental") return "🚨";
  return "";
}

export function getReportCardStyle(status: string) {
  if (status === "gold") return "bg-amber-50";
  if (status === "check") return "bg-green-50";
  if (status === "warning") return "bg-orange-50";
  if (status === "code-red") return "bg-red-50";
  if (status === "demerit") return "bg-black-100";
  return "bg-white";
}

export function getNextActionCopy(logs: DailyLog[]): NextAction {
  if (logs.length > 0 && !hasLog(logs, ["Daily check-in"])) {
    return {
      title: "A check-in could help",
      body: "Record your mood, energy and stress today. This becomes useful when measured consistently over several days.",
      href: "/logs/new?type=Daily%20check-in",
      label: "Record a check-in",
    };
  }

  if (!hasLog(logs, ["Water", "Coffee"])) {
    return {
      title: "No drinks recorded yet",
      body: "Already had a drink? Record its amount. Otherwise, get a drink when you need one and log it.",
      href: "/logs/new?type=Water",
      label: "Record a drink",
    };
  }

  if (!hasLog(logs, ["First meal", "Meal"])) {
    return {
      title: "No meal recorded yet",
      body: "If you've eaten, log what and when. If not, plan your next meal based on your day.",
      href: "/logs/new?type=First%20meal",
      label: "Record a meal",
    };
  }

  if (!hasLog(logs, ["Movement", "Exercise", "Treadmill walk", "Strength training", "Yard Work"])) {
    return {
      title: "No movement recorded yet",
      body: "If you moved, record the activity and duration. Otherwise, a short walk or stretch is an option.",
      href: "/logs/new?type=Movement",
      label: "Record movement",
    };
  }

  return {
    title: "Record one result that matters",
    body: "Write what you completed, how long it took, and what the next step is. You can also stop logging for now.",
    href: "/logs/new?type=App%20work",
    label: "Record a task",
  };
}

export function getTimeBuckets(logs: DailyLog[]): TimeBucket[] {
  const buckets: TimeBucket[] = [
    { label: "Before 10am", logs: [] },
    { label: "10am to 2pm", logs: [] },
    { label: "2pm to 6pm", logs: [] },
    { label: "6pm to 10pm", logs: [] },
    { label: "After 10pm", logs: [] },
    { label: "Time not recorded", logs: [] },
  ];

  logs.forEach((log) => {
    const minutes = timeToMinutes(log.action_time);
    if (minutes === null) buckets[5].logs.push(log);
    else if (minutes < 10 * 60) buckets[0].logs.push(log);
    else if (minutes < 14 * 60) buckets[1].logs.push(log);
    else if (minutes < 18 * 60) buckets[2].logs.push(log);
    else if (minutes < 22 * 60) buckets[3].logs.push(log);
    else buckets[4].logs.push(log);
  });

  return buckets.map((bucket) => ({
    ...bucket,
    logs: bucket.logs.sort((a, b) =>
      (timeToMinutes(a.action_time) ?? Number.POSITIVE_INFINITY) -
      (timeToMinutes(b.action_time) ?? Number.POSITIVE_INFINITY)
    ),
  }));
}

function getMealReport(logs: DailyLog[]): ReportItem {
  const firstMeal = getFirstLog(logs, ["First meal"]);
  if (firstMeal) {
    return {
      label: "First meal",
      status: "check",
      emoji: "📝",
      message: "Recorded at " + formatRecordedTime(firstMeal.action_time) +
        (firstMeal.title ? ": " + firstMeal.title : "."),
    };
  }

  if (hasLog(logs, ["Meal"])) {
    return {
      label: "Meals",
      status: "neutral",
      emoji: "📝",
      message: "A meal is recorded, but none is marked as the first meal.",
    };
  }

  return {
    label: "Meals",
    status: "neutral",
    emoji: "○",
    message: "No meal entered today. This does not establish whether you ate.",
  };
}

function getWakeReport(logs: DailyLog[]): ReportItem {
  const wake = getFirstLog(logs, ["Woke up"]);
  return {
    label: "Wake time",
    status: wake ? "check" : "neutral",
    emoji: wake ? "📝" : "○",
    message: wake ? "Recorded wake time: " + formatRecordedTime(wake.action_time) + "." :
      "Wake time not recorded.",
  };
}

function getDrinkReport(logs: DailyLog[]): ReportItem {
  const total = getTotalWaterMl(logs);
  const drinks = logs.filter((log) => log.water_amount_ml !== null);
  return {
    label: "Drinks",
    status: drinks.length ? "check" : "neutral",
    emoji: drinks.length ? "📝" : "○",
    message: drinks.length
      ? drinks.length + " drink entries, " + total + " ml recorded. Includes coffee and other liquids."
      : "No drink quantities entered. This is not proof of zero intake.",
  };
}

function getRecordedReport(logs: DailyLog[], label: string, types: string[], detail: string): ReportItem {
  const count = logs.filter((log) => types.includes(log.log_type)).length;
  return {
    label,
    status: count ? "check" : "neutral",
    emoji: count ? "📝" : "○",
    message: count ? count + " " + (count === 1 ? "entry" : "entries") + " recorded. " + detail :
      "No entry recorded today.",
  };
}

function getThoughtReport(logs: DailyLog[]): ReportItem | null {
  const thoughts = logs.filter((log) => log.log_type === "Recurring thought");
  if (!thoughts.length) return null;
  const rated = thoughts.filter((log) => log.intensity_score !== null);
  const highest = rated.length ? Math.max(...rated.map((log) => log.intensity_score ?? 0)) : null;
  return {
    label: "Recurring thoughts",
    status: "neutral",
    emoji: "📝",
    message: thoughts.length + " recorded" +
      (highest !== null ? "; highest entered intensity: " + highest + "/10." : "; no intensity entered."),
  };
}

export function getWaterMessage(totalWaterMl: number) {
  return totalWaterMl > 0
    ? "Total recorded drink volume, not a hydration target."
    : "No drink volume entered yet.";
}

export function getDailyReport(logs: DailyLog[]): ReportItem[] {
  return [
    getMealReport(logs),
    getWakeReport(logs),
    getDrinkReport(logs),
    getRecordedReport(logs, "Time outside", ["Sunlight", "Yard Work"], "Add minutes in the notes if useful."),
    getRecordedReport(logs, "Movement", ["Movement", "Exercise", "Treadmill walk", "Strength training", "Yard Work"], "Record duration or distance when possible."),
    getRecordedReport(logs, "Tasks completed", ["App work", "Wash Dishes", "Clean", "Cook", "Updated Resume", "Plant care"], "Note the actual result."),
    getRecordedReport(logs, "Job applications", ["Job application", "Applied to Job"], "Include the employer and role."),
    getRecordedReport(logs, "Reading", ["Reading"], "Add the title or pages read."),
    getThoughtReport(logs),
  ].filter((item): item is ReportItem => item !== null);
}

export type { DailyLog, ReportItem };
