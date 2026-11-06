"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/reset-password?recovery=1",
      });
      if (error) {
        setMessage(error.status === 429
          ? "Too many requests right now. Please try again later."
          : "We couldn't send the link right now. Please try again.");
      } else {
        setSent(true);
        // Keep the same message whether or not the address has an account.
        setMessage("If you have an account with this email, we'll send you a reset link. Check your inbox and spam folder.");
      }
    } catch {
      setMessage("We couldn't send the link right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md space-y-5 rounded-2xl border border-[var(--border-soft)] bg-white/85 p-6">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p>Enter the email address you used for Noticing. We&apos;ll email you a link.</p>
        {!sent ? (
          <form onSubmit={(event) => void requestReset(event)} className="space-y-4">
            <label className="block text-sm font-medium" htmlFor="recovery-email">Email</label>
            <input id="recovery-email" type="email" autoComplete="email" required
              className="w-full rounded-lg border px-4 py-3" value={email}
              onChange={(event) => setEmail(event.target.value)} />
            <button type="submit" className="submit-button w-full" disabled={busy}>
              {busy ? "Sending…" : "Email me a reset link"}
            </button>
          </form>
        ) : null}
        {message ? <p role="status" className="text-sm">{message}</p> : null}
        <Link href="/login" className="inline-block text-sm underline">Back to login</Link>
      </section>
    </main>
  );
}
