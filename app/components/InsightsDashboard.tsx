"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InsightLog } from "../lib/log-types";

type InsightsDashboardProps = {
  logs: InsightLog[];
};

const chartColors = {
  coral: "#ffa9b7",
  blush: "#ffd7df",
  cream: "#fffaf3",
  mint: "#c9f5dd",
  aqua: "#99efe5",
  leaf: "#3f7f63",
  ink: "#1f342d",
  softInk: "#4f6f63",
  warning: "#f4a261",
  danger: "#e76f51",
};
function getPaceStats(logs: InsightLog[]) {
  const treadmillLogs = logs.filter(
    (log) =>
      log.log_type === "Treadmill walk" &&
      log.treadmill_duration_minutes &&
      log.treadmill_distance_km &&
      log.treadmill_distance_km > 0,
  );

  const totalMinutes = treadmillLogs.reduce(
    (sum, log) => sum + (log.treadmill_duration_minutes ?? 0),
    0,
  );

  const totalKm = treadmillLogs.reduce(
    (sum, log) => sum + (log.treadmill_distance_km ?? 0),
    0,
  );

  return {
    totalMinutes,
    totalKm,
    averagePace: totalKm > 0 ? totalMinutes / totalKm : null,
  };
}

function formatPace(pace: number | null) {
  if (pace === null) return "No data";

  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);

  return `${minutes}:${String(seconds).padStart(2, "0")} min/km`;
}

function isSameDay(date: string, target: Date) {
  return date === target.toISOString().slice(0, 10);
}

function isSameWeek(date: string, target: Date) {
  const value = new Date(`${date}T00:00:00`);
  const diffMs = target.getTime() - value.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays < 7;
}

function isSameMonth(date: string, target: Date) {
  const value = new Date(`${date}T00:00:00`);

  return (
    value.getFullYear() === target.getFullYear() &&
    value.getMonth() === target.getMonth()
  );
}
function getDate(log: InsightLog) {
  return log.action_date || log.occurred_at.slice(0, 10);
}

