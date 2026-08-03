import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentContractor } from "@/lib/session";
import { TIERS } from "@/lib/tiers";
import { HeroCanvas } from "@/components/HeroCanvas";

const STEPS = [
  {
    n: "01",
    title: "Walk the property",
    body: "Enter the client, the dimensions, a photo if you've got one.",
  },
  {
    n: "02",
    title: "Draw the layout",
    body: "Sketch patios, walkways, beds and walls to scale, with real material textures.",
  },
  {
    n: "03",
    title: "Send the proposal",
    body: "One link, framed as a property investment — not just a price.",
  },
];

export default async function LandingPage() {
  const contractor = await getCurrentContractor();
  if (contractor) redirect("/dashboard");

  return (
    <>
    <main className="flex-1">
      <section className="relative overflow-hidden contour-field">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
          <div>
            <p
              className="animate-rise-in font-mono text-xs tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400 mb-5 flex items-center gap-2"
              style={{ animationDelay: "0ms" }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-800 dark:bg-amber-300" />
              For landscaping &amp; hardscaping companies
            </p>
            <h1
              className="animate-rise-in text-5xl sm:text-6xl leading-[1.05] tracking-tight mb-6"
              style={{ animationDelay: "60ms" }}
            >
              From walkthrough to a{" "}
              <span className="italic text-emerald-700 dark:text-emerald-400">
                designed, priced
              </span>{" "}
              proposal — before you leave the truck.
            </h1>
            <p
              className="animate-rise-in text-lg leading-relaxed max-w-xl mb-9"
              style={{ color: "var(--ink-muted)", animationDelay: "120ms" }}
            >
              Stop losing jobs to premium competitors who overcharge and cheap
              crews who underdeliver. Sketch the layout, get an accurate
              quote, and send a proposal that sells the project as an
              investment in your client&apos;s property — not just a cost.
            </p>
            <div
              className="animate-rise-in flex flex-wrap items-center gap-4"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                href="/signup"
                className="rounded-md bg-emerald-700 text-white px-6 py-3.5 font-medium hover:bg-emerald-800 shadow-[0_1px_0_rgba(0,0,0,0.15)]"
              >
                Start free — see your first quote before you pay
              </Link>
              <Link
                href="/login"
                className="rounded-md px-6 py-3.5 font-medium border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: "var(--stone-border)" }}
              >
                Log in
              </Link>
            </div>
            <p
              className="animate-rise-in font-mono text-xs mt-5"
              style={{ color: "var(--ink-muted)", animationDelay: "220ms" }}
            >
              14-day free trial, full access. No card required.
            </p>
          </div>

          <div
            className="animate-rise-in rounded-2xl border p-3 shadow-xl shadow-black/5 bg-[var(--background-raised)]"
            style={{ borderColor: "var(--stone-border)", animationDelay: "140ms" }}
          >
            <HeroCanvas />
            <p className="font-mono text-[11px] text-center mt-2" style={{ color: "var(--ink-muted)" }}>
              — drawn to scale in GroundWork, not a stock photo —
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 border-t" style={{ borderColor: "var(--stone-border)" }}>
        <div className="grid sm:grid-cols-3 gap-10">
          {STEPS.map((step) => (
            <div key={step.n}>
              <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400 mb-3">
                {step.n}
              </p>
              <h3 className="font-display text-xl mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="text-center mb-12">
          <p className="font-mono text-xs tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400 mb-3">
            Plans
          </p>
          <h2 className="font-display text-3xl">
            Pick a plan later — try the whole thing first
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-xl border p-7 flex flex-col ${
                tier.highlight
                  ? "shadow-lg shadow-black/5 sm:scale-[1.02] bg-[var(--background-raised)]"
                  : "bg-[var(--background-raised)]"
              }`}
              style={{
                borderColor: tier.highlight ? "var(--foreground)" : "var(--stone-border)",
                borderWidth: tier.highlight ? 1.5 : 1,
              }}
            >
              {tier.highlight && (
                <span className="font-mono text-[11px] font-semibold tracking-wide text-amber-800 dark:text-amber-300 mb-2">
                  MOST POPULAR
                </span>
              )}
              <h3 className="font-display text-xl">{tier.name}</h3>
              <p className="font-mono text-2xl mt-2 mb-1">{tier.price}</p>
              <p className="text-sm mb-5" style={{ color: "var(--ink-muted)" }}>
                {tier.tagline}
              </p>
              <ul className="text-sm space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
    <footer
      className="border-t py-8"
      style={{ borderColor: "var(--stone-border)" }}
    >
      <div
        className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4 text-sm"
        style={{ color: "var(--ink-muted)" }}
      >
        <span>© {new Date().getFullYear()} GroundWork</span>
        <div className="flex gap-5">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
    </>
  );
}
