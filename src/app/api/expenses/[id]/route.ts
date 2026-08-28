import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const expense = await prisma.expense.findUnique({
    where: { id: params.id },
    include: { group: true },
  });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  const canDelete = expense.paidById === userId || expense.group.createdBy === userId;
  if (!canDelete) {
    return NextResponse.json(
      { error: "Only the person who paid or the group creator can delete this expense" },
      { status: 403 }
    );
  }

  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
