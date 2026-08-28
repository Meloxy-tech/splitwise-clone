import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isGroupMember } from "@/lib/authorize-group";
import { createExpenseSchema } from "@/lib/validations";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  if (!(await isGroupMember(params.id, userId))) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const expenses = await prisma.expense.findMany({
    where: { groupId: params.id },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  if (!(await isGroupMember(params.id, userId))) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { description, amount, paidById, splitType, date, notes, splits } = parsed.data;

  // The payer must actually be a group member.
  if (!(await isGroupMember(params.id, paidById))) {
    return NextResponse.json({ error: "Payer must be a member of this group" }, { status: 400 });
  }

  const members = await prisma.groupMember.findMany({ where: { groupId: params.id } });
  type MemberRow = (typeof members)[number];
  const memberIds: string[] = members.map((m: MemberRow) => m.userId);

  let computedSplits: { userId: string; shareAmount: number }[];

  if (splitType === "EQUAL") {
    const share = round2(amount / memberIds.length);
    // Give any rounding remainder to the payer so shares always sum exactly to `amount`.
    const remainder = round2(amount - share * memberIds.length);
    computedSplits = memberIds.map((id: string) => ({
      userId: id,
      shareAmount: id === paidById ? round2(share + remainder) : share,
    }));
  } else if (splitType === "EXACT") {
    if (!splits) return NextResponse.json({ error: "Splits are required" }, { status: 400 });
    const total = round2(splits.reduce((sum, s) => sum + s.value, 0));
    if (Math.abs(total - amount) > 0.01) {
      return NextResponse.json(
        { error: `Split amounts (${total}) must add up to the total (${amount})` },
        { status: 400 }
      );
    }
    for (const s of splits) {
      if (!memberIds.includes(s.userId)) {
        return NextResponse.json({ error: "Split includes a non-member" }, { status: 400 });
      }
    }
    computedSplits = splits.map((s) => ({ userId: s.userId, shareAmount: round2(s.value) }));
  } else {
    // PERCENTAGE
    if (!splits) return NextResponse.json({ error: "Splits are required" }, { status: 400 });
    const totalPct = round2(splits.reduce((sum, s) => sum + s.value, 0));
    if (Math.abs(totalPct - 100) > 0.01) {
      return NextResponse.json({ error: `Percentages must add up to 100 (got ${totalPct})` }, { status: 400 });
    }
    for (const s of splits) {
      if (!memberIds.includes(s.userId)) {
        return NextResponse.json({ error: "Split includes a non-member" }, { status: 400 });
      }
    }
    computedSplits = splits.map((s) => ({ userId: s.userId, shareAmount: round2((amount * s.value) / 100) }));
  }

  const expense = await prisma.expense.create({
    data: {
      groupId: params.id,
      paidById,
      description,
      amount,
      splitType,
      date: date ? new Date(date) : new Date(),
      notes,
      splits: { create: computedSplits },
    },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  await prisma.group.update({ where: { id: params.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ expense }, { status: 201 });
}
