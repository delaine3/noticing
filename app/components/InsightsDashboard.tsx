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
import { FirstMealAudit, getFirstMealStats } from "./FirstMealAudit";
import { Treadmill } from "./Treadmill";
import { colors } from "../utils/styles";
import { EffectPieChart } from "./effectPieChart";
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

function getTotalWaterMl(logs: InsightLog[]) {
  return logs.reduce((total, log) => total + (log.water_amount_ml ?? 0), 0);
}

function getUsefulTruth(logs: InsightLog[]) {
  if (!logs.length) {
    return "No entries yet. Record an activity with a time or quantity to start.";
  }

  const firstMealStats = getFirstMealStats(logs);
  const firstMealsWithTimes = firstMealStats.goldCount + firstMealStats.checkCount +
    firstMealStats.lateCount + firstMealStats.codeRedCount;
  const rated = logs.filter((log) => log.effect !== null).length;
  const withNotes = logs.filter((log) => Boolean(log.notes?.trim())).length;

  if (firstMealsWithTimes >= 3) {
    const average = firstMealStats.average;
    return "You recorded first-meal times on " + firstMealsWithTimes +
      " days. The average was " +
      (average === null ? "unavailable" :
        String(Math.floor(average / 60)).padStart(2, "0") + ":" +
        String(average % 60).padStart(2, "0")) +
      ". Compare this with wake times and energy scores before drawing conclusions.";
  }

  return "You have " + logs.length + " entries, " + rated +
    " self-rated effects, and " + withNotes +
    " notes. To investigate a pattern, log the same activity and a measurable result several times.";
}

export function InsightsDashboard({ logs }: InsightsDashboardProps) {
  const actionCounts = getActionCounts(logs);
  const usefulTruth = getUsefulTruth(logs);
  const helpfulLogs = logs.filter((log) => log.effect === "helpful").length;
  const harmfulLogs = logs.filter((log) => log.effect === "harmful").length;
  const loggedDays = new Set(logs.map(getDate)).size;
  const totalWaterMl = getTotalWaterMl(logs);

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div>
          <p className="text-md font-medium uppercase tracking-[0.25em] text-[var(--leaf-dark)]">
            Insights
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Your recorded patterns
          </h1>

          <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
            Review recorded quantities, ratings, and timing. Look for repeated observations before changing a routine.
          </p>
        </div>
        <section className="glass-card mt-6  p-5 shadow-sm">
          <p className="text-md font-semibold uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
            What is measurable
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            What your entries show
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-[var(--ink-soft)]">
            {usefulTruth}
          </p>
        </section>
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="glass-card  p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Total logs
            </p>
            <p className="mt-2 text-3xl font-semibold">{logs.length}</p>
          </article>

          <article className="glass-card  p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Days logged
            </p>
            <p className="mt-2 text-3xl font-semibold">{loggedDays}</p>
          </article>

          <article className="glass-card  p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Rated helpful
            </p>
            <p className="mt-2 text-3xl font-semibold">{helpfulLogs}</p>
          </article>

          <article className="glass-card  p-5 shadow-sm">
            <p className="text-md font-medium text-[var(--ink-soft)]">
              Rated harmful
            </p>
            <p className="mt-2 text-3xl font-semibold">{harmfulLogs}</p>
          </article>
        </section>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="glass-card  p-5 shadow-sm">
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
        <article className="glass-card  p-5 shadow-sm">
          <p className="text-md font-medium text-[var(--ink-soft)]">
            Drink volume recorded
          </p>
          <p className="mt-2 text-3xl font-semibold">{totalWaterMl} ml</p>
        </article>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">Includes any logged drink with a quantity, including coffee. Not a daily hydration assessment.</p>
        <ScoreTrendChart logs={logs} /> <Treadmill logs={logs} />
        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <InsightNotes />
          <FirstMealAudit logs={logs} />
        </section>
      </section>
    </main>
  );
}
export type { InsightLog };
