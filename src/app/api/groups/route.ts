import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { createGroupSchema } from "@/lib/validations";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, memberEmails } = parsed.data;

  // Resolve invited emails to existing users; silently skip ones that
  // don't have an account yet (a real product would send an invite email —
  // out of scope for this build).
  const invitedUsers =
    memberEmails.length > 0
      ? await prisma.user.findMany({
          where: { email: { in: memberEmails.map((e) => e.toLowerCase().trim()) } },
          select: { id: true },
        })
      : [];

  type InvitedUserRow = (typeof invitedUsers)[number];
  const memberIds = Array.from(new Set([userId, ...invitedUsers.map((u: InvitedUserRow) => u.id)]));

  const group = await prisma.group.create({
    data: {
      name,
      createdBy: userId,
      members: { create: memberIds.map((id) => ({ userId: id })) },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
