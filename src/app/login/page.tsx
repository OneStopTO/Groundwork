"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Log in</h1>
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
        <p className="text-sm text-black/60 dark:text-white/60 mt-6">
          No account yet?{" "}
          <Link href="/signup" className="text-emerald-700 dark:text-emerald-400 font-medium">
            Start free trial
          </Link>
        </p>
      </div>
    </main>
  );
}
