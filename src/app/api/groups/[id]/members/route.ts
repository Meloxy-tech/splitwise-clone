import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isGroupMember } from "@/lib/authorize-group";

const addMemberSchema = z.object({ email: z.string().email() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  if (!(await isGroupMember(params.id, userId))) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });
  if (!invitee) {
    return NextResponse.json(
      { error: "No account found with that email — they need to sign up first" },
      { status: 404 }
    );
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: invitee.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member of this group" }, { status: 409 });
  }

  const member = await prisma.groupMember.create({
    data: { groupId: params.id, userId: invitee.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ member }, { status: 201 });
}
