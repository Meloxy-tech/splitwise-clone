"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function Navbar({ userName }: { userName: string }) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border max-w-5xl mx-auto">
      <Link href="/dashboard" className="font-display text-lg">
        Ledger
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-muted hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
