"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const router = useRouter();

  async function handleSignup() {
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

        <button type="submit" className="submit-button w-full">
          Sign Up
        </button>
      </form>
    </main>
  );
}
