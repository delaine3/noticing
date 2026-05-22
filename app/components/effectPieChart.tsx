"use client";

import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { InsightLog } from "../lib/log-types";
import { effectStyles } from "../utils/styles";

type EffectPieChartProps = {
  logs: InsightLog[];
};

type EffectKey = keyof typeof effectStyles;

type EffectCount = {
  name: EffectKey;
  label: string;
  emoji: string;
  value: number;
  color: string;
  className: string;
};

type EffectPieShapeProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  payload?: {
    color?: string;
  };
};

function getEffectCounts(logs: InsightLog[]): EffectCount[] {
  return Object.entries(effectStyles).map(([effect, style]) => ({
    name: effect as EffectKey,
    label: style.label,
    emoji: style.emoji,
    value: logs.filter((log) => log.effect === effect).length,
    color: style.chartColor,
    className: style.className,
  }));
}

function EffectPieShape({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  payload,
}: EffectPieShapeProps) {
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={payload?.color ?? "#cdebdc"}
    />
  );
}

export function EffectPieChart({ logs }: EffectPieChartProps) {
  const effectCounts = getEffectCounts(logs);
  const hasEffectData = effectCounts.some((effect) => effect.value > 0);

  return (
    <article className="glass-card  p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
          Effect
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Restorative vs detrimental
        </h2>

        <p className="mt-2 text-md text-[var(--ink-soft)]">
          See whether your logged actions are helping the day or quietly taxing
          the system.
        </p>
      </div>

      <div className="h-72">
        {hasEffectData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={effectCounts}
                dataKey="value"
                nameKey="label"
                outerRadius={120}
                shape={<EffectPieShape />}
                label={(props) => {
                  const value = Number(props.value ?? 0);
                  const name = String(props.name ?? "");

                  return value > 0 ? `${name}: ${value}` : "";
                }}
              />

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-md text-[var(--ink-soft)]">No effect data yet.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {effectCounts.map((effect) => (
          <span
            key={effect.name}
            className={`px-3 py-1 text-sm font-semibold ${effect.className}`}
          >
            {effect.emoji ? `${effect.emoji} ` : ""}
            {effect.label}: {effect.value}
          </span>
        ))}
      </div>
    </article>
  );
}
