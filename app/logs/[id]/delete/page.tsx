import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type DeleteLogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DeleteableLog = {
  id: number;
  log_type: string;
  title: string | null;
  action_date: string | null;
  action_time: string | null;
  notes: string | null;
};

async function deleteLog(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid log id");
  }

  const { error } = await supabase.from("logs").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/logs");
}

export default async function DeleteLogPage({ params }: DeleteLogPageProps) {
  const { id } = await params;
  const logId = Number(id);

  if (!Number.isFinite(logId)) {
    notFound();
  }

  const { data, error } = await supabase
    .from("logs")
    .select("id, log_type, title, action_date, action_time, notes")
    .eq("id", logId)
    .single();

  if (error || !data) {
    notFound();
  }

  const log = data as DeleteableLog;

  return (
    <main className="app-bg min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-2xl">
        <div className="glass-card  p-5 shadow-sm">
          <p className="eyebrow">Delete log</p>

          <h1 className="page-title mt-3 text-4xl sm:text-5xl">
            Delete this log?
          </h1>

          <p className="p mt-4">
            This will permanently remove this log from your tracker. If the
            details are wrong, editing is safer than deleting.
          </p>

          <article className="mt-6   bg-white/60 p-4">
            <p className="text-md font-semibold text-[var(--leaf-dark)]">
              {log.log_type}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">
              {log.title || "Untitled log"}
            </h2>

            <p className="mt-2 text-md text-[var(--ink-soft)]">
              {log.action_date || "No date"}
              {log.action_time ? ` at ${log.action_time.slice(0, 5)}` : ""}
            </p>

            {log.notes ? (
              <p className="mt-3 text-md leading-7 text-[var(--ink-soft)]">
                {log.notes}
              </p>
            ) : null}
          </article>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <form action={deleteLog}>
              <input type="hidden" name="id" value={log.id} />

              <button type="submit" className="danger-button">
                Yes, delete it
              </button>
            </form>

            <Link href="/logs" className="secondary-button">
              Cancel
            </Link>

            <Link href={`/logs/${log.id}/edit`} className="submit-button">
              Edit instead
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
