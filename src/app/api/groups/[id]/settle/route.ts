import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isGroupMember } from "@/lib/authorize-group";
import { settleSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  if (!(await isGroupMember(params.id, userId))) {
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = settleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { fromUserId, toUserId, amount } = parsed.data;

  if (fromUserId === toUserId) {
    return NextResponse.json({ error: "Cannot settle with yourself" }, { status: 400 });
  }
  if (!(await isGroupMember(params.id, fromUserId)) || !(await isGroupMember(params.id, toUserId))) {
    return NextResponse.json({ error: "Both users must be members of this group" }, { status: 400 });
  }

  const settlement = await prisma.settlement.create({
    data: { groupId: params.id, fromUserId, toUserId, amount },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ settlement }, { status: 201 });
}
