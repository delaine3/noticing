import { getReportCardStyle } from "../../lib/daily-rules";
import { ReportItem } from "../../lib/report-item";
import { CollapsibleSection } from "../CollapsibleSection";

type ReportCardProps = {
  report: ReportItem[];
};

export function ReportCard({ report }: ReportCardProps) {
  return (
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
