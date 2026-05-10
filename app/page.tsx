import Link from "next/link";

const baselineItems = [
  {
    label: "Drink water",
    command: "Get a glass. Drink it before negotiating with your brain.",
  },
  {
    label: "Eat something real",
    command: "Protein or leftovers count. No cooking performance required.",
  },
  {
    label: "Get sunlight",
    command: "Sit outside or near a bright window for 10 minutes.",
  },
  {
    label: "Move your body",
    command: "Walk for 5 minutes. Treadmill counts. House pacing counts.",
  },
  {
    label: "Wash up",
    command:
      "Shower, bath, face wash, or teeth. Pick the smallest viable option.",
  },
  {
    label: "Do one useful task",
    command:
      "One task. Not a life overhaul. Open the app, fix one thing, close it.",
  },
];

const quickActions = [
  { label: "I woke up", href: "/logs/new?type=Woke%20up" },
  { label: "I ate", href: "/logs/new?type=First%20meal" },
  { label: "I drank water", href: "/logs/new?type=Water" },
  { label: "I got sunlight", href: "/logs/new?type=Sunlight" },
  { label: "I moved", href: "/logs/new?type=Movement" },
  { label: "I’m spiraling", href: "/logs/new?type=Recurring%20thought" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
            Noticing
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Today’s command center
          </h1>

          <p className="mt-4 max-w-2xl text-stone-700">
            This app is here to run the day when your brain starts acting like
            an unpaid intern with no manager.
          </p>
        </div>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-950 p-6 text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
            Next best action
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Start with the body. No debates.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-emerald-50">
            Before analyzing your life, check the basics: water, food, sunlight,
            movement, wash up. If the body is under-maintained, the thoughts are
            not reliable witnesses.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/logs/new"
              className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
            >
              Log what happened
            </Link>

            <Link
              href="/logs"
              className="rounded-full border border-emerald-200 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-900"
            >
              View today’s evidence
            </Link>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
                  At Least
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Baseline checklist
                </h2>
              </div>

              <p className="text-sm text-stone-600">
                Do these before spiraling.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {baselineItems.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-stone-300 accent-emerald-800"
                    />

                    <span>
                      <span className="block font-semibold text-stone-950">
                        {item.label}
                      </span>

                      <span className="mt-1 block text-sm leading-6 text-stone-600">
                        {item.command}
                      </span>
                    </span>
                  </label>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
              Quick log
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Press the button. Keep it moving.
            </h2>

            <div className="mt-5 grid gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 hover:border-emerald-700 hover:bg-emerald-50"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
            Rule
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Feelings are data. Maintenance comes first.
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-stone-700">
            If the day feels fake, heavy, foggy, or doomed, the first move is
            not analysis. The first move is body support. Water. Food. Sun.
            Movement. Wash up. Then reassess.
          </p>
        </section>
      </section>
    </main>
  );
}
