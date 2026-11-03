import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase-server";
import ChatImportReview from "./ChatImportReview";

export default async function ImportChatPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">Import · ChatGPT</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Bring useful conversations into Noticing</h1>
        <p className="mt-4 max-w-3xl text-[var(--ink-soft)]">
          Turn explicit events and measurements from your own ChatGPT export into suggested records.
          Nothing is imported without your approval. This is not a live ChatGPT connection.
        </p>
        <ChatImportReview />
      </div>
    </main>
  );
}
