/**
 * Debt simplification.
 *
 * Given each member's net balance in a group (positive = owed money,
 * negative = owes money), produce the minimum-ish set of transactions
 * that settles everyone up.
 *
 * Approach: greedy max-debtor-to-max-creditor matching. This does not
 * always find the mathematically optimal minimum (that's NP-hard in
 * general), but it's a well-known, easy-to-explain heuristic that gets
 * very close to optimal in practice and runs in O(n log n).
 */

export interface Balance {
  userId: string;
  amount: number; // positive: is owed money, negative: owes money
}

export interface Transaction {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

const EPSILON = 0.01; // ignore balances under 1 cent — floating point noise

export function simplifyDebts(balances: Balance[]): Transaction[] {
  // Work on a copy so we never mutate the caller's data.
  const debtors: Balance[] = [];
  const creditors: Balance[] = [];

  for (const b of balances) {
    const amount = round2(b.amount);
    if (amount < -EPSILON) {
      debtors.push({ userId: b.userId, amount });
    } else if (amount > EPSILON) {
      creditors.push({ userId: b.userId, amount });
    }
  }

  const transactions: Transaction[] = [];

  // Use simple arrays as mutable heaps; group sizes here are small
  // (a handful to a few dozen people), so O(n^2) is fine.
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort((a, b) => a.amount - b.amount); // most negative first
    creditors.sort((a, b) => b.amount - a.amount); // most positive first

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settleAmount = round2(Math.min(-debtor.amount, creditor.amount));

    if (settleAmount > EPSILON) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settleAmount,
      });
    }

    debtor.amount = round2(debtor.amount + settleAmount);
    creditor.amount = round2(creditor.amount - settleAmount);

    if (Math.abs(debtor.amount) <= EPSILON) debtors.shift();
    if (Math.abs(creditor.amount) <= EPSILON) creditors.shift();
  }

  return transactions;
}

/**
 * Turns a list of expenses + splits into net balances per user.
 * balance[user] = (total they paid) - (total they owe across all splits)
 */
export function computeBalances(
  expenses: { paidById: string; amount: number }[],
  splits: { userId: string; shareAmount: number; expensePaidById: string }[]
): Balance[] {
  const net = new Map<string, number>();

  for (const e of expenses) {
    net.set(e.paidById, round2((net.get(e.paidById) ?? 0) + e.amount));
  }
  for (const s of splits) {
    net.set(s.userId, round2((net.get(s.userId) ?? 0) - s.shareAmount));
  }

  return Array.from(net.entries()).map(([userId, amount]) => ({ userId, amount }));
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
