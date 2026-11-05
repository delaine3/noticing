import { DailyLog } from "./log-types";
import { ReportItem } from "./report-item";
import { recommendNextAction, type CheckInValues } from "./coaching";

export type TimeBucket = {
  label: string;
  logs: DailyLog[];
};

type NextAction = {
  title: string;
  body: string;
  href: string;
  label: string;
  benefit: string;
};

export const quickActions = [
  { label: "Daily check-in", href: "/logs/new?type=Daily%20check-in" },
  { label: "Record sleep", href: "/logs/new?type=Sleep" },
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

export function getNextActionCopy(
  logs: DailyLog[],
  coaching?: { checkinCount: number; latestCheckIn: CheckInValues | null; fluidRestricted: boolean | null },
): NextAction {
  if (coaching?.latestCheckIn) {
    const recommended = recommendNextAction(coaching.latestCheckIn, { fluidRestricted: coaching.fluidRestricted });
    return {
      title: recommended.title,
      body: recommended.next,
      href: "/journal",
      label: "Write a note",
      benefit: recommended.benefit,
    };
  }
  if (logs.length > 0 && !coaching?.checkinCount && !hasLog(logs, ["Daily check-in"])) {
    return {
      title: "A check-in could help",
      body: "How are you feeling today? A quick check-in can help you look back later.",
      href: "/logs/new?type=Daily%20check-in",
      label: "Record a check-in",
      benefit: "Checking in regularly can help you notice changes over time.",
    };
  }

  if (!hasLog(logs, ["Water", "Coffee"])) {
    return {
      title: "Time for a drink?",
      body: "Have some water if you need it, or tell Noticing about a drink you had.",
      href: "/logs/new?type=Water",
      label: "Record a drink",
      benefit: "Fluid intake supports circulation and temperature regulation. Recording amounts helps you see what you actually drank.",
    };
  }

  if (!hasLog(logs, ["First meal", "Meal"])) {
    return {
      title: "How about your next meal?",
      body: "Food fuels your day. Record a meal or plan something nourishing.",
      href: "/logs/new?type=First%20meal",
      label: "Record a meal",
      benefit: "Your meal notes may help you spot changes in appetite or energy.",
    };
  }

  if (!hasLog(logs, ["Movement", "Exercise", "Treadmill walk", "Strength training", "Yard Work"])) {
    return {
      title: "Take a movement break",
      body: "A short walk or stretch can make a long sitting session easier.",
      href: "/logs/new?type=Movement",
      label: "Record movement",
      benefit: "A brief walk or stretch can reduce stiffness after sitting and gives you a practical break.",
    };
  }

  return {
    title: "Record one result that matters",
    body: "Write what you completed, how long it took, and what the next step is. You can also stop logging for now.",
    href: "/logs/new?type=App%20work",
    label: "Record a task",
    benefit: "An explicit result and next step make follow-ups easier and reduce the effort of remembering unfinished work.",
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
    message: "Log your next meal when you get a chance.",
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
      : "Record a drink to track your fluid goal.",
  };
}

function getRecordedReport(logs: DailyLog[], label: string, types: string[], detail: string): ReportItem {
  const count = logs.filter((log) => types.includes(log.log_type)).length;
  return {
    label,
    status: count ? "check" : "neutral",
    emoji: count ? "📝" : "○",
    message: count ? count + " " + (count === 1 ? "entry" : "entries") + " recorded. " + detail :
      "Nothing recorded yet.",
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
    ? "See your progress toward the goal above."
    : "Have a glass of water if you need one.";
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
