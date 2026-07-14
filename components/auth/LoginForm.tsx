"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

 async function handleLogin() {
  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  setLoading(true);

  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log(result);

  setLoading(false);

  if (result.error) {
    alert(result.error.message);
    return;
  }

  alert("Login successful!");

  router.push("/chat");
  router.refresh();
}

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-3xl font-bold">
        Welcome back 👋
      </h1>

      <p className="mb-6 text-slate-500">
        Sign in to continue learning English.
      </p>

      <div className="space-y-4">
        <input
          className="w-full rounded-lg border p-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          className="w-full"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </div>
    </div>
  );
}
