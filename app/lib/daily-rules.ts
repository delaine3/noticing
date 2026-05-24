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
  { label: "I woke up", href: "/logs/new?type=Woke%20up" },
  { label: "I ate", href: "/logs/new?type=First%20meal" },
  { label: "I drank water", href: "/logs/new?type=Water" },
  { label: "I got sunlight", href: "/logs/new?type=Sunlight" },
  { label: "I moved", href: "/logs/new?type=Movement" },
  { label: "I applied to a job", href: "/logs/new?type=Job%20application" },
  { label: "I worked on app", href: "/logs/new?type=App%20work" },
  { label: "I’m spiraling", href: "/logs/new?type=Recurring%20thought" },
];

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
  const totalWaterMl = getTotalWaterMl(logs);

  if (totalWaterMl === 0) {
    return {
      title: "Drink water first.",
      body: "Get a glass. Drink it. Then come back.",
      href: "/logs/new?type=Water",
      label: "Log water",
    };
  }

  if (totalWaterMl < 750) {
    return {
      title: "Drink more water.",
      body: `Only ${totalWaterMl}ml logged today. You can do better. Add another glass.`,
      href: "/logs/new?type=Water",
      label: "Log more water",
    };
  }

  if (!hasLog(logs, ["First meal"])) {
    return {
      title: "Eat something real.",
      body: "Protein, leftovers, or whatever food.",
      href: "/logs/new?type=First%20meal",
      label: "Log first meal",
    };
  }

  if (!hasLog(logs, ["Sunlight", "Yard Work"])) {
    return {
      title: "Get light on your face.",
      body: "Ten minutes outside or by a bright window.",
      href: "/logs/new?type=Sunlight",
      label: "Log sunlight",
    };
  }

  if (
    !hasLog(logs, [
      "Movement",
      "Exercise",
      "Treadmill walk",
      "Strength training",
    ])
  ) {
    return {
      title: "Move for five minutes.",
      body: "Walk, stretch, treadmill, house pacing. Tiny counts.",
      href: "/logs/new?type=Movement",
      label: "Log movement",
    };
  }

  if (!hasLog(logs, ["Reading"])) {
    return {
      title: "Read a few pages.",
      body: "Even a small reading rep counts. Attention needs training.",
      href: "/logs/new?type=Reading",
      label: "Log reading",
    };
  }

  return {
    title: "You handled the basics. Pick one useful task.",
    body: "One focused task. App work, reading, or plant care. Keep the day moving.",
    href: "/logs/new?type=App%20work",
    label: "Log useful task",
  };
}

