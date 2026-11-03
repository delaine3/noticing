import { getReportCardStyle } from "../../lib/daily-rules";
import { ReportItem } from "../../lib/report-item";
import { CollapsibleSection } from "../CollapsibleSection";

type ReportCardProps = {
  report: ReportItem[];
};

export function ReportCard({ report }: ReportCardProps) {
  return (
    <CollapsibleSection
      eyebrow="Today's records"
      title="What is recorded"
      summary={`${report.length} categories. Missing entries do not mean an activity did not happen.`}
      defaultOpen
    >
      <div className="grid gap-3 md:grid-cols-2">
        {report.map((item) => (
          <article
            key={`${item.label}-${item.status}`}
            className={`${getReportCardStyle(item.status)} log-card`}
          >
            <div className="flex gap-3">
              <span className="text-2xl">{item.emoji}</span>

              <div>
                <h3 className="font-semibold text-black-950">{item.label}</h3>

                <p className="mt-1 text-md leading-6 text-black-700">
                  {item.message}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}
