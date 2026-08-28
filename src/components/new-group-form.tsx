"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function NewGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const memberEmails = emails
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberEmails }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setName("");
    setEmails("");
    setOpen(false);
    router.refresh();
    router.push(`/groups/${data.group.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-card bg-moss hover:bg-mossBright text-ink font-medium transition-colors"
      >
        + New group
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-5 mb-6">
      <div className="flex gap-3 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name (e.g. Goa Trip)"
          required
          className="flex-1 px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white placeholder:text-muted/60 focus:border-moss transition-colors"
        />
      </div>
      <input
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        placeholder="Invite by email, comma-separated (optional)"
        className="w-full px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white placeholder:text-muted/60 focus:border-moss transition-colors mb-3"
      />
      {error && <p className="text-owe text-sm mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-card bg-moss hover:bg-mossBright disabled:opacity-60 text-ink font-medium transition-colors"
        >
          {loading ? "Creating…" : "Create group"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-card text-muted hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
