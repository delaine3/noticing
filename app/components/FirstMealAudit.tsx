import { InsightLog } from "../lib/log-types";
import { formatMinutes, getTimeMinutes } from "../utils/formatters";

type FirstMealAuditProps = {
  logs: InsightLog[];
};
export function getDate(log: InsightLog) {
  return log.action_date || log.occurred_at.slice(0, 10);
}
export function getFirstMealStats(logs: InsightLog[]) {
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
export function FirstMealAudit({ logs }: FirstMealAuditProps) {
  const firstMealStats = getFirstMealStats(logs);

  return (
    <article className="glass-card rounded p-5 shadow-sm">
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
  );
}
