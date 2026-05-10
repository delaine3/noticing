import Link from "next/link";
import { supabase } from "../lib/supabase";

type Log = {
  id: number;
  log_type: string;
  title: string | null;
  notes: string | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
  action_date: string | null;
  action_time: string | null;
  effect: string | null;
  meal_size: string | null;
  meal_source: string | null;
  water_amount_ml: number | null;
  occurred_at: string;
};

export default async function LogsPage() {
  const { data: logs, error } = await supabase
    .from("logs")
    .select("*")
    .order("occurred_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen app-bg px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-md font-medium uppercase tracking-[0.25em] text-green-700">
              Logs
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              What you’ve noticed
            </h1>
          </div>

          <Link href="/logs/new" className="brand-button">
            New action
          </Link>
        </div>

        {!logs?.length ? (
          <div className="mt-8 rounded border border-dashed border-stone-300 bg-white p-8 text-stone-600">
            No logs yet. Your future receipts will live here.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {(logs as Log[]).map((log) => (
              <article
                key={log.id}
                className="rounded border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-md font-medium text-green-700">
                      {log.log_type}
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {log.title || "Untitled notice"}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <time className="text-md text-stone-500">
                      Created {new Date(log.occurred_at).toLocaleString()}
                    </time>

                    {log.action_date ? (
                      <p className="mt-1 text-md text-stone-500">
                        Happened {log.action_date}
                        {log.action_time
                          ? ` at ${log.action_time.slice(0, 5)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </div>

                {log.notes ? (
                  <p className="mt-4 leading-7 text-stone-700">{log.notes}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2 text-md text-stone-700">
                  {log.effect ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Effect: {log.effect}
                    </span>
                  ) : null}

                  {log.meal_size ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Size: {log.meal_size}
                    </span>
                  ) : null}

                  {log.meal_source ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Source: {log.meal_source}
                    </span>
                  ) : null}
                  {log.water_amount_ml ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Water: {log.water_amount_ml}ml
                    </span>
                  ) : null}
                  {log.mood_score ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Mood: {log.mood_score}/10
                    </span>
                  ) : null}

                  {log.energy_score ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Energy: {log.energy_score}/10
                    </span>
                  ) : null}

                  {log.intensity_score ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      Intensity: {log.intensity_score}/10
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
