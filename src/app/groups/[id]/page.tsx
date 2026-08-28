import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { AddExpenseForm } from "@/components/add-expense-form";
import { ExpenseList } from "@/components/expense-list";
import { BalancesPanel } from "@/components/balances-panel";
import { AddMemberForm } from "@/components/add-member-form";
import { computeBalances, simplifyDebts } from "@/lib/debt-simplify";

export default async function GroupPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      expenses: {
        include: { paidBy: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
      },
      settlements: true,
    },
  });

  if (!group) notFound();
  type MemberRow = (typeof group.members)[number];
  type ExpenseRow = (typeof group.expenses)[number];
  type SettlementRow = (typeof group.settlements)[number];

  const isMember = group.members.some((m: MemberRow) => m.userId === userId);
  if (!isMember) redirect("/dashboard");

  const splits = await prisma.expenseSplit.findMany({
    where: { expense: { groupId: group.id } },
    select: { userId: true, shareAmount: true, expense: { select: { paidById: true } } },
  });
  type SplitRow = (typeof splits)[number];

  const rawBalances = computeBalances(
    group.expenses.map((e: ExpenseRow) => ({ paidById: e.paidById, amount: Number(e.amount) })),
    splits.map((s: SplitRow) => ({
      userId: s.userId,
      shareAmount: Number(s.shareAmount),
      expensePaidById: s.expense.paidById,
    }))
  );

  const balanceMap = new Map(rawBalances.map((b) => [b.userId, b.amount]));
  for (const m of group.members as MemberRow[]) if (!balanceMap.has(m.userId)) balanceMap.set(m.userId, 0);
  for (const s of group.settlements as SettlementRow[]) {
    const amount = Number(s.amount);
    balanceMap.set(s.fromUserId, (balanceMap.get(s.fromUserId) ?? 0) + amount);
    balanceMap.set(s.toUserId, (balanceMap.get(s.toUserId) ?? 0) - amount);
  }

  const balances = Array.from(balanceMap.entries()).map(([uid, amount]) => ({
    userId: uid,
    amount,
    user: (group.members as MemberRow[]).find((m) => m.userId === uid)?.user,
  }));

  const suggestedTransactions = simplifyDebts(
    balances.map((b) => ({ userId: b.userId, amount: b.amount }))
  ).map((t) => ({
    ...t,
    fromUser: (group.members as MemberRow[]).find((m) => m.userId === t.fromUserId)?.user,
    toUser: (group.members as MemberRow[]).find((m) => m.userId === t.toUserId)?.user,
  }));

  return (
    <main className="min-h-screen">
      <Navbar userName={session.user.name ?? ""} />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="text-muted text-sm hover:text-white transition-colors">
          ← All groups
        </Link>
        <div className="flex items-center justify-between mt-2 mb-8">
          <div>
            <h1 className="font-display text-3xl">{group.name}</h1>
            <p className="text-muted text-sm mt-1">
              {group.members.map((m: MemberRow) => m.user.name).join(", ")}
            </p>
            <AddMemberForm groupId={group.id} />
          </div>
          <AddExpenseForm groupId={group.id} members={group.members} currentUserId={userId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div>
            <h2 className="font-display text-lg mb-3">Expenses</h2>
            <ExpenseList
              expenses={group.expenses.map(e => ({ ...e, amount: Number(e.amount) }))}
              canDeleteId={userId}
            />
          </div>
          <BalancesPanel groupId={group.id} balances={balances} suggestedTransactions={suggestedTransactions} />
        </div>
      </div>
    </main>
  );
}
