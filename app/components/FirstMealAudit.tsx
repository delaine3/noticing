import { formatMinutes } from "../utils/formatters";

type FirstMealStats = {
  average: number | null;
  goldCount: number;
  checkCount: number;
  lateCount: number;
  codeRedCount: number;
};

type FirstMealAuditProps = {
  firstMealStats: FirstMealStats;
};

export function FirstMealAudit({ firstMealStats }: FirstMealAuditProps) {
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
