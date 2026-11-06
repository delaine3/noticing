import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-[75vh] px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-12">
      <article className="glass-card mx-auto max-w-3xl space-y-5 p-5 leading-relaxed sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--leaf-dark)]">Hoolayah · Information &amp; policies</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-xs text-[var(--ink-soft)]">Last updated: 5 November 2026</p>
        <div className="space-y-4 text-sm sm:text-base [&_h2]:pt-3 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </article>
    </main>
  );
}
