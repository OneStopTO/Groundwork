"use client";

import { useEffect } from "react";
import { posthog } from "@/instrumentation-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex-1 flex items-center justify-center px-6 py-24 text-center">
          <div>
            <p className="text-lg font-medium mb-2">Something went wrong.</p>
            <button
              onClick={reset}
              className="rounded-md bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
