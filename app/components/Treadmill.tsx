import { InsightLog } from "../lib/log-types";
import {
  formatDistance,
  formatPace,
  formatSpeed,
  isSameDay,
  isSameMonth,
  isSameWeek,
} from "../utils/formatters";

type TreadmillStats = {
  totalMinutes: number;
  totalKm: number;
  averageSpeedKmph: number | null;
  averagePaceMinPerKm: number | null;
};

type TreadmillProps = {
  logs: InsightLog[];
};

function getDate(log: InsightLog) {
  return log.action_date || log.occurred_at.slice(0, 10);
}

function getTreadmillStats(logs: InsightLog[]): TreadmillStats {
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

  const averageSpeedKmph =
    totalMinutes > 0 ? totalKm / (totalMinutes / 60) : null;

  const averagePaceMinPerKm = totalKm > 0 ? totalMinutes / totalKm : null;

  return {
    totalMinutes,
    totalKm,
    averageSpeedKmph,
    averagePaceMinPerKm,
  };
}

type TreadmillCardProps = {
  title: string;
  stats: TreadmillStats;
};

function TreadmillCard({ title, stats }: TreadmillCardProps) {
  return (
    <article className="glass-card  p-5 shadow-sm">
      <p className="text-md font-medium text-[var(--ink-soft)]">{title}</p>

      <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
        {formatSpeed(stats.averageSpeedKmph)}
      </p>

      <p className="mt-1 text-md text-[var(--ink-soft)]">
        {formatDistance(stats.totalKm)} · {stats.totalMinutes.toFixed(0)} min
      </p>

      <p className="mt-1 text-md text-[var(--ink-soft)]">
        Pace: {formatPace(stats.averagePaceMinPerKm)}
      </p>
    </article>
  );
}

export function Treadmill({ logs }: TreadmillProps) {
  const today = new Date();

  const todayTreadmill = getTreadmillStats(
    logs.filter((log) => isSameDay(getDate(log), today)),
  );

  const weekTreadmill = getTreadmillStats(
    logs.filter((log) => isSameWeek(getDate(log), today)),
  );

  const monthTreadmill = getTreadmillStats(
    logs.filter((log) => isSameMonth(getDate(log), today)),
  );

  return (
    <section className="mt-5">
      <div className="mb-4">
        <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
          Treadmill
        </p>

        <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">
          Distance and speed audit
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TreadmillCard title="Today treadmill" stats={todayTreadmill} />
        <TreadmillCard title="Week treadmill" stats={weekTreadmill} />
        <TreadmillCard title="Month treadmill" stats={monthTreadmill} />
      </div>
    </section>
  );
}
