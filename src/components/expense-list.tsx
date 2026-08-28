"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

type Expense = {
  id: string;
  description: string;
  amount: number | string;
  date: string | Date;
  paidBy: { id: string; name: string };
  splitType: string;
};

export function ExpenseList({ expenses, canDeleteId }: { expenses: Expense[]; canDeleteId: string }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  if (expenses.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-card p-8 text-center">
        <p className="text-muted text-sm">No expenses logged yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {expenses.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between bg-surface border border-border rounded-card px-4 py-3"
        >
          <div>
            <p className="font-medium">{e.description}</p>
            <p className="text-muted text-xs">
              {e.paidBy.name} paid · {new Date(e.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">{formatCurrency(Number(e.amount))}</span>
            {(e.paidBy.id === canDeleteId) && (
              <button
                onClick={() => handleDelete(e.id)}
                disabled={deletingId === e.id}
                className="text-muted hover:text-owe text-xs disabled:opacity-60"
              >
                {deletingId === e.id ? "…" : "Delete"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
