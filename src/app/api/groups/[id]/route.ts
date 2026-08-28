import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isGroupMember } from "@/lib/authorize-group";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  if (!(await isGroupMember(params.id, userId))) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      expenses: {
        include: {
          paidBy: { select: { id: true, name: true } },
          splits: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { date: "desc" },
      },
      settlements: {
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
        orderBy: { settledAt: "desc" },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  return NextResponse.json({ group });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  if (group.createdBy !== userId) {
    return NextResponse.json({ error: "Only the group creator can delete this group" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
