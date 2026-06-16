import { TimeBucket } from "../../lib/daily-rules";
import { CollapsibleSection } from "../CollapsibleSection";
import { TimelineLog } from "./TimelineLog";

type TimelineCardProps = {
  buckets: TimeBucket[];
  totalLogs: number;
};

export function TimelineCard({ buckets, totalLogs }: TimelineCardProps) {
  return (
    <CollapsibleSection
      eyebrow="Timeline"
      title="What happened by checkpoint"
      summary={`${totalLogs} actions logged today.`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {buckets.map((bucket) => (
          <section key={bucket.label} className="p-4">
            <h3 className="font-semibold text-xl text-black-950">
              {bucket.label}
            </h3>

            {bucket.logs.length === 0 ? (
              <p className="mt-3 text-md text-black-500">
                Nothing logged here.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {bucket.logs.map((log) => (
                  <TimelineLog key={log.id} log={log} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </CollapsibleSection>
  );
}
