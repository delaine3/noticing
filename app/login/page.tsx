"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Logging in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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

  return (
    <main className="min-h-screen flex items-center justify-center page px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="title-sm">Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-4 py-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-4 py-3"
          required
        />

        <button type="submit" className="submit-button">
          Login
        </button>

        {message && <p>{message}</p>}
      </form>
    </main>
  );
}
