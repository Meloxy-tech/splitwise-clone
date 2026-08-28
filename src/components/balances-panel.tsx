"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

type Balance = { userId: string; amount: number; user?: { id: string; name: string } };
type Transaction = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser?: { id: string; name: string };
  toUser?: { id: string; name: string };
};

export function BalancesPanel({
  groupId,
  balances,
  suggestedTransactions,
}: {
  groupId: string;
  balances: Balance[];
  suggestedTransactions: Transaction[];
}) {
  const router = useRouter();
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  async function handleSettle(t: Transaction) {
    const key = `${t.fromUserId}-${t.toUserId}`;
    setSettlingKey(key);
    await fetch(`/api/groups/${groupId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: t.fromUserId, toUserId: t.toUserId, amount: t.amount }),
    });
    setSettlingKey(null);
    router.refresh();
  }

  return (
    <div className="bg-surface border border-border rounded-card p-5">
      <h2 className="font-display text-lg mb-4">Balances</h2>
      <ul className="space-y-2 mb-6">
        {balances.map((b) => (
          <li key={b.userId} className="flex items-center justify-between text-sm">
            <span>{b.user?.name ?? "Unknown"}</span>
            <span className={b.amount >= 0 ? "text-owed" : "text-owe"}>
              {b.amount >= 0 ? "is owed " : "owes "}
              {formatCurrency(Math.abs(b.amount))}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="text-sm text-muted mb-3">Settle up ({suggestedTransactions.length} payment{suggestedTransactions.length !== 1 ? "s" : ""})</h3>
      {suggestedTransactions.length === 0 ? (
        <p className="text-muted text-sm">Everyone&apos;s settled up. 🎉</p>
      ) : (
        <ul className="space-y-2">
          {suggestedTransactions.map((t) => {
            const key = `${t.fromUserId}-${t.toUserId}`;
            return (
              <li
                key={key}
                className="flex items-center justify-between bg-surfaceRaised rounded-card px-3.5 py-2.5 text-sm"
              >
                <span>
                  {t.fromUser?.name} → {t.toUser?.name}{" "}
                  <span className="text-muted">{formatCurrency(t.amount)}</span>
                </span>
                <button
                  onClick={() => handleSettle(t)}
                  disabled={settlingKey === key}
                  className="text-moss hover:text-mossBright text-xs font-medium disabled:opacity-60"
                >
                  {settlingKey === key ? "Recording…" : "Mark settled"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
