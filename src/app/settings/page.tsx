import Link from "next/link";
import { requireContractor } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import {
  updatePriceBookItemAction,
  addPriceBookItemAction,
  deletePriceBookItemAction,
} from "@/lib/actions";
import { PROJECT_TYPE_LABELS } from "@/lib/pricing";
import { effectiveTierLabel } from "@/lib/tiers";

export default async function SettingsPage() {
  const contractor = await requireContractor();
  const priceBook = await prisma.priceBookItem.findMany({
    where: { contractorId: contractor.id },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });

  const materials = priceBook.filter((p) => p.kind === "MATERIAL");
  const labor = priceBook.filter((p) => p.kind === "LABOR");

  return (
    <>
      <TopNav contractor={contractor} />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Settings</h1>
          <p className="text-black/60 dark:text-white/60">
            {contractor.businessName || "Your business"} ·{" "}
            {effectiveTierLabel(contractor)} ·{" "}
            <Link href="/pricing" className="underline">
              change plan
            </Link>
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-1">Material price book</h2>
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            Price per unit used to generate quotes from your designs. Add
            your own materials (e.g. a specific paver product) alongside the
            defaults.
          </p>
          <PriceTable items={materials} />
          <AddItemForm kind="MATERIAL" />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Labor rates</h2>
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            Priced per sqft of finished area, by project type.
          </p>
          <PriceTable items={labor} />
          <AddItemForm kind="LABOR" />
        </section>
      </main>
    </>
  );
}

function PriceTable({
  items,
}: {
  items: Array<{
    id: string;
    name: string;
    unit: string;
    unitCost: number;
    projectType: string | null;
  }>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 dark:border-white/15 px-4 py-6 text-center text-sm text-black/50 dark:text-white/50">
        No items yet — add one below.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <form action={updatePriceBookItemAction} className="flex items-center gap-4 flex-1">
            <input type="hidden" name="id" value={item.id} />
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-black/50 dark:text-white/50">
                per {item.unit}
                {item.projectType
                  ? ` · ${PROJECT_TYPE_LABELS[item.projectType as keyof typeof PROJECT_TYPE_LABELS]}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-black/50 dark:text-white/50">$</span>
              <input
                type="number"
                name="unitCost"
                step="0.01"
                min="0"
                defaultValue={item.unitCost}
                className="w-24 rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Save
              </button>
            </div>
          </form>
          <form action={deletePriceBookItemAction}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
              title="Remove from price book"
            >
              Remove
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}

function AddItemForm({ kind }: { kind: "MATERIAL" | "LABOR" }) {
  return (
    <form
      action={addPriceBookItemAction}
      className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-black/15 dark:border-white/15 px-4 py-3"
    >
      <input type="hidden" name="kind" value={kind} />
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium mb-1">
          {kind === "MATERIAL" ? "Material name" : "Labor rate name"}
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder={kind === "MATERIAL" ? "e.g. Belgard Mega Bergerac" : "e.g. Premium Crew Labor"}
          className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium mb-1">Unit</label>
        <input
          name="unit"
          type="text"
          defaultValue="sqft"
          className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium mb-1">$ / unit</label>
        <input
          name="unitCost"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
        />
      </div>
      {kind === "LABOR" && (
        <div className="w-40">
          <label className="block text-xs font-medium mb-1">Project type</label>
          <select
            name="projectType"
            defaultValue=""
            className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="">Any / general</option>
            {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        className="rounded-md bg-emerald-700 text-white px-3 py-1.5 text-sm font-medium hover:bg-emerald-800"
      >
        + Add
      </button>
    </form>
  );
}
