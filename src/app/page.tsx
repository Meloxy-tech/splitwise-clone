import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="font-display text-lg tracking-tight">Ledger</span>
        <div className="flex gap-3 text-sm">
          <Link href="/login" className="px-4 py-2 text-muted hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-card bg-moss hover:bg-mossBright text-ink font-medium transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto">
        <p className="text-muted text-sm mb-4 tracking-wide uppercase">Shared expenses, settled fast</p>
        <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] mb-6 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
          Stop doing the math<br />in the group chat.
        </h1>
        <p className="text-muted text-lg mb-10 max-w-md">
          Log what everyone spent. Ledger works out who owes who, and reduces it to the fewest
          payments possible — no spreadsheet, no awkward reminders.
        </p>
        <Link
          href="/register"
          className="px-6 py-3 rounded-card bg-moss hover:bg-mossBright text-ink font-medium transition-all shadow-[0_0_15px_rgba(63,163,114,0.3)] hover:shadow-[0_0_25px_rgba(84,200,141,0.5)] hover:-translate-y-0.5"
        >
          Start a group — it&apos;s free
        </Link>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border max-w-4xl mx-auto w-full mb-16 rounded-card overflow-hidden border border-border">
        {[
          { title: "Log expenses", body: "Add what was spent and who paid — split evenly, exactly, or by percentage." },
          { title: "See balances", body: "Every member's running total, updated the moment an expense is added." },
          { title: "Settle smart", body: "A minimum-transaction algorithm turns a tangle of debts into a short list." },
        ].map((f) => (
          <div key={f.title} className="bg-surface p-6">
            <h3 className="font-display text-lg mb-2">{f.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
