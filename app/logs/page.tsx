import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";
import LoadingLink from "../components/LoadingLink";
import { PaginationControls } from "../components/PaginationControls";

type LogsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

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
  treadmill_duration_minutes: number | null;
  treadmill_distance_km: number | null;
  treadmill_pace_min_per_km: number | null;
  workout_name: string | null;
};

function getLogDate(log: Log) {
  return log.action_date || log.occurred_at.slice(0, 10);
}

function formatDateHeading(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupLogsByDate(logs: Log[]) {
  return logs.reduce<Record<string, Log[]>>((groups, log) => {
    const date = getLogDate(log);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(log);

    return groups;
  }, {});
}

function getCurrentPage(pageParam: string | undefined) {
  const parsedPage = Number(pageParam);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return Math.floor(parsedPage);
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const currentPage = getCurrentPage(params?.page);
  const pageSize = 20;

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: logs,
    error,
    count,
  } = await supabase
    .from("logs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("action_date", { ascending: false })
    .order("action_time", { ascending: false, nullsFirst: false })
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const typedLogs = (logs ?? []) as Log[];
  const groupedLogs = groupLogsByDate(typedLogs);

  const dateGroups = Object.entries(groupedLogs).sort(([dateA], [dateB]) =>
    dateB.localeCompare(dateA),
  );

  return (
    <main className="min-h-screen px-6 py-10 text-black-950">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-md font-medium uppercase tracking-[0.25em] text-green-700">
              Logs
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              What you’ve noticed
            </h1>

            <p className="mt-3 text-md text-[var(--ink-soft)]">
              Showing {typedLogs.length} of {count ?? 0} logs.
            </p>
          </div>

          <LoadingLink href="/logs/new" className="submit-button">
            New action
          </LoadingLink>
        </div>

        {!typedLogs.length ? (
          <div className="glass-card mt-8">
            No logs yet. Your future receipts will live here.
          </div>
        ) : (
          <>
            <div className="scroll-card">
              {dateGroups.map(([date, logsForDate]) => (
                <section key={date}>
                  <div className="mb-4 mt-4 border-b border-[var(--border-soft)] pb-3">
                    <p className="text-xl font-semibold uppercase tracking-[0.2em] text-green-700">
                      {formatDateHeading(date)}
                    </p>

                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {logsForDate.length}{" "}
                      {logsForDate.length === 1 ? "log" : "logs"} on this page
                    </p>
                  </div>

                  <div className="space-y-4">
                    {logsForDate.map((log) => (
                      <article key={log.id} className="log-card">
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
                            <time className="text-md text-black-500">
                              Created{" "}
                              {new Date(log.occurred_at).toLocaleString()}
                            </time>

                            {log.action_date ? (
                              <p className="mt-1 text-md text-black-500">
                                Happened {log.action_date}
                                {log.action_time
                                  ? ` at ${log.action_time.slice(0, 5)}`
                                  : ""}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {log.notes ? (
                          <p className="mt-4 leading-7 text-black-700">
                            {log.notes}
                          </p>
                        ) : null}

                        <div className="mt-5 flex flex-wrap gap-2 text-md text-black-700">
                          {log.effect ? (
                            <span className="bg-black-100 px-3 py-1">
                              Effect: {log.effect}
                            </span>
                          ) : null}

                          {log.meal_size ? (
                            <span className="bg-black-100 px-3 py-1">
                              Size: {log.meal_size}
                            </span>
                          ) : null}

                          {log.meal_source ? (
                            <span className="bg-black-100 px-3 py-1">
                              Source: {log.meal_source}
                            </span>
                          ) : null}

                          {log.water_amount_ml ? (
                            <span className="bg-black-100 px-3 py-1">
                              Water: {log.water_amount_ml}ml
                            </span>
                          ) : null}

                          {log.treadmill_duration_minutes &&
                          log.treadmill_distance_km ? (
                            <span className="bg-black-100 px-3 py-1">
                              Treadmill: {log.treadmill_duration_minutes} min ·{" "}
                              {log.treadmill_distance_km} km
                            </span>
                          ) : null}

                          {log.treadmill_pace_min_per_km ? (
                            <span className="bg-black-100 px-3 py-1">
                              Pace: {log.treadmill_pace_min_per_km.toFixed(2)}{" "}
                              min/km
                            </span>
                          ) : null}

                          {log.workout_name ? (
                            <span className="bg-black-100 px-3 py-1">
                              Workout: {log.workout_name}
                            </span>
                          ) : null}

                          {log.mood_score ? (
                            <span className="bg-black-100 px-3 py-1">
                              Mood: {log.mood_score}/10
                            </span>
                          ) : null}

                          {log.energy_score ? (
                            <span className="bg-black-100 px-3 py-1">
                              Energy: {log.energy_score}/10
                            </span>
                          ) : null}

                          {log.intensity_score ? (
                            <span className="bg-black-100 px-3 py-1">
                              Intensity: {log.intensity_score}/10
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <LoadingLink
                            href={`/logs/${log.id}/edit`}
                            className="secondary-button"
                          >
                            Edit
                          </LoadingLink>

                          <LoadingLink
                            href={`/logs/${log.id}/delete`}
                            className="danger-button"
                          >
                            Delete
                          </LoadingLink>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={count ?? 0}
              basePath="/logs"
            />
          </>
        )}
      </section>
    </main>
  );
}
