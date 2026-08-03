"use client";

import { posthog } from "@/instrumentation-client";
import { logoutAction } from "@/lib/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction} onSubmit={() => posthog.reset()}>
      <button
        className="min-h-[44px] px-1 hover:text-current"
        style={{ color: "var(--ink-muted)" }}
        type="submit"
      >
        Log out
      </button>
    </form>
  );
}
