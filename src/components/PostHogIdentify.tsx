"use client";

import { useEffect } from "react";
import { posthog } from "@/instrumentation-client";

export function PostHogIdentify({
  contractorId,
  email,
}: {
  contractorId: string;
  email: string;
}) {
  useEffect(() => {
    posthog.identify(contractorId, { email });
  }, [contractorId, email]);

  return null;
}
