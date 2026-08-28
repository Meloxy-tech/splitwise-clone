import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { NewGroupForm } from "@/components/new-group-form";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  type GroupRow = (typeof groups)[number];

  return (
    <main className="min-h-screen">
      <Navbar userName={session.user.name ?? ""} />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">Your groups</h1>
          <NewGroupForm />
        </div>

        {groups.length === 0 ? (
          <div className="border border-dashed border-border rounded-card p-10 text-center">
            <p className="text-muted">
              No groups yet. Create one to start tracking shared expenses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group: GroupRow) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block bg-surface border border-border rounded-card p-5 hover:border-moss transition-colors"
              >
                <h2 className="font-display text-xl mb-1">{group.name}</h2>
                <p className="text-muted text-sm">
                  {group.members.length} member{group.members.length !== 1 ? "s" : ""} ·{" "}
                  {group._count.expenses} expense{group._count.expenses !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
