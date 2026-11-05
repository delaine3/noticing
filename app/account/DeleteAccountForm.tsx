"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export function DeleteAccountForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function removeAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmation !== "DELETE MY ACCOUNT" || !password) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ password, confirmation }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not delete your account.");
        return;
      }
      setPassword("");
      await supabase.auth.signOut();
      router.replace("/login?deleted=1");
      router.refresh();
    } catch {
      setError("Deletion could not be confirmed. Please sign in and check your account before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-red-300 bg-red-50 p-5 text-red-950">
      <h2 className="text-xl font-semibold">Delete your account</h2>
      <p className="mt-2 text-sm">
        Permanently delete your Noticing account and associated records.
        This cannot be undone. Download your data first if you want to keep it.
        Provider backups and security logs may persist temporarily under their retention policies.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="mt-4 rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-800 hover:bg-red-100">
          Delete my account
        </button>
      ) : (
        <form onSubmit={(event) => void removeAccount(event)} className="mt-4 space-y-4">
          <p className="text-sm font-semibold">Verify your password and type DELETE MY ACCOUNT to confirm.</p>
          <label className="block text-sm">
            Account password
            <input type="password" autoComplete="current-password" required value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full max-w-md rounded-lg border border-red-300 bg-white px-3 py-2 text-black" />
          </label>
          <label className="block text-sm">
            Confirmation phrase
            <input type="text" autoComplete="off" required value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-1 block w-full max-w-md rounded-lg border border-red-300 bg-white px-3 py-2 text-black" />
          </label>
          {error ? <p role="alert" className="text-sm font-semibold">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy || !password || confirmation !== "DELETE MY ACCOUNT"}
              className="rounded-lg bg-red-800 px-4 py-2 font-semibold text-white disabled:opacity-50">
              {busy ? "Deleting…" : "Permanently delete my account"}
            </button>
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setPassword(""); setConfirmation(""); setError(""); }}
              className="rounded-lg border border-red-300 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
