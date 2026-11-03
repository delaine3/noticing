import type { InsightLog } from "./log-types";
import { getLogDate } from "./insight-categories";

type Metric = { label: string; value: string; detail: string };
type Finding = { title: string; detail: string; next: string; href: string };
export type AreaAnalysis = {
  metrics: Metric[];
  findings: Finding[];
  sample: number;
};

function count(logs: InsightLog[], ...types: string[]) {
  return logs.filter((log) => types.includes(log.log_type)).length;
}

function number(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function average(values: number[]) {
  return values.length ? number(values.reduce((a, b) => a + b, 0) / values.length) : "—";
}

function recordedScore(logs: InsightLog[], key: "mood_score" | "energy_score" | "intensity_score") {
  return logs.map((log) => log[key]).filter((value): value is number => value !== null && Number.isFinite(value));
}

function noteMetric(log: InsightLog, metric: "Hours slept" | "Duration minutes") {
  const line = log.notes?.split("\n").find((item) => item.startsWith(metric + ": "));
  if (!line) return null;
  const value = Number(line.slice(metric.length + 2));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function finding(title: string, detail: string, next: string, href: string): Finding {
  return { title, detail, next, href };
}

export function analyzeArea(id: string, logs: InsightLog[]): AreaAnalysis {
  const sample = logs.length;
  const findings: Finding[] = [];
  const metrics: Metric[] = [];

  if (id === "body") {
    const drinkEntries = logs.filter((log) => log.water_amount_ml !== null);
    const drinkMl = drinkEntries.reduce((sum, log) => sum + (log.water_amount_ml ?? 0), 0);
    const treadmill = logs.filter((log) => log.log_type === "Treadmill walk" && log.treadmill_distance_km !== null);
    const distance = treadmill.reduce((sum, log) => sum + (log.treadmill_distance_km ?? 0), 0);
    const meals = logs.filter((log) => ["First meal", "Meal"].includes(log.log_type) && log.action_time);
    const wakeTimes = logs.filter((log) => log.log_type === "Woke up" && log.action_time);
    const sleep = logs.filter((log) => log.log_type === "Sleep");
    const sleepHours = sleep.map((log) => noteMetric(log, "Hours slept"))
      .filter((value): value is number => value !== null);
    metrics.push(
      { label: "Drink volume entered", value: number(drinkMl) + " ml", detail: "From " + drinkEntries.length + " entries, not a fluid target" },
      { label: "Treadmill distance", value: number(distance) + " km", detail: treadmill.length + " recorded sessions" },
      { label: "Meals with time", value: String(meals.length), detail: "Useful for checking meal timing" },
      { label: "Average recorded sleep", value: sleepHours.length ? average(sleepHours) + " h" : "—", detail: sleepHours.length + " measured entries; " + sleep.length + " sleep logs" },
    );
    const wakeByDay = new Map<string, number>();
    wakeTimes.forEach((log) => {
      const pieces = log.action_time?.slice(0, 5).split(":").map(Number);
      if (pieces?.length !== 2 || pieces.some((part) => !Number.isFinite(part))) return;
      const minutes = pieces[0] * 60 + pieces[1];
      const date = getLogDate(log);
      wakeByDay.set(date, Math.min(minutes, wakeByDay.get(date) ?? minutes));
    });
    const firstMealByDay = new Map<string, number>();
    logs.filter((log) => log.log_type === "First meal" && log.action_time)
      .forEach((log) => {
        const pieces = log.action_time?.slice(0, 5).split(":").map(Number);
        if (pieces?.length !== 2 || pieces.some((part) => !Number.isFinite(part))) return;
        const minutes = pieces[0] * 60 + pieces[1];
        const date = getLogDate(log);
        firstMealByDay.set(date, Math.min(minutes, firstMealByDay.get(date) ?? minutes));
      });
    const wakeToMeal = [...firstMealByDay.entries()]
      .map(([date, meal]) => wakeByDay.has(date) ? meal - (wakeByDay.get(date) ?? 0) : null)
      .filter((minutes): minutes is number => minutes !== null && minutes >= 0 && minutes <= 1440);
    if (wakeToMeal.length >= 3) {
      const elapsed = wakeToMeal.reduce((sum, value) => sum + value, 0) / wakeToMeal.length;
      findings.push(finding(
        "Time from waking to first meal",
        "On " + wakeToMeal.length + " days with both times recorded, the average interval was " +
          number(elapsed / 60) + " hours. Compare this with hunger and energy, not an arbitrary clock-time cutoff.",
        "Record tomorrow's first meal", "/logs/new?type=First%20meal",
      ));
    } else if (meals.length && wakeTimes.length) {
      findings.push(finding("Compare wake and meal times", "You have " + wakeTimes.length + " wake-time entries and " + meals.length + " timed meals. Compare days with both before judging meal timing.", "Record the time of your next meal", "/logs/new?type=First%20meal"));
    } else {
      findings.push(finding("Make meal timing interpretable", "A clock time alone cannot tell you whether a meal was late relative to waking.", "Record wake time and your first meal on the same day", "/logs/new?type=Woke%20up"));
    }
    if (sleep.length < 3) {
      findings.push(finding("Start a sleep baseline", "Record hours slept and how rested you feel for at least three mornings. This gives you observations worth comparing.", "Record last night's sleep", "/logs/new?type=Sleep"));
    } else {
      findings.push(finding("Review your sleep notes", sleep.length + " sleep entries are available. Compare hours slept with the next morning's energy.", "Record sleep quality and hours", "/logs/new?type=Sleep"));
    }
  } else if (id === "mind") {
    const moods = recordedScore(logs, "mood_score");
    const energies = recordedScore(logs, "energy_score");
    const intensities = recordedScore(logs, "intensity_score");
    metrics.push(
      { label: "Average mood", value: average(moods) + (moods.length ? "/10" : ""), detail: moods.length + " ratings" },
      { label: "Average energy", value: average(energies) + (energies.length ? "/10" : ""), detail: energies.length + " ratings" },
      { label: "Average intensity", value: average(intensities) + (intensities.length ? "/10" : ""), detail: intensities.length + " ratings across stress, thoughts and other events" },
      { label: "Check-ins", value: String(count(logs, "Daily check-in")), detail: "Compare at similar times of day" },
    );
    const checks = count(logs, "Daily check-in");
    findings.push(checks < 3
      ? finding("Establish a repeatable check-in", "Mood ratings attached to different events are not equivalent to consistent daily measurements. Use one check-in at roughly the same time on several days.", "Rate mood, energy and stress", "/logs/new?type=Daily%20check-in")
      : finding("Inspect repeat check-ins", checks + " daily check-ins are recorded. Compare the dates and the circumstances in your notes; a change in ratings does not establish a cause.", "Add today's check-in", "/logs/new?type=Daily%20check-in"));
    const scrollMinutes = logs.filter((log) => log.log_type === "TikTok used")
      .map((log) => noteMetric(log, "Duration minutes"))
      .filter((value): value is number => value !== null);
    const scroll = count(logs, "TikTok used");
    if (scrollMinutes.length) findings.push(finding(
      "Your recorded scrolling time",
      number(scrollMinutes.reduce((sum, value) => sum + value, 0)) +
        " minutes across " + scrollMinutes.length +
        " measured sessions. This is logged time, not your total device use.",
      "Record duration and how you felt afterward", "/logs/new?type=TikTok%20used",
    ));
    if (scroll) findings.push(finding("Measure scrolling rather than judging it", scroll + " sessions recorded. Add duration and how you felt before and after. This can reveal whether a specific pattern is worth changing.", "Record your next session", "/logs/new?type=TikTok%20used"));
  } else if (id === "work") {
    const applications = count(logs, "Job application", "Applied to Job");
    const followups = count(logs, "Job follow-up");
    const interviews = count(logs, "Interview");
    const work = count(logs, "App work", "Focused work");
    const timedWork = logs.filter((log) => log.log_type === "Focused work")
      .map((log) => noteMetric(log, "Duration minutes"))
      .filter((value): value is number => value !== null);
    metrics.push(
      { label: "Applications sent", value: String(applications), detail: "Entries, not confirmed employer responses" },
      { label: "Follow-ups logged", value: String(followups), detail: "Record who you contacted and when" },
      { label: "Interviews", value: String(interviews), detail: "Recorded interview events" },
      { label: "Recorded focus time", value: timedWork.length ? number(timedWork.reduce((sum, value) => sum + value, 0)) + " min" : "—", detail: timedWork.length + " measured sessions; " + work + " work logs" },
    );
    findings.push(finding("Track outcomes after applications", applications
      ? "You recorded " + applications + " applications and " + interviews + " interviews. These counts are not a conversion rate unless all outcomes are tracked and the observation period is defined."
      : "No applications are recorded in this history. That does not mean none were sent.",
      "Record a reply, follow-up or interview", "/logs/new?type=Job%20follow-up"));
    findings.push(finding("Define a finished result", "A session is useful when you can name what changed: a bug fixed, a proposal sent or a page shipped.", "Log a concrete work result", "/logs/new?type=Focused%20work"));
  } else if (id === "life") {
    const household = count(logs, "Cook", "Wash Dishes", "Clean", "Home improvement");
    const garden = count(logs, "Plant care", "Yard Work");
    const people = count(logs, "Social interaction", "Family system");
    const creative = count(logs, "Creative time");
    metrics.push(
      { label: "Home tasks", value: String(household), detail: "Cooking and cleaning entries" },
      { label: "Garden activities", value: String(garden), detail: "Plant and yard work" },
      { label: "Social interactions", value: String(people), detail: "Recorded contacts" },
      { label: "Creative sessions", value: String(creative), detail: "Painting, writing, music and other activities" },
    );
    findings.push(finding("Notice what makes home easier", "Record a practical change, time saved or recurring chore. Task counts alone do not measure quality of life.", "Record a home task", "/logs/new?type=Clean"));
    findings.push(finding("Track rewarding time too", "The app should include creativity and relationships, not only maintenance and output. Record what you did and whether you want to repeat it.", "Record creative time", "/logs/new?type=Creative%20time"));
  }

  return { sample, metrics, findings };
}

export function getWeeklyReview(logs: InsightLog[]) {
  const dates = new Set(logs.map(getLogDate));
  const sorted = [...dates].sort().reverse();
  const latest = sorted[0] ?? null;
  const lastSeven = latest ? [...Array(7)].map((_, i) => {
    const [y, m, d] = latest.split("-").map(Number);
    const day = new Date(Date.UTC(y, m - 1, d - i));
    return day.toISOString().slice(0, 10);
  }) : [];
  const days = new Set(lastSeven);
  const recent = logs.filter((log) => days.has(getLogDate(log)));
  const activeDays = new Set(recent.map(getLogDate)).size;
  const mostCommon = new Map<string, number>();
  recent.forEach((log) => mostCommon.set(log.log_type, (mostCommon.get(log.log_type) ?? 0) + 1));
  const top = [...mostCommon.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return { latest, activeDays, recent, top };
}
