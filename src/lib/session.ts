import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Returns the authenticated user's id, or null if there isn't one.
 * Use `requireUserId` in routes where an anonymous request should 401.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function requireUserId(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { userId: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId, error: null };
}
