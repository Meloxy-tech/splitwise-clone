"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Member = { userId: string; user: { id: string; name: string } };

export function AddExpenseForm({ groupId, members, currentUserId }: {
  groupId: string;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE">("EQUAL");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    let splits: { userId: string; value: number }[] | undefined;
    if (splitType !== "EQUAL") {
      splits = members.map((m) => ({
        userId: m.userId,
        value: parseFloat(customSplits[m.userId] || "0"),
      }));
    }

    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: numAmount, paidById, splitType, splits }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setDescription("");
    setAmount("");
    setCustomSplits({});
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-card bg-moss hover:bg-mossBright text-ink font-medium transition-colors"
      >
        + Add expense
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          required
          className="px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white placeholder:text-muted/60 focus:border-moss transition-colors"
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
          className="px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white placeholder:text-muted/60 focus:border-moss transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="block text-sm text-muted mb-1.5">Paid by</span>
          <select
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white focus:border-moss transition-colors"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm text-muted mb-1.5">Split</span>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as typeof splitType)}
            className="w-full px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white focus:border-moss transition-colors"
          >
            <option value="EQUAL">Equally</option>
            <option value="EXACT">Exact amounts</option>
            <option value="PERCENTAGE">Percentages</option>
          </select>
        </label>
      </div>

      {splitType !== "EQUAL" && (
        <div className="mb-3 space-y-2">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3">
              <span className="text-sm text-muted w-32 truncate">{m.user.name}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customSplits[m.userId] || ""}
                onChange={(e) => setCustomSplits({ ...customSplits, [m.userId]: e.target.value })}
                placeholder={splitType === "PERCENTAGE" ? "%" : "$"}
                className="flex-1 px-3 py-1.5 rounded-card bg-surfaceRaised border border-border text-white text-sm focus:border-moss transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-owe text-sm mb-3">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-card bg-moss hover:bg-mossBright disabled:opacity-60 text-ink font-medium transition-colors"
        >
          {loading ? "Adding…" : "Add expense"}
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
