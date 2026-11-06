"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let live = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!live) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setChecking(false);
      }
    });
    async function checkLink() {
      const params = new URLSearchParams(window.location.search);
      const hasRecoveryLink = params.get("recovery") === "1" || Boolean(params.get("code")) ||
        new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
      if (!hasRecoveryLink || params.has("error") || params.has("error_description")) {
        if (live) {
          setMessage("This reset link is invalid or expired. Please request a new one.");
          setChecking(false);
        }
        return;
      }
      try {
        // The browser client may already have exchanged the one-time code.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (live) setReady(true);
          return;
        }
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (live) setReady(true);
        } else if (live) {
          setMessage("This reset link is invalid or expired. Please request a new one.");
        }
      } catch {
        if (live) setMessage("This reset link is invalid or expired. Please request a new one.");
      } finally {
        if (live) setChecking(false);
      }
    }
    void checkLink();
    return () => { live = false; subscription.unsubscribe(); };
  }, []);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready) return;
    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage("We couldn't update your password. Please request another link if this one has expired.");
        return;
      }
      setPassword("");
      setConfirm("");
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setMessage("We couldn't update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md space-y-5 rounded-2xl border border-[var(--border-soft)] bg-white/85 p-6">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        {checking ? <p role="status">Checking your link…</p> : null}
        {!checking && ready ? (
          <form onSubmit={(event) => void changePassword(event)} className="space-y-4">
            <label className="block text-sm font-medium">
              New password
              <input type="password" autoComplete="new-password" minLength={12} required
                value={password} onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border px-4 py-3" />
            </label>
            <label className="block text-sm font-medium">
              Repeat new password
              <input type="password" autoComplete="new-password" minLength={12} required
                value={confirm} onChange={(event) => setConfirm(event.target.value)}
                className="mt-2 w-full rounded-lg border px-4 py-3" />
            </label>
            <button type="submit" className="submit-button w-full" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        ) : null}
        {message ? <p role="status" className="text-sm">{message}</p> : null}
        {!checking && !ready ? <Link href="/forgot-password" className="underline">Request another link</Link> : null}
        <p><Link href="/login" className="text-sm underline">Back to login</Link></p>
      </section>
    </main>
  );
}
