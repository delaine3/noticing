import Link from "next/link";
import { quickActions } from "../../lib/daily-rules";

export function QuickLogCard() {
  return (
    <section className="glass-card rounded border border-black-200 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
        Quick log
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="rounded border border-black-200 bg-black-50 px-4 py-3 text-md font-semibold text-black-800 hover:border-green-400 hover:bg-green-50"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
