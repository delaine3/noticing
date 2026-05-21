import Link from "next/link";
import { getNextActionCopy } from "../../lib/daily-rules";

type CommandCardProps = {
  nextAction: ReturnType<typeof getNextActionCopy>;
};

export function CommandCard({ nextAction }: CommandCardProps) {
  return (
    <section className="message-card rounded border border-green-200 shadow-sm sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-800">
        Next best action
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black-950 sm:text-3xl">
        {nextAction.title}
      </h2>

      <p className="mt-3 max-w-2xl leading-7 text-black-700">
        {nextAction.body}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href={nextAction.href} className="app-button">
          {nextAction.label}
        </Link>

        <Link href="/logs/new" className="secondary-button">
          Log something else
        </Link>
      </div>
    </section>
  );
}
