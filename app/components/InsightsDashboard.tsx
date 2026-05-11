"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InsightLog } from "../lib/log-types";
import InsightNotes from "./InsightNotes";
import { FirstMealAudit } from "./FirstMealAudit";
import { Treadmill } from "./Treadmill";
import { colors, effectStyles } from "../utils/styles";
import { EffectPieChart } from "./effectPieChart";
import { getTimeMinutes } from "../utils/formatters";
import { ScoreTrendChart } from "./ScoreTrendChart";

type InsightsDashboardProps = {
  logs: InsightLog[];
};

export function getDate(log: InsightLog) {
  return log.action_date || log.occurred_at.slice(0, 10);
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
  const firstMealStats = getFirstMealStats(logs);
  const usefulTruth = getUsefulTruth(logs);
  const helpfulLogs = logs.filter((log) => log.effect === "helpful").length;
  const harmfulLogs = logs.filter((log) => log.effect === "harmful").length;
  const loggedDays = new Set(logs.map(getDate)).size;
  const totalWaterMl = getTotalWaterMl(logs);

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
        <section className="glass-card mt-6 rounded p-5 shadow-sm">
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
          <article className="glass-card rounded p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Total logs
            </p>
            <p className="mt-2 text-3xl font-semibold">{logs.length}</p>
          </article>

          <article className="glass-card rounded p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Days logged
            </p>
            <p className="mt-2 text-3xl font-semibold">{loggedDays}</p>
          </article>

          <article className="glass-card rounded p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Helpful actions
            </p>
            <p className="mt-2 text-3xl font-semibold">{helpfulLogs}</p>
          </article>

          <article className="glass-card rounded p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Harmful actions
            </p>
            <p className="mt-2 text-3xl font-semibold">{harmfulLogs}</p>
          </article>
        </section>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="glass-card rounded p-5 shadow-sm">
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
                      tick={{ fontSize: 11, fill: colors.softInk }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: colors.softInk }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      fill={colors.leaf}
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

          <EffectPieChart logs={logs} />
        </section>
        <article className="glass-card rounded p-5 shadow-sm">
          <p className="text-md font-medium text-[var(--ink-soft)]">
            Water logged
          </p>
          <p className="mt-2 text-3xl font-semibold">{totalWaterMl}ml</p>
        </article>
        <ScoreTrendChart logs={logs} /> <Treadmill logs={logs} />
        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <InsightNotes />
          <FirstMealAudit firstMealStats={firstMealStats} />
        </section>
      </section>
    </main>
  );
}
export type { InsightLog };
