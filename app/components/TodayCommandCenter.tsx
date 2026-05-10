import Link from "next/link";
import {
  DailyLog,
  ReportItem,
  TimeBucket,
  getEffectEmoji,
} from "../lib/daily-rules";
import { CollapsibleSection } from "./CollapsibleSection";

type TodayCommandCenterProps = {
  logs: DailyLog[];
  report: ReportItem[];
  buckets: TimeBucket[];
};

const quickActions = [
  { label: "I woke up", href: "/logs/new?type=Woke%20up" },
  { label: "I ate", href: "/logs/new?type=First%20meal" },
  { label: "I drank water", href: "/logs/new?type=Water" },
  { label: "I got sunlight", href: "/logs/new?type=Sunlight" },
  { label: "I moved", href: "/logs/new?type=Movement" },
  { label: "I’m spiraling", href: "/logs/new?type=Recurring%20thought" },
];

function getReportCardStyle(status: string) {
  if (status === "gold") return "border-amber-200 bg-amber-50";
  if (status === "check") return "border-green-200 bg-green-50";
  if (status === "warning") return "border-orange-200 bg-orange-50";
  if (status === "code-red") return "border-red-300 bg-red-50";
  if (status === "demerit") return "border-stone-300 bg-stone-100";
  return "border-stone-200 bg-white";
}

function getNextActionCopy(logs: DailyLog[]) {
  const hasFirstMeal = logs.some((log) => log.log_type === "First meal");
  const hasWater = logs.some((log) => log.log_type === "Water");
  const hasSunlight = logs.some((log) => log.log_type === "Sunlight");
  const hasMovement = logs.some((log) =>
    ["Movement", "Exercise", "Treadmill walk", "Strength training"].includes(
      log.log_type,
    ),
  );

  if (!hasWater) {
    return {
      title: "Drink water first.",
      body: "Get a glass. Drink it. Then come back. No committee meeting.",
      href: "/logs/new?type=Water",
      label: "Log water",
    };
  }

  if (!hasFirstMeal) {
    return {
      title: "Eat something real.",
      body: "Protein, leftovers, or assembled food. Feeding the system comes before deep analysis.",
      href: "/logs/new?type=First%20meal",
      label: "Log first meal",
    };
  }

  if (!hasSunlight) {
    return {
      title: "Get light on your face.",
      body: "Ten minutes outside or by a bright window. Mammal protocol.",
      href: "/logs/new?type=Sunlight",
      label: "Log sunlight",
    };
  }

  if (!hasMovement) {
    return {
      title: "Move for five minutes.",
      body: "Walk, stretch, treadmill, house pacing. Tiny counts.",
      href: "/logs/new?type=Movement",
      label: "Log movement",
    };
  }

  return {
    title: "You handled the basics. Pick one useful task.",
    body: "One focused task. App work, reading, or plant care. Keep the day moving.",
    href: "/logs/new?type=App%20work",
    label: "Log useful task",
  };
}

export function TodayCommandCenter({
  logs,
  report,
  buckets,
}: TodayCommandCenterProps) {
  const nextAction = getNextActionCopy(logs);

  return (
    <main className="min-h-screen app-bg px-4 py-8 text-stone-950 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
            Noticing
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Today’s command center
          </h1>

          <p className="mt-4 max-w-2xl text-stone-700">
            Bossy, but useful. Log the basics, check the report card, and do the
            next useful thing.
          </p>
        </div>

        <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-800">
            Next best action
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
            {nextAction.title}
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-stone-700">
            {nextAction.body}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={nextAction.href}
              className="rounded-full bg-green-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-green-800"
            >
              {nextAction.label}
            </Link>

            <Link
              href="/logs/new"
              className="rounded-full border border-green-300 bg-white px-5 py-3 text-center text-sm font-semibold text-stone-800 hover:bg-green-100"
            >
              Log something else
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
            Quick log
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:border-green-400 hover:bg-green-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-5 space-y-5">
          <CollapsibleSection
            eyebrow="Daily report card"
            title="Scoreboard"
            summary={`${report.length} checks. Open when you want the verdict.`}
            defaultOpen
          >
            <div className="grid gap-3 md:grid-cols-2">
              {report.map((item) => (
                <article
                  key={`${item.label}-${item.status}`}
                  className={`rounded-2xl border p-4 ${getReportCardStyle(item.status)}`}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">{item.emoji}</span>

                    <div>
                      <h3 className="font-semibold text-stone-950">
                        {item.label}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-stone-700">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            eyebrow="Timeline"
            title="What happened by checkpoint"
            summary={`${logs.length} actions logged today. Open when you need the receipts.`}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {buckets.map((bucket) => (
                <section
                  key={bucket.label}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <h3 className="font-semibold text-stone-950">
                    {bucket.label}
                  </h3>

                  {bucket.logs.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-500">
                      Nothing logged here.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {bucket.logs.map((log) => (
                        <article
                          key={log.id}
                          className="rounded-2xl border border-stone-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-green-700">
                                {log.log_type} {getEffectEmoji(log.effect)}
                              </p>

                              <h4 className="mt-1 font-semibold text-stone-950">
                                {log.title || "Untitled action"}
                              </h4>
                            </div>

                            <p className="text-sm text-stone-500">
                              {log.action_time
                                ? log.action_time.slice(0, 5)
                                : "No time"}
                            </p>
                          </div>

                          {log.notes ? (
                            <p className="mt-3 text-sm leading-6 text-stone-700">
                              {log.notes}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
}
