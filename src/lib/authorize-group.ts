import { prisma } from "@/lib/prisma";

/** Returns true if the given user is a member of the given group. */
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership !== null;
}
