import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
            Noticing
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            What did you notice today?
          </h1>

          <p className="mt-6 text-lg leading-8 text-stone-700">
            Track mood, energy, cravings, care actions, recurring thoughts, and
            the small things that make life hurt less.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/logs/new"
              className="rounded-full bg-emerald-800 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
            >
              Log something
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-stone-300 px-6 py-3 text-center text-sm font-semibold text-stone-800 hover:bg-stone-100"
            >
              View dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