export function getTimeBuckets(logs: DailyLog[]): TimeBucket[] {
  const buckets: TimeBucket[] = [
    { label: "Before 10am", logs: [] },
    { label: "10am to 2pm", logs: [] },
    { label: "2pm to 6pm", logs: [] },
    { label: "6pm to 10pm", logs: [] },
    { label: "After 10pm", logs: [] },
    { label: "All day", logs: [] },
  ];

  logs.forEach((log) => {
    const minutes = timeToMinutes(log.action_time);

    if (minutes === null) {
      buckets[5].logs.push(log);
    } else if (minutes < 10 * 60) {
      buckets[0].logs.push(log);
    } else if (minutes < 14 * 60) {
      buckets[1].logs.push(log);
    } else if (minutes < 18 * 60) {
      buckets[2].logs.push(log);
    } else if (minutes < 22 * 60) {
      buckets[3].logs.push(log);
    } else {
      buckets[4].logs.push(log);
    }
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

function getFirstMealReport(logs: DailyLog[]): ReportItem {
  const firstMeal = getFirstLog(logs, ["First meal"]);
  const minutes = timeToMinutes(firstMeal?.action_time ?? null);

  if (!firstMeal) {
    return {
      label: "First meal",
      status: "demerit",
      emoji: "🚫",
      message: "No first meal logged. The body was left unmanaged.",
    };
  }

  if (minutes !== null && minutes < 10 * 60) {
    return {
      label: "First meal",
      status: "gold",
      emoji: "⭐",
      message: "First meal before 10am. Excellent. Gold star behavior.",
    };
  }

  if (minutes !== null && minutes < 14 * 60) {
    return {
      label: "First meal",
      status: "check",
      emoji: "✅",
      message: "First meal before 2pm. Acceptable. Keep this as the minimum.",
    };
  }

  if (minutes !== null && minutes < 18 * 60) {
    return {
      label: "First meal",
      status: "warning",
      emoji: "👎",
      message:
        "First meal before 6pm. Too late. You made the day harder than it needed to be.",
    };
  }

  return {
    label: "First meal",
    status: "code-red",
    emoji: "🚨",
    message: "First meal after 6pm. Code Red.",
  };
}

function getWakeReport(logs: DailyLog[]): ReportItem {
  const wokeUp = getFirstLog(logs, ["Woke up"]);
  const minutes = timeToMinutes(wokeUp?.action_time ?? null);

  if (!wokeUp) {
    return {
      label: "Wake time",
      status: "neutral",
      emoji: "📝",
      message: "Wake time not logged.",
    };
  }

  if (minutes !== null && minutes < 9 * 60) {
    return {
      label: "Wake time",
      status: "gold",
      emoji: "⭐",
      message: "Wake time logged before 9am. Strong start.",
    };
  }

  if (minutes !== null && minutes < 11 * 60) {
    return {
      label: "Wake time",
      status: "check",
      emoji: "✅",
      message: "Wake time logged before 11am. Fine. Keep the day moving.",
    };
  }

  return {
    label: "Wake time",
    status: "warning",
    emoji: "👎",
    message: "Late wake. No shame spiral, but the day needs structure fast.",
  };
}

function getWaterReport(logs: DailyLog[]): ReportItem {
  const totalWaterMl = getTotalWaterMl(logs);

  if (totalWaterMl >= 2500) {
    return {
      label: "Water",
      status: "gold",
      emoji: "⭐",
      message: `Water logged: ${totalWaterMl}ml. Ya get the hydration award today kid!`,
    };
  }

  if (totalWaterMl >= 1500) {
    return {
      label: "Water",
      status: "check",
      emoji: "✅",
      message: `Water logged: ${totalWaterMl}ml. Keep going.`,
    };
  }

  if (totalWaterMl > 0) {
    return {
      label: "Water",
      status: "warning",
      emoji: "👎",
      message: `Only ${totalWaterMl}ml logged. Drink more.`,
    };
  }

  return {
    label: "Water",
    status: "demerit",
    emoji: "🚫",
    message: "No water logged. This is a failure.",
  };
}

function getSimpleReport(
  logs: DailyLog[],
  label: string,
  types: string[],
  success: ReportItem,
  failure: ReportItem,
): ReportItem {
  return hasLog(logs, types) ? success : failure;
}

function getThoughtLoopReport(logs: DailyLog[]): ReportItem | null {
  const thoughtLoop = getFirstLog(logs, ["Recurring thought"]);

  if (!thoughtLoop) return null;

  if (thoughtLoop.intensity_score && thoughtLoop.intensity_score >= 7) {
    return {
      label: "Thought loop",
      status: "code-red",
      emoji: "🚨",
      message:
        "High-intensity thought loop logged. Do body maintenance before analysis.",
    };
  }

  return {
    label: "Thought loop",
    status: "warning",
    emoji: "👎",
    message:
      "Thought loop logged. Evidence collected. Do not feed it more attention.",
  };
}
export function getWaterMessage(totalWaterMl: number) {
  if (totalWaterMl >= 2500) {
    return "Hydration award secured ⭐";
  }

  if (totalWaterMl >= 2000) {
    return "Good. Keep the standard.";
  }

  if (totalWaterMl >= 1500) {
    return "Close to decent. Add 500ml.";
  }

  if (totalWaterMl >= 750) {
    return "Acceptable. Keep going.";
  }

  if (totalWaterMl > 0) {
    return "Too low. Add another glass.";
  }

  return "No water logged yet.";
}
export function getDailyReport(logs: DailyLog[]): ReportItem[] {
  const thoughtLoopReport = getThoughtLoopReport(logs);

  return [
    getFirstMealReport(logs),
    getWakeReport(logs),
    getWaterReport(logs),

    getSimpleReport(
      logs,
      "Sunlight",
      ["Sunlight", "Yard Work"],
      {
        label: "Sunlight",
        status: "check",
        emoji: "✅",
        message: "Sunlight logged. Good.",
      },
      {
        label: "Sunlight",
        status: "demerit",
        emoji: "🚫",
        message: "No sunlight logged. Do better.",
      },
    ),
    getSimpleReport(
      logs,
      "Job application",
      ["Job application"],
      {
        label: "Job application",
        status: "check",
        emoji: "✅",
        message: "Job application logged. Good.",
      },
      {
        label: "Job application",
        status: "demerit",
        emoji: "🚫",
        message: "No Job application logged. Do better.",
      },
    ),
    getSimpleReport(
      logs,
      "Movement",
      [
        "Movement",
        "Exercise",
        "Treadmill walk",
        "Strength training",
        "Yard Work",
      ],
      {
        label: "Movement",
        status: "check",
        emoji: "✅",
        message: "Movement logged.",
      },
      {
        label: "Movement",
        status: "demerit",
        emoji: "🚫",
        message: "No movement logged. Do it now: five minutes counts.",
      },
    ),

    getSimpleReport(
      logs,
      "Hygiene",
      ["Hygiene"],
      {
        label: "Hygiene",
        status: "check",
        emoji: "✅",
        message: "Wash-up logged. System reset achieved.",
      },
      {
        label: "Hygiene",
        status: "neutral",
        emoji: "📝",
        message: "No wash-up logged. If the day felt sticky, this may be why.",
      },
    ),

    getSimpleReport(
      logs,
      "Useful task",
      ["App work", "Wash Dishes", "Clean"],
      {
        label: "Useful task",
        status: "check",
        emoji: "✅",
        message: "App work logged. GOOD JOB.",
      },
      {
        label: "Useful task",
        status: "neutral",
        emoji: "📝",
        message: "No useful task logged. Not a crime, but track the pattern.",
      },
    ),

    getSimpleReport(
      logs,
      "Reading",
      ["Reading"],
      {
        label: "Read",
        status: "gold",
        emoji: "⭐",
        message: "You read. Good job.",
      },
      {
        label: "Read",
        status: "neutral",
        emoji: "📝",
        message: "No reading logged.",
      },
    ),

    thoughtLoopReport,
  ].filter((item): item is ReportItem => item !== null);
}

export type { DailyLog, ReportItem };
