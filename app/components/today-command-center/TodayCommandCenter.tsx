import Link from "next/link";
import {
  DailyLog,
  ReportItem,
  TimeBucket,
  getNextActionCopy,
  getTotalWaterMl,
  getWaterMessage,
} from "../../lib/daily-rules";
import { CommandCard } from "./CommandCard";
import { QuickLogCard } from "./QuickLogCard";
import { ReportCard } from "./ReportCard";
import { SummaryCard } from "../SummaryCard";
import { TimelineCard } from "./TimeLineCard";

type TodayCommandCenterProps = {
  logs: DailyLog[];
  report: ReportItem[];
  buckets: TimeBucket[];
};

export function TodayCommandCenter({
  logs,
  report,
  buckets,
}: TodayCommandCenterProps) {
  const nextAction = getNextActionCopy(logs);
  const totalWaterMl = getTotalWaterMl(logs);

  return (
    <main className="min-h-screen px-4 py-8 text-black-950 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
            Noticing
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Today, as recorded
          </h1>

          <p className="mt-4 max-w-2xl text-black-700">
            See what you recorded, fill any gaps that matter, and decide what to do next.
          </p>
        </div>

        <CommandCard nextAction={nextAction} />

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Drinks recorded"
            value={`${totalWaterMl} ml`}
            message={getWaterMessage(totalWaterMl)}
          />

          <SummaryCard
            label="Entries"
            value={logs.length}
            message="Saved today, not a measure of productivity."
          />

          <SummaryCard
            label="Categories"
            value={report.length}
            message="Summaries of recorded activity."
          />
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/insights" className="secondary-button">Explore insights by life area</Link>
          <Link href="/insights/weekly" className="secondary-button">Review recent days</Link>
        </div>

        <QuickLogCard />

        <div className="mt-5 space-y-5">
          <ReportCard report={report} />
          <TimelineCard buckets={buckets} totalLogs={logs.length} />
        </div>
      </section>
    </main>
  );
}
