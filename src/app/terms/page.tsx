import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-16">
      <p className="text-sm mb-8" style={{ color: "var(--ink-muted)" }}>
        <Link href="/" className="underline">
          ← GroundWork
        </Link>
      </p>
      <h1 className="font-display text-3xl mb-2">Terms of Service</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-muted)" }}>
        Last updated: draft — not yet reviewed by a lawyer. Replace this
        notice once it has been.
      </p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        <section>
          <h2 className="font-display text-lg mb-2">1. What GroundWork is</h2>
          <p>
            GroundWork is a design and quoting tool for landscaping and
            hardscaping contractors. By creating an account you agree to
            these terms. If you&apos;re using GroundWork on behalf of a
            business, you&apos;re agreeing on that business&apos;s behalf.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">2. Your account</h2>
          <p>
            You&apos;re responsible for keeping your login credentials
            secure and for all activity under your account. Tell us right
            away if you suspect unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">3. Subscriptions & billing</h2>
          <p>
            Paid plans renew automatically each billing period until
            canceled. You can cancel or change plans anytime from Settings;
            cancellation takes effect at the end of the current billing
            period. Fees are non-refundable except where required by law.
            Payment is processed by Stripe — GroundWork never sees or
            stores your card details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">4. Your data</h2>
          <p>
            You own the job, client, and pricing data you put into
            GroundWork. You&apos;re responsible for having the right to
            store any client information (names, contact details, property
            photos) you enter. See the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            for how we handle it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">5. Acceptable use</h2>
          <p>
            Don&apos;t use GroundWork to store or transmit anything illegal,
            to attempt to disrupt the service, or to try to access other
            contractors&apos; accounts or data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">6. Quotes & proposals are estimates</h2>
          <p>
            Material sizing, textures, and 3D previews in GroundWork are
            visual aids and estimates — pricing, quantities, and
            measurements should be verified against real supplier quotes
            and on-site measurements before being relied on for a signed
            contract. GroundWork isn&apos;t responsible for pricing
            decisions made using the tool.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">7. Service &quot;as is&quot;</h2>
          <p>
            GroundWork is provided as-is, without warranties of any kind. We
            don&apos;t guarantee the service will be uninterrupted or
            error-free. To the extent permitted by law, GroundWork isn&apos;t
            liable for indirect or consequential damages arising from your
            use of the service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">8. Changes</h2>
          <p>
            We may update these terms from time to time. Continuing to use
            GroundWork after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">9. Contact</h2>
          <p>Questions about these terms — add a real contact email here.</p>
        </section>
      </div>
    </main>
  );
}
