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
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Import your ChatGPT conversations</h1>
        <p className="mt-4 max-w-3xl text-[var(--ink-soft)]">
          Upload your ChatGPT export, review what Hoolayah finds, and decide what to save. Nothing is saved without your approval.
        </p>
        <ChatImportReview />
      </div>
    </main>
  );
}
