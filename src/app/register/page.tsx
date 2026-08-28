"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField } from "@/components/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error("Server returned an invalid response. The database might be waking up (Render free tier). Please try again in 10 seconds.");
      }

      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? "Something went wrong");
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (result?.error) {
        setError("Account created — please log in");
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg block mb-8 text-center">
          Ledger
        </Link>
        <div className="bg-surface border border-border rounded-card p-6">
          <h1 className="font-display text-2xl mb-6">Create your account</h1>
          <form onSubmit={handleSubmit}>
            <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && <p className="text-owe text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-card bg-moss hover:bg-mossBright disabled:opacity-60 text-ink font-medium transition-colors"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
        </div>
        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-moss hover:text-mossBright">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
