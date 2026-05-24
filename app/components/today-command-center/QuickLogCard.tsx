import Link from "next/link";
import { quickActions } from "../../lib/daily-rules";
import LoadingLink from "../LoadingLink";

export function QuickLogCard() {
  return (
    <section className="glass-card">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
        Quick log
      </p>

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
    </section>
  );
}
