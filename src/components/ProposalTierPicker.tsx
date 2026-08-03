"use client";

import { useState } from "react";
import { acceptProposalAction } from "@/lib/actions";

interface Option {
  id: string;
  name: string;
  description: string;
  priceDelta: number;
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function ProposalTierPicker({
  shareToken,
  baseTotal,
  options,
  alreadyAccepted,
  acceptedOptionName,
}: {
  shareToken: string;
  baseTotal: number;
  options: Option[];
  alreadyAccepted: boolean;
  acceptedOptionName: string | null;
}) {
  const [selected, setSelected] = useState<string>("base");

  const tiers = [
    { id: "base", name: "Essential", description: "As detailed above.", priceDelta: 0 },
    ...options,
  ];
  const current = tiers.find((t) => t.id === selected) ?? tiers[0];
  const currentTotal = baseTotal + current.priceDelta;

  if (alreadyAccepted) {
    const acceptedTier = tiers.find((t) => t.name === acceptedOptionName) ?? tiers[0];
    return (
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {tiers.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border p-5"
            style={{
              borderColor: t.id === acceptedTier.id ? "#2f4a34" : "var(--stone-border)",
              borderWidth: t.id === acceptedTier.id ? 1.5 : 1,
              background: "var(--background-raised)",
            }}
          >
            {t.id === acceptedTier.id && (
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
                Selected
              </p>
            )}
            <h3 className="font-display text-lg mb-1">{t.name}</h3>
            <p className="text-sm mb-3" style={{ color: "var(--ink-muted)" }}>
              {t.description}
            </p>
            <p className="font-mono text-xl">{formatCurrency(baseTotal + t.priceDelta)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        {tiers.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            className="text-left rounded-xl border p-5 transition-colors"
            style={{
              borderColor: t.id === selected ? "#2f4a34" : "var(--stone-border)",
              borderWidth: t.id === selected ? 1.5 : 1,
              background: "var(--background-raised)",
            }}
          >
            {t.id === selected && (
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
                Selected
              </p>
            )}
            <h3 className="font-display text-lg mb-1">{t.name}</h3>
            <p className="text-sm mb-3" style={{ color: "var(--ink-muted)" }}>
              {t.description}
            </p>
            <p className="font-mono text-xl">{formatCurrency(baseTotal + t.priceDelta)}</p>
          </button>
        ))}
      </div>

      <form action={acceptProposalAction}>
        <input type="hidden" name="shareToken" value={shareToken} />
        <input type="hidden" name="optionName" value={current.id === "base" ? "" : current.name} />
        <input type="hidden" name="acceptedTotal" value={currentTotal} />
        <button
          type="submit"
          className="rounded-md bg-emerald-700 text-white px-6 py-3 font-medium hover:bg-emerald-800"
        >
          Accept the {current.name} option — {formatCurrency(currentTotal)}
        </button>
      </form>
    </div>
  );
}
