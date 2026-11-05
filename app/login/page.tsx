"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (window.location.search.includes("deleted=1")) {
      setMessage("Your account has been deleted.");
    }
  }, []);

  async function loginWithCredentials(
    loginEmail: string,
    loginPassword: string,
  ) {
    setIsSubmitting(true);
    setMessage("Logging in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage(
        "We couldn\'t sign you in. Check your email for a confirmation link, then try again.",
      );
      return;
    }

    setMessage("Logged in!");
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
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border px-4 py-3"
          required
        />
        <input
          type="password"
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
        {message ? (
          <p className="text-sm text-[var(--ink-soft)]">{message}</p>
        ) : null}
      </form>
    </main>
  );
}
