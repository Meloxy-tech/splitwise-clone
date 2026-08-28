"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    setEmail("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-moss hover:text-mossBright text-sm">
        + Add member
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="member@example.com"
        required
        className="px-3 py-2 rounded-card bg-surfaceRaised border border-border text-white text-sm placeholder:text-muted/60 focus:border-moss transition-colors"
      />
      {error && <p className="text-owe text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 rounded-card bg-moss hover:bg-mossBright disabled:opacity-60 text-ink text-xs font-medium"
        >
          {loading ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-muted text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}
