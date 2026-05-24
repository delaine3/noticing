"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const demoCredentials = {
  email: "demo@noticing.com",
  password: "D3m0Pa$$w0rd783!",
};

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
        "Login did not create a session. Check email confirmation settings.",
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

  async function handleDemoLogin() {
    await loginWithCredentials(demoCredentials.email, demoCredentials.password);
  }

  return (
    <main className="min-h-screen flex items-center justify-center page px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="title-sm">Login</h1>

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

        <button
          type="button"
          onClick={handleDemoLogin}
          className="danger-button w-full"
          disabled={isSubmitting}
        >
          Login to demo version
        </button>

        {message ? (
          <p className="text-sm text-[var(--ink-soft)]">{message}</p>
        ) : null}
      </form>
    </main>
  );
}
