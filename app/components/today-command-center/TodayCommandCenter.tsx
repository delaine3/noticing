import Link from "next/link";
import {
  DailyLog,
  ReportItem,
  TimeBucket,
  getNextActionCopy,
  getTotalWaterMl,
} from "../../lib/daily-rules";
import { CommandCard } from "./CommandCard";
import { QuickLogCard } from "./QuickLogCard";
import { ReportCard } from "./ReportCard";
import { SummaryCard } from "../SummaryCard";
import { TimelineCard } from "./TimeLineCard";
import { SleepCompanion } from "../sleep/SleepCompanion";
import type { SleepMoment } from "../../lib/sleep-utils";
import { HydrationCoach } from "./HydrationCoach";
import { AdaptiveCheckInInvite } from "./AdaptiveCheckInInvite";
import type { CheckInValues } from "../../lib/coaching";

type TodayCommandCenterProps = {
  logs: DailyLog[];
  report: ReportItem[];
  buckets: TimeBucket[];
  sleepEvents: SleepMoment[];
  coaching: {
    fluidGoalMl: number;
    fluidRestricted: boolean | null;
    allDrinksLogged: boolean;
    invitesEnabled: boolean;
    checkinCount: number;
    pendingReviews: number;
    latestCheckIn: CheckInValues | null;
    lastCheckinAt: string | null;
  };
};

export function TodayCommandCenter({
  logs,
  report,
  buckets,
  sleepEvents,
  coaching,
}: TodayCommandCenterProps) {
  const nextAction = getNextActionCopy(logs, coaching);
  const totalWaterMl = getTotalWaterMl(logs);

  return (
    <main className="min-h-screen px-4 py-8 text-black-950 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
            Noticing
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Today
          </h1>

        </div>

        <SleepCompanion events={sleepEvents} />
        <AdaptiveCheckInInvite todayCount={coaching.checkinCount}
          invitesEnabled={coaching.invitesEnabled} pendingReviews={coaching.pendingReviews}
          lastCheckinAt={coaching.lastCheckinAt} />
        <HydrationCoach totalMl={totalWaterMl}
          fluidGoalMl={coaching.fluidGoalMl}
          fluidRestricted={coaching.fluidRestricted}
          allDrinksLogged={coaching.allDrinksLogged} />
        <CommandCard nextAction={nextAction} />

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Entries"
            value={logs.length}
            message="Activities recorded today."
          />

          <SummaryCard
            label="Categories"
            value={report.length}
            message="Activity summaries."
          />
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/insights" className="secondary-button">Explore insights</Link>
          <Link href="/insights/weekly" className="secondary-button">Recent days</Link>
          <Link href="/import/chat" className="secondary-button">Import conversations</Link>
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
