import { PostHog } from "posthog-node";

let client: PostHog | null = null;

/** Lazily-created singleton server-side PostHog client for use in server actions. */
export function posthogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/** Captures an event and flushes immediately — server actions don't stay alive to flush on a timer. */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = posthogServer();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  await ph.flush();
}
