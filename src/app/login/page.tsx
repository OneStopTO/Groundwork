"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 contour-field">
      <div className="animate-rise-in w-full max-w-sm rounded-2xl border p-8 shadow-lg shadow-black/5" style={{ borderColor: "var(--stone-border)", background: "var(--background-raised)" }}>
        <p className="font-mono text-xs tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400 mb-3">
          Welcome back
        </p>
        <h1 className="font-display text-2xl mb-1">Log in</h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
          Pick up right where you left off — your jobs, designs, and price
          book are all here.
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="text-sm mt-6" style={{ color: "var(--ink-muted)" }}>
          No account yet?{" "}
          <Link href="/signup" className="text-emerald-700 dark:text-emerald-400 font-medium">
            Start free trial
          </Link>
        </p>
      </div>
    </main>
  );
}
