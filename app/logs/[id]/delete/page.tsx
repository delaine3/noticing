import LoadingLink from "@/app/components/LoadingLink";
import { LogNotes } from "@/app/components/LogNotes";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type DeleteLogPageProps = {
  params: Promise<{ id: string }>;
};

type DeleteableLog = {
  id: number;
  log_type: string;
  title: string | null;
  action_date: string | null;
  action_time: string | null;
  notes: string | null;
};

function parseLogId(raw: unknown) {
  const value = String(raw ?? "");
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function deleteLog(formData: FormData) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = parseLogId(formData.get("id"));
  if (id === null) notFound();

  // A log ID alone is never sufficient authorization.
  const { data, error } = await supabase.from("logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();

  revalidatePath("/logs");
  revalidatePath("/");
  revalidatePath("/insights");
  redirect("/logs");
}

export default async function DeleteLogPage({ params }: DeleteLogPageProps) {
  const { id } = await params;
  const logId = parseLogId(id);
  if (logId === null) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.from("logs")
    .select("id, log_type, title, action_date, action_time, notes")
    .eq("id", logId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) notFound();
  const log = data as DeleteableLog;

  return (
    <main className="app-bg min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-2xl">
        <div className="glass-card p-5 shadow-sm">
          <p className="eyebrow">Delete log</p>
          <h1 className="page-title mt-3 text-4xl sm:text-5xl">Delete this log?</h1>
          <p className="p mt-4">
            This permanently removes the record. Edit instead if the details need correcting.
          </p>
          <article className="mt-6 bg-white/60 p-4">
            <p className="text-md font-semibold text-[var(--leaf-dark)]">{log.log_type}</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">
              {log.title || "Untitled log"}
            </h2>
            <p className="mt-2 text-md text-[var(--ink-soft)]">
              {log.action_date || "No date"}
              {log.action_time ? ` at ${log.action_time.slice(0, 5)}` : ""}
            </p>
            <LogNotes notes={log.notes} />
          </article>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <form action={deleteLog}>
              <input type="hidden" name="id" value={log.id} />
              <button type="submit" className="danger-button">Yes, delete it</button>
            </form>
            <Link href="/logs" className="secondary-button">Cancel</Link>
            <LoadingLink href={`/logs/${log.id}/edit`} className="submit-button">Edit instead</LoadingLink>
          </div>
        </div>
      </section>
    </main>
  );
}
