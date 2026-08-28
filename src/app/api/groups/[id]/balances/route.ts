import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isGroupMember } from "@/lib/authorize-group";
import { computeBalances, simplifyDebts } from "@/lib/debt-simplify";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  if (!(await isGroupMember(params.id, userId))) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const [members, expenses, splits, settlements] = await Promise.all([
    prisma.groupMember.findMany({
      where: { groupId: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.expense.findMany({ where: { groupId: params.id }, select: { paidById: true, amount: true } }),
    prisma.expenseSplit.findMany({
      where: { expense: { groupId: params.id } },
      select: { userId: true, shareAmount: true, expense: { select: { paidById: true } } },
    }),
    prisma.settlement.findMany({ where: { groupId: params.id } }),
  ]);

  type MemberRow = (typeof members)[number];
  type ExpenseRow = (typeof expenses)[number];
  type SplitRow = (typeof splits)[number];
  type SettlementRow = (typeof settlements)[number];

  const balances = computeBalances(
    expenses.map((e: ExpenseRow) => ({ paidById: e.paidById, amount: Number(e.amount) })),
    splits.map((s: SplitRow) => ({
      userId: s.userId,
      shareAmount: Number(s.shareAmount),
      expensePaidById: s.expense.paidById,
    }))
  );

  // Apply recorded settlements on top of the expense-derived balances:
  // a settlement from A to B reduces what A owes (raises A's balance)
  // and reduces what B is owed (lowers B's balance).
  const balanceMap = new Map(balances.map((b) => [b.userId, b.amount]));
  for (const member of members as MemberRow[]) {
    if (!balanceMap.has(member.userId)) balanceMap.set(member.userId, 0);
  }
  for (const s of settlements as SettlementRow[]) {
    const amount = Number(s.amount);
    balanceMap.set(s.fromUserId, (balanceMap.get(s.fromUserId) ?? 0) + amount);
    balanceMap.set(s.toUserId, (balanceMap.get(s.toUserId) ?? 0) - amount);
  }

  const finalBalances = Array.from(balanceMap.entries()).map(([uid, amount]) => ({
    userId: uid,
    amount,
    user: (members as MemberRow[]).find((m) => m.userId === uid)?.user,
  }));

  const suggestedTransactions = simplifyDebts(
    finalBalances.map((b) => ({ userId: b.userId, amount: b.amount }))
  ).map((t) => ({
    ...t,
    fromUser: (members as MemberRow[]).find((m) => m.userId === t.fromUserId)?.user,
    toUser: (members as MemberRow[]).find((m) => m.userId === t.toUserId)?.user,
  }));

  return NextResponse.json({ balances: finalBalances, suggestedTransactions });
}
