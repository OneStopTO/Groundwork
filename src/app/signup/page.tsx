"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">Start your free trial</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">
          14 days, full access. See your first quote before you pick a plan.
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Work email
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
              minLength={8}
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
            <p className="text-xs text-black/50 dark:text-white/50 mt-1">
              At least 8 characters.
            </p>
          </div>
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Create free account"}
          </button>
        </form>
        <p className="text-sm text-black/60 dark:text-white/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-700 dark:text-emerald-400 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
