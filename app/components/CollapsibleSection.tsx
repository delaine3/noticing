"use client";

import { ReactNode, useState } from "react";

type CollapsibleSectionProps = {
  eyebrow: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  eyebrow,
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="glass-card rounded-xl p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-green-700">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-950 sm:text-2xl">
            {title}
          </h2>

          {summary ? (
            <p className="mt-2 text-sm leading-6 text-stone-600">{summary}</p>
          ) : null}
        </div>

        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm font-semibold text-stone-700">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>
      {isOpen ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
