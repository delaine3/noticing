"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function loginWithCredentials(
    loginEmail: string,
    loginPassword: string,
  ) {
    setIsSubmitting(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message.toLowerCase().includes("email not confirmed")
        ? "Please confirm your email before signing in. Check your inbox and spam folder."
        : "We couldn\'t sign you in. Check your email and password, or reset your password.");
      return;
    }

    if (!data.session) {
      setMessage(
        "We couldn't sign you in. Check your email for a confirmation link, then try again.",
      );
      return;
    }

    setMessage("");
    router.replace("/");
    router.refresh();
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginWithCredentials(email, password);
  }

  return (
    <main className="min-h-screen flex items-center justify-center page px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-[var(--ink-soft)]">Sign in with your email address, not your username.</p>
        <input
          type="email"
          aria-label="Email address"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border px-4 py-3"
          required
        />
        <input
          type="password"
          aria-label="Password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded border px-4 py-3"
          required
        />
        <button
          type="submit"
          className="submit-button w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm underline">Forgot your password?</Link>
        </div>
        {message ? (
          <p className="text-sm text-[var(--ink-soft)]">{message}</p>
        ) : null}
        <p className="text-center text-sm text-[var(--ink-soft)]">
          New to Noticing? <Link href="/signup" className="underline">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
