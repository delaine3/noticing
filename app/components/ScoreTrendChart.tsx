"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InsightLog } from "../lib/log-types";
import { colors } from "../utils/styles";
import { Bold } from "lucide-react";

type ScoreTrendChartProps = {
  logs: InsightLog[];
};

type ScoreTrendPoint = {
  date: string;
  mood: number | null;
  energy: number | null;
  intensity: number | null;
};

function getDate(log: InsightLog) {
  return log.action_date || log.occurred_at.slice(0, 10);
}

function getScoreTrend(logs: InsightLog[]): ScoreTrendPoint[] {
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

export function ScoreTrendChart({ logs }: ScoreTrendChartProps) {
  const scoreTrend = getScoreTrend(logs);
  const hasScoreData = scoreTrend.some(
    (point) =>
      point.mood !== null || point.energy !== null || point.intensity !== null,
  );

  return (
    <section className="mt-5 glass-card rounded p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
          Scores
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Mood, energy, and intensity over time
        </h2>

        <p className="mt-2 text-md text-[var(--ink-soft)]">
          This shows whether your actions are improving your state.
        </p>
      </div>

      <div className="h-80">
        {hasScoreData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreTrend}>
              <CartesianGrid stroke="rgba(31,52,45,0.12)" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: colors.softInk }}
              />

              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: colors.softInk }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="mood"
                name="Mood"
                stroke={colors.warning}
                strokeWidth={3}
                dot={{ r: 3 }}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="energy"
                name="Energy"
                stroke={colors.leaf}
                strokeWidth={3}
                dot={{ r: 3 }}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="intensity"
                name="Intensity"
                stroke={colors.danger}
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

      <div className="mt-4 flex flex-wrap gap-3 font-bold p-2 text-lg text-shadow-md text-shadow-gray-50 text-[var(--ink-soft)]">
        <span style={{ color: colors.danger }}>● Intensity</span>
        <span style={{ color: colors.warning }}>● Mood</span>
        <span style={{ color: colors.leaf }}>● Energy</span>
      </div>
    </section>
  );
}
