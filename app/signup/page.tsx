"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const router = useRouter();

  async function handleSignup() {
    if (!adult || !accepted) {
      alert("You must be 18 or older and accept the Terms and Privacy Notice.");
      return;
    }
    if (!email || !password || !fullName || !username) {
      alert("Please fill in all fields");
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
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
      alert(error.message);
    } else {
      alert("Check your email to confirm your account.");
      router.push("/login");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center page px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignup();
        }}
        className="w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">Sign Up</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-4 py-3"
          required
        />

        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded px-4 py-3"
          required
        />

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-4 py-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
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
          Noticing is not a medical or crisis service.</span></label>
        <button type="submit" disabled={!adult || !accepted} className="submit-button w-full disabled:opacity-50">
          Sign Up
        </button>
      </form>
    </main>
  );
}
