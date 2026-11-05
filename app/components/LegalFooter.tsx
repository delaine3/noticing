import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border-soft)] px-4 py-5 text-xs text-[var(--ink-soft)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span>© {new Date().getFullYear()} Noticing · Delaine Abner</span>
        <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
        <Link href="/terms" className="underline underline-offset-2">Terms</Link>
        <Link href="/community-guidelines" className="underline underline-offset-2">Guidelines</Link>
        <Link href="/safety" className="underline underline-offset-2">Wellbeing &amp; safety</Link>
        <Link href="/settings" className="underline underline-offset-2">Settings</Link>
      </div>
      <p className="mx-auto mt-2 max-w-4xl text-center">
        Noticing is a journaling tool, not a medical or crisis service. Please do not enter private information in the shared demo.
      </p>
    </footer>
  );
}
