"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);


  async function handleSignup() {
    if (busy) return;
    setMessage("");
    if (!adult || !accepted) {
      setMessage("Confirm your age and accept the terms before continuing.");
      return;
    }
    if (!email.trim() || !password || !fullName.trim()) {
      setMessage("Enter your name, email and password.");
      return;
    }
    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      return;
    }
    const usernameInput = username.trim().toLowerCase();
    if (usernameInput && !/^[a-z0-9_]{3,24}$/.test(usernameInput)) {
      setMessage("Use 3–24 letters, numbers or underscores for your username, or leave it blank.");
      return;
    }
    // A username is not necessary for a personal diary. Create a non-identifying
    // handle for users who leave it blank, avoiding name collisions.
    const normalizedUsername = usernameInput ||
      "user_" + crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/login",
          data: {
            full_name: fullName.trim(),
            username: normalizedUsername,
            age_18_confirmed: adult,
            legal_terms_accepted_at: new Date().toISOString(),
            legal_terms_version: "2026-11-05",
          },
        },
      });
      if (error) {
        const raw = error.message.toLowerCase();
        setMessage(/already registered|already exists/.test(raw)
          ? "An account may already exist with that email. Try signing in or resetting your password."
          : /username|duplicate|unique/.test(raw)
            ? "That username may already be in use. Try another one or leave it blank."
            : /rate limit|too many/.test(raw)
              ? "Too many attempts right now. Please try again later."
              : "We couldn't create your account. Please try again.");
        return;
      }
      setSubmitted(true);
      setPassword("");
      setMessage("Check your email for a confirmation link. After confirming, sign in using your email address.");
    } catch {
      setMessage("We couldn't create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center page px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSignup();
        }}
        className="w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">Create your account</h1>

        <input
          type="email"
          autoComplete="email"
          aria-label="Email address"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-4 py-3"
          required
        />

        <input
          autoComplete="name"
          aria-label="Name"
          placeholder="Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded px-4 py-3"
          required
        />

        <input
          aria-label="Username, optional"
          placeholder="Username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-4 py-3"
        />
        <p className="text-xs text-[var(--ink-soft)]">You can skip the username. You&apos;ll sign in with your email.</p>

        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          aria-label="Password"
          placeholder="Password (12+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-4 py-3"
          required
        />

        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={adult}
          onChange={(e) => setAdult(e.target.checked)} required className="mt-1" />
          I confirm I am at least 18 years old.</label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)} required className="mt-1" />
          <span>I have read and agree to the <Link className="underline" href="/terms">Terms</Link>
          {" "}and acknowledge the <Link className="underline" href="/privacy">Privacy Notice</Link>.
          Hoolayah is not a medical or crisis service.</span></label>
        <button type="submit" disabled={!adult || !accepted || busy || submitted} className="submit-button w-full disabled:opacity-50">
          {busy ? "Creating account…" : "Create account"}
        </button>
        {message ? <p role="status" className="text-sm">{message}</p> : null}
        <p className="text-sm">Already have an account? <Link href="/login" className="underline">Sign in</Link> or <Link href="/forgot-password" className="underline">reset your password</Link>.</p>
      </form>
    </main>
  );
}
