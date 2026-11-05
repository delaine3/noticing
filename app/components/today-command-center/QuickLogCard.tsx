import { quickActions } from "../../lib/daily-rules";
import LoadingLink from "../LoadingLink";

export function QuickLogCard() {
  return (
    <details className="glass-card">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--leaf-dark)]">Quick entry</summary>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <LoadingLink
            key={action.label}
            href={action.href}
            className="quick-log-button"
          >
            {action.label}
          </LoadingLink>
        ))}
      </div>
    </details>
  );
}