function getTimeMinutes(time: string | null) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutes(minutes: number | null) {
  if (minutes === null) return "No time";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getActionCounts(logs: InsightLog[]) {
  const counts = new Map<string, number>();

  logs.forEach((log) => {
    counts.set(log.log_type, (counts.get(log.log_type) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getEffectCounts(logs: InsightLog[]) {
  const effects = ["helpful", "neutral", "harmful"];

  return effects.map((effect) => ({
    name: effect,
    value: logs.filter((log) => log.effect === effect).length,
  }));
}

function getScoreTrend(logs: InsightLog[]) {
  const byDate = new Map<
    string,
    {
      date: string;
      moodTotal: number;
      moodCount: number;
      energyTotal: number;
      energyCount: number;
      intensityTotal: number;
      intensityCount: number;
    }
  >();

  logs.forEach((log) => {
    const date = getDate(log);

    if (!byDate.has(date)) {
      byDate.set(date, {
        date,
        moodTotal: 0,
        moodCount: 0,
        energyTotal: 0,
        energyCount: 0,
        intensityTotal: 0,
        intensityCount: 0,
      });
    }

    const entry = byDate.get(date);

    if (!entry) return;

    if (log.mood_score !== null) {
      entry.moodTotal += log.mood_score;
      entry.moodCount += 1;
    }

    if (log.energy_score !== null) {
      entry.energyTotal += log.energy_score;
      entry.energyCount += 1;
    }

    if (log.intensity_score !== null) {
      entry.intensityTotal += log.intensity_score;
      entry.intensityCount += 1;
    }
  });

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date.slice(5),
      mood: entry.moodCount
        ? Number((entry.moodTotal / entry.moodCount).toFixed(1))
        : null,
      energy: entry.energyCount
        ? Number((entry.energyTotal / entry.energyCount).toFixed(1))
        : null,
      intensity: entry.intensityCount
        ? Number((entry.intensityTotal / entry.intensityCount).toFixed(1))
        : null,
    }));
}

function getFirstMealStats(logs: InsightLog[]) {
  const byDate = new Map<string, InsightLog[]>();

  logs.forEach((log) => {
    const date = getDate(log);
    const current = byDate.get(date) ?? [];
    current.push(log);
    byDate.set(date, current);
  });

  const firstMeals = [...byDate.entries()]
    .map(([date, dayLogs]) => {
      const firstMeal = dayLogs
        .filter((log) => log.log_type === "First meal")
        .sort((a, b) => {
          const aMinutes =
            getTimeMinutes(a.action_time) ?? Number.POSITIVE_INFINITY;
          const bMinutes =
            getTimeMinutes(b.action_time) ?? Number.POSITIVE_INFINITY;

          return aMinutes - bMinutes;
        })[0];

      return {
        date,
        minutes: getTimeMinutes(firstMeal?.action_time ?? null),
      };
    })
    .filter((entry) => entry.minutes !== null);

  if (!firstMeals.length) {
    return {
      average: null,
      goldCount: 0,
      checkCount: 0,
      lateCount: 0,
      codeRedCount: 0,
    };
  }

  const total = firstMeals.reduce(
    (sum, entry) => sum + (entry.minutes ?? 0),
    0,
  );
  const average = Math.round(total / firstMeals.length);

  return {
    average,
    goldCount: firstMeals.filter((entry) => (entry.minutes ?? 0) < 10 * 60)
      .length,
    checkCount: firstMeals.filter(
      (entry) =>
        (entry.minutes ?? 0) >= 10 * 60 && (entry.minutes ?? 0) < 14 * 60,
    ).length,
    lateCount: firstMeals.filter(
      (entry) =>
        (entry.minutes ?? 0) >= 14 * 60 && (entry.minutes ?? 0) < 18 * 60,
    ).length,
    codeRedCount: firstMeals.filter((entry) => (entry.minutes ?? 0) >= 18 * 60)
      .length,
  };
}
function getTotalWaterMl(logs: InsightLog[]) {
  return logs.reduce((total, log) => total + (log.water_amount_ml ?? 0), 0);
}

function getUsefulTruth(logs: InsightLog[]) {
  const helpfulCount = logs.filter((log) => log.effect === "helpful").length;
  const harmfulCount = logs.filter((log) => log.effect === "harmful").length;
  const firstMealStats = getFirstMealStats(logs);
  const waterCount = logs.filter((log) => log.log_type === "Water").length;
  const movementCount = logs.filter((log) =>
    ["Movement", "Exercise", "Treadmill walk", "Strength training"].includes(
      log.log_type,
    ),
  ).length;

  if (!logs.length) {
    return "No logs yet. The app cannot boss you around without evidence. Feed it data.";
  }

  if (firstMealStats.codeRedCount > 0) {
    return "First meal is going feral on some days. Eat earlier. This is a major suffering multiplier.";
  }

  if (harmfulCount > helpfulCount) {
    return "Harmful actions are outnumbering helpful ones. Shrink the day back to basics: water, food, sunlight, movement.";
  }

  if (waterCount === 0) {
    return "No water logs. Start there. Hydration before existential analysis.";
  }

  if (movementCount === 0) {
    return "No movement logs. Do it : Five minutes counts.";
  }

  return "The useful pattern is forming: collect evidence, support the body, then decide what the day needs.";
}

export function InsightsDashboard({ logs }: InsightsDashboardProps) {
  const actionCounts = getActionCounts(logs);
  const effectCounts = getEffectCounts(logs);
  const scoreTrend = getScoreTrend(logs);
  const firstMealStats = getFirstMealStats(logs);
  const usefulTruth = getUsefulTruth(logs);
  const helpfulLogs = logs.filter((log) => log.effect === "helpful").length;
  const harmfulLogs = logs.filter((log) => log.effect === "harmful").length;
  const loggedDays = new Set(logs.map(getDate)).size;
  const totalWaterMl = getTotalWaterMl(logs);

  const today = new Date();

  const todayPace = getPaceStats(
    logs.filter((log) => isSameDay(getDate(log), today)),
  );

  const weekPace = getPaceStats(
    logs.filter((log) => isSameWeek(getDate(log), today)),
  );

  const monthPace = getPaceStats(
    logs.filter((log) => isSameMonth(getDate(log), today)),
  );
  return (
    <main className="app-bg min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div>
          <p className="text-md font-medium uppercase tracking-[0.25em] text-[var(--leaf-dark)]">
            Insights
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Pattern evidence
          </h1>

          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            This page turns your logs into patterns, charts, and useful bossy
            feedback.
          </p>
        </div>

        <section className="glass-card mt-6 rounded-xl p-5 shadow-sm">
          <p className="text-md font-semibold uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
            Current read
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            What the evidence says
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-[var(--ink-soft)]">
            {usefulTruth}
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="glass-card rounded-xl p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Total logs
            </p>
            <p className="mt-2 text-3xl font-semibold">{logs.length}</p>
          </article>

          <article className="glass-card rounded-xl p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Days logged
            </p>
            <p className="mt-2 text-3xl font-semibold">{loggedDays}</p>
          </article>

          <article className="glass-card rounded-xl p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Helpful actions
            </p>
            <p className="mt-2 text-3xl font-semibold">{helpfulLogs}</p>
          </article>

          <article className="glass-card rounded-xl p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Harmful actions
            </p>
            <p className="mt-2 text-3xl font-semibold">{harmfulLogs}</p>
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="glass-card rounded-xl p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
                Actions
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Most logged actions
              </h2>
            </div>

            <div className="h-72">
              {actionCounts.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actionCounts}>
                    <CartesianGrid
                      stroke="rgba(31,52,45,0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: chartColors.softInk }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: chartColors.softInk }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      fill={chartColors.leaf}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-md text-[var(--ink-soft)]">
                  No action data yet.
                </p>
              )}
            </div>
          </article>

          <article className="glass-card rounded-xl p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
                Effect
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Helpful vs neutral vs harmful
              </h2>
            </div>

            <div className="h-72">
              {logs.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={effectCounts}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                      label
                    >
                      {effectCounts.map((entry) => {
                        const color =
                          entry.name === "helpful"
                            ? chartColors.mint
                            : entry.name === "harmful"
                              ? chartColors.coral
                              : chartColors.aqua;

                        return <Cell key={entry.name} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-md text-[var(--ink-soft)]">
                  No effect data yet.
                </p>
              )}
            </div>
          </article>
        </section>
        <article className="glass-card rounded-xl p-5 shadow-sm">
          <p className="text-md font-medium text-[var(--ink-soft)]">
            Water logged
          </p>
          <p className="mt-2 text-3xl font-semibold">{totalWaterMl}ml</p>
        </article>
        <section className="mt-5 glass-card rounded-xl p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
              Scores
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Mood, energy, and intensity over time
            </h2>
          </div>

          <div className="h-80">
            {scoreTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrend}>
                  <CartesianGrid
                    stroke="rgba(31,52,45,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: chartColors.softInk }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 12, fill: chartColors.softInk }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke={chartColors.coral}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke={chartColors.leaf}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="intensity"
                    stroke={chartColors.aqua}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-md text-[var(--ink-soft)]">
                Add mood, energy, or intensity scores to see trends.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-md text-[var(--ink-soft)]">
            <span>● Mood</span>
            <span>● Energy</span>
            <span>● Intensity</span>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="glass-card rounded-xl p-5 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
              First meal
            </p>

            <h2 className="mt-2 text-xl font-semibold">Meal timing audit</h2>

            <div className="mt-5 space-y-3 text-md text-[var(--ink-soft)]">
              <p>
                Average first meal:{" "}
                <span className="font-semibold text-[var(--ink)]">
                  {firstMealStats.average === null
                    ? "No data"
                    : formatMinutes(firstMealStats.average)}
                </span>
              </p>

              <p>⭐ Before 10am: {firstMealStats.goldCount}</p>
              <p>✅ Before 2pm: {firstMealStats.checkCount}</p>
              <p>👎 Before 6pm: {firstMealStats.lateCount}</p>
              <p>🚨 After 6pm: {firstMealStats.codeRedCount}</p>
            </div>
          </article>
          <section className="mt-5 grid gap-4 sm:grid-cols-3">
            <article className="glass-card rounded p-5 shadow-sm">
              <p className="text-sm font-medium text-[var(--ink-soft)]">
                Today pace
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatPace(todayPace.averagePace)}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {todayPace.totalKm.toFixed(2)} km logged
              </p>
            </article>

            <article className="glass-card rounded p-5 shadow-sm">
              <p className="text-sm font-medium text-[var(--ink-soft)]">
                Week pace
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatPace(weekPace.averagePace)}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {weekPace.totalKm.toFixed(2)} km logged
              </p>
            </article>

            <article className="glass-card rounded p-5 shadow-sm">
              <p className="text-sm font-medium text-[var(--ink-soft)]">
                Month pace
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatPace(monthPace.averagePace)}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {monthPace.totalKm.toFixed(2)} km logged
              </p>
            </article>
          </section>
          <article className="glass-card rounded-xl p-5 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
              Notes
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              How to read this page
            </h2>

            <div className="mt-4 space-y-3 leading-7 text-[var(--ink-soft)]">
              <p>
                The goal is not perfect tracking. The goal is to spot which
                actions reliably reduce suffering and which ones make the day
                messy.
              </p>

              <p>
                Useful actions should become easier to repeat. Harmful actions
                should become easier to interrupt. Neutral actions are context.
              </p>

              <p>
                Once you have more data, this page can get stricter: best food
                windows, TikTok cost, sunlight impact, movement effect, and
                recurring thought triggers.
              </p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
export type { InsightLog };
