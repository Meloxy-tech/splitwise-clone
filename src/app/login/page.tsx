"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField } from "@/components/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);
    if (result?.error) {
      setError("Incorrect email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg block mb-8 text-center">
          Ledger
        </Link>
        <div className="bg-surface border border-border rounded-card p-6">
          <h1 className="font-display text-2xl mb-6">Welcome back</h1>
          <form onSubmit={handleSubmit}>
            <FormField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <FormField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="text-owe text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-card bg-moss hover:bg-mossBright disabled:opacity-60 text-ink font-medium transition-colors"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
        <p className="text-center text-muted text-sm mt-6">
          No account?{" "}
          <Link href="/register" className="text-moss hover:text-mossBright">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
