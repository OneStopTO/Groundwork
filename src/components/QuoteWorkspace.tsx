"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectType } from "@prisma/client";
import { saveQuoteAction, markSentAction } from "@/lib/actions";
import { defaultProposalCopy } from "@/lib/proposal";

interface Row {
  id: string;
  kind: "MATERIAL" | "LABOR";
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function QuoteWorkspace({
  jobId,
  shareToken,
  jobStatus,
  materialNames,
  initialLineItems,
  initialMarginPct,
  initialCopy,
  roiLowPct,
  roiHighPct,
  hasSavedQuote,
  businessName,
  projectType,
  clientName,
}: {
  jobId: string;
  shareToken: string;
  jobStatus: string;
  materialNames: string[];
  initialLineItems: Row[];
  initialMarginPct: number;
  initialCopy: { headline: string; message: string; closingCta: string };
  roiLowPct: number;
  roiHighPct: number;
  hasSavedQuote: boolean;
  businessName: string | null;
  projectType: ProjectType;
  clientName: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialLineItems);
  const [marginPctPct, setMarginPctPct] = useState(Math.round(initialMarginPct * 100));
  const [copy, setCopy] = useState(initialCopy);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(hasSavedQuote);
  const [copiedLink, setCopiedLink] = useState(false);

  const totals = useMemo(() => {
    const materialTotal = rows
      .filter((r) => r.kind === "MATERIAL")
      .reduce((s, r) => s + r.quantity * r.unitCost, 0);
    const laborTotal = rows
      .filter((r) => r.kind === "LABOR")
      .reduce((s, r) => s + r.quantity * r.unitCost, 0);
    const subtotal = materialTotal + laborTotal;
    const marginAmount = subtotal * (marginPctPct / 100);
    const total = subtotal + marginAmount;
    return { materialTotal, laborTotal, subtotal, marginAmount, total };
  }, [rows, marginPctPct]);

  const addRow = (kind: "MATERIAL" | "LABOR") => {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        kind,
        description: kind === "MATERIAL" ? materialNames[0] ?? "" : "Labor",
        quantity: 0,
        unit: "sqft",
        unitCost: 0,
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveQuoteAction(jobId, {
        lineItems: [
          ...rows.map((r) => ({
            kind: r.kind,
            description: r.description,
            quantity: r.quantity,
            unit: r.unit,
            unitCost: r.unitCost,
          })),
          {
            kind: "MARGIN" as const,
            description: `Margin (${marginPctPct}%)`,
            quantity: 1,
            unit: "job",
            unitCost: totals.marginAmount,
          },
        ],
        marginPct: marginPctPct / 100,
        proposalHeadline: copy.headline,
        proposalMessage: copy.message,
        proposalClosingCta: copy.closingCta,
        roiLowPct,
        roiHighPct,
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const proposalPath = `/proposal/${shareToken}`;
  const [proposalOrigin, setProposalOrigin] = useState("");
  useEffect(() => {
    setProposalOrigin(window.location.origin);
  }, []);
  const proposalUrl = `${proposalOrigin}${proposalPath}`;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Itemized quote</h2>
          <div className="flex gap-2">
            <button
              onClick={() => addRow("MATERIAL")}
              className="text-sm rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              + Material line
            </button>
            <button
              onClick={() => addRow("LABOR")}
              className="text-sm rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              + Labor line
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.05] text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium w-24">Qty</th>
                <th className="px-3 py-2 font-medium w-20">Unit</th>
                <th className="px-3 py-2 font-medium w-28">Unit cost</th>
                <th className="px-3 py-2 font-medium w-28 text-right">Line total</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2 text-xs text-black/50 dark:text-white/50">
                    {row.kind === "MATERIAL" ? "Material" : "Labor"}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      list={row.kind === "MATERIAL" ? "material-names" : undefined}
                      className="w-full bg-transparent border-b border-black/10 dark:border-white/15 px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) })}
                      className="w-full bg-transparent border-b border-black/10 dark:border-white/15 px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                      className="w-full bg-transparent border-b border-black/10 dark:border-white/15 px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.unitCost}
                      onChange={(e) => updateRow(row.id, { unitCost: Number(e.target.value) })}
                      className="w-full bg-transparent border-b border-black/10 dark:border-white/15 px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(row.quantity * row.unitCost)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                    No line items yet — add materials and labor above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <datalist id="material-names">
            {materialNames.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          <div className="flex justify-between w-64">
            <span className="text-black/60 dark:text-white/60">Materials</span>
            <span>{formatCurrency(totals.materialTotal)}</span>
          </div>
          <div className="flex justify-between w-64">
            <span className="text-black/60 dark:text-white/60">Labor</span>
            <span>{formatCurrency(totals.laborTotal)}</span>
          </div>
          <div className="flex justify-between items-center w-64">
            <span className="text-black/60 dark:text-white/60">Margin</span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                value={marginPctPct}
                onChange={(e) => setMarginPctPct(Number(e.target.value))}
                className="w-14 bg-transparent border-b border-black/10 dark:border-white/15 text-right"
              />
              % = {formatCurrency(totals.marginAmount)}
            </span>
          </div>
          <div className="flex justify-between w-64 font-semibold text-base border-t border-black/10 dark:border-white/10 pt-1 mt-1">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Client proposal template</h2>
          <button
            type="button"
            onClick={() =>
              setCopy(
                defaultProposalCopy(businessName, projectType, clientName, totals.total)
              )
            }
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Regenerate from current total
          </button>
        </div>
        <p className="text-sm text-black/60 dark:text-white/60 mb-3">
          Pre-filled with investment/ROI framing so you don&apos;t have to
          write your own pitch. Edit as needed — the client sees exactly
          this.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Headline</label>
            <input
              value={copy.headline}
              onChange={(e) => setCopy((c) => ({ ...c, headline: e.target.value }))}
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Investment message (ROI framing)
            </label>
            <textarea
              value={copy.message}
              onChange={(e) => setCopy((c) => ({ ...c, message: e.target.value }))}
              rows={4}
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Closing call-to-action</label>
            <textarea
              value={copy.closingCta}
              onChange={(e) => setCopy((c) => ({ ...c, closingCta: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-emerald-700 text-white px-5 py-2.5 font-medium hover:bg-emerald-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save quote & proposal"}
        </button>

        {saved && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-black/60 dark:text-white/60">Client link:</span>
              <code className="bg-black/5 dark:bg-white/10 rounded px-2 py-1 text-xs">
                {proposalUrl}
              </code>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(proposalUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 1500);
                }}
                className="text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>
            {jobStatus !== "SENT" && jobStatus !== "ACCEPTED" && (
              <button
                onClick={async () => {
                  await markSentAction(jobId);
                  router.refresh();
                }}
                className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                Mark as sent to client
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
