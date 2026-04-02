import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollText, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="font-display text-lg font-semibold text-gold mb-3">
        {title}
      </h3>
      <div className="text-muted-foreground text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

const BUSINESS_NAME = "Chosen One Distribution";
const CONTACT_EMAIL = "ChosenOneProductions901@gmail.com";
const GOVERNING_STATE = "the State of Georgia, United States";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.45_0.13_85/0.1),transparent_70%)]" />
        <div className="container mx-auto max-w-3xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Legal &amp; <span className="text-gold">Privacy</span>
            </h1>
            <p className="text-muted-foreground">
              Last updated: April 2, 2026. Please read these policies carefully
              before using the platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4 pb-24">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Tabs defaultValue="terms" className="w-full" data-ocid="terms.tab">
              <TabsList className="w-full mb-8 bg-white/5 border border-gold/20 p-1 rounded-xl">
                <TabsTrigger
                  value="terms"
                  data-ocid="terms.terms.tab"
                  className="flex-1 flex items-center gap-2 data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:border-gold/30 rounded-lg transition-all"
                >
                  <ScrollText className="w-4 h-4" />
                  Terms of Service
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  data-ocid="terms.privacy.tab"
                  className="flex-1 flex items-center gap-2 data-[state=active]:bg-gold/15 data-[state=active]:text-gold data-[state=active]:border-gold/30 rounded-lg transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Privacy Policy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="terms">
                <div className="glass-card rounded-2xl border border-gold/15 p-8 md:p-10">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-8">
                    Terms of Service
                  </h2>

                  <Section title="1. Acceptance of Terms">
                    <p>
                      By accessing or using {BUSINESS_NAME}{" "}
                      (&quot;Platform&quot;), you agree to be bound by these
                      Terms of Service. If you do not agree, you may not use the
                      Platform.
                    </p>
                  </Section>

                  <Section title="2. User Accounts">
                    <p>
                      To upload content or purchase tracks, you must
                      authenticate via Internet Identity. You are responsible
                      for maintaining the security of your identity credentials
                      and all activity that occurs under your account.
                    </p>
                    <p>
                      You must be at least 18 years of age to create an account
                      and use the Platform&apos;s purchase features.
                    </p>
                  </Section>

                  <Section title="3. Content Ownership &amp; Licensing">
                    <p>
                      Artists retain full ownership of any music, artwork, or
                      metadata they upload to the Platform. By uploading
                      content, you grant {BUSINESS_NAME} a non-exclusive,
                      worldwide, royalty-free license to display, stream (for
                      preview purposes), and deliver your content to purchasers.
                    </p>
                    <p>
                      You represent and warrant that you have all necessary
                      rights to upload and distribute the content, and that it
                      does not infringe any third-party intellectual property
                      rights.
                    </p>
                  </Section>

                  <Section title="4. Payments &amp; Refunds">
                    <p>
                      All purchases are processed by Stripe. By completing a
                      purchase, you authorize the applicable charge to your
                      payment method. Prices are displayed in USD and are final
                      at the time of checkout.
                    </p>
                    <p>
                      Due to the digital nature of music downloads, all sales
                      are final. Refunds may be granted at the sole discretion
                      of {BUSINESS_NAME} in cases of technical failure
                      preventing download access.
                    </p>
                  </Section>

                  <Section title="5. Acceptable Use">
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Upload content that infringes copyrights, trademarks, or
                        other intellectual property rights.
                      </li>
                      <li>
                        Attempt to circumvent payment verification to obtain
                        downloads without purchase.
                      </li>
                      <li>
                        Engage in any activity that interferes with or disrupts
                        the Platform&apos;s infrastructure.
                      </li>
                      <li>
                        Upload malicious files, viruses, or harmful code
                        disguised as audio content.
                      </li>
                      <li>
                        Harass, impersonate, or harm other users of the
                        Platform.
                      </li>
                    </ul>
                  </Section>

                  <Section title="6. Platform Rights">
                    <p>
                      {BUSINESS_NAME} reserves the right to remove content,
                      suspend accounts, or restrict access at its discretion if
                      these Terms are violated. The Platform may update these
                      Terms at any time; continued use constitutes acceptance of
                      the revised Terms.
                    </p>
                  </Section>

                  <Section title="7. Disclaimer of Warranties">
                    <p>
                      The Platform is provided &quot;as is&quot; without
                      warranties of any kind. We do not guarantee uninterrupted
                      service or that the Platform will be free of errors. Your
                      use is at your own risk.
                    </p>
                  </Section>

                  <Section title="8. Limitation of Liability">
                    <p>
                      To the maximum extent permitted by applicable law,{" "}
                      {BUSINESS_NAME} shall not be liable for any indirect,
                      incidental, special, or consequential damages arising from
                      your use of the Platform.
                    </p>
                  </Section>

                  <Section title="9. Governing Law">
                    <p>
                      These Terms shall be governed by and construed in
                      accordance with the laws of {GOVERNING_STATE}, without
                      regard to its conflict of law principles. Any disputes
                      shall be resolved through binding arbitration in{" "}
                      {GOVERNING_STATE}.
                    </p>
                  </Section>

                  <Section title="10. Contact">
                    <p>
                      For questions about these Terms, contact us at{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-gold hover:underline"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  </Section>
                </div>
              </TabsContent>

              <TabsContent value="privacy">
                <div className="glass-card rounded-2xl border border-gold/15 p-8 md:p-10">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-8">
                    Privacy Policy
                  </h2>

                  <Section title="1. Information We Collect">
                    <p>We collect the following types of information:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <strong className="text-foreground">
                          Identity data:
                        </strong>{" "}
                        Your Internet Identity principal, used to identify your
                        account and associate uploads and purchases.
                      </li>
                      <li>
                        <strong className="text-foreground">
                          Content data:
                        </strong>{" "}
                        Audio files, cover art, track metadata (title, artist
                        name, price) that you upload.
                      </li>
                      <li>
                        <strong className="text-foreground">
                          Transaction data:
                        </strong>{" "}
                        Stripe session IDs and payment verification status (not
                        your card details — those are handled by Stripe).
                      </li>
                    </ul>
                  </Section>

                  <Section title="2. How We Use Your Data">
                    <p>Your data is used to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Authenticate your account and authorize purchases.
                      </li>
                      <li>
                        Deliver purchased tracks to your personal library.
                      </li>
                      <li>Display your uploaded tracks in the catalog.</li>
                      <li>
                        Verify payment status before granting download access.
                      </li>
                    </ul>
                    <p>
                      We do not sell, rent, or share your personal data with any
                      third party except as necessary to provide payment
                      processing (Stripe) or as required by law.
                    </p>
                  </Section>

                  <Section title="3. Blockchain Storage">
                    <p>
                      This Platform runs on the Internet Computer blockchain.
                      Content and transaction records stored on-chain are
                      immutable and publicly verifiable by design. Be aware that
                      data written to the blockchain cannot be deleted.
                    </p>
                  </Section>

                  <Section title="4. Cookies &amp; Local Storage">
                    <p>
                      We use browser local storage to persist your Internet
                      Identity session for a seamless login experience. We do
                      not use third-party tracking cookies. Stripe may set
                      cookies on its hosted checkout page — please refer to
                      Stripe&apos;s own Privacy Policy for details.
                    </p>
                  </Section>

                  <Section title="5. Third-Party Services">
                    <p>
                      <strong className="text-foreground">Stripe:</strong>{" "}
                      Payment processing is handled by Stripe, Inc. When you
                      make a purchase, you are redirected to Stripe&apos;s
                      secure checkout. Stripe&apos;s collection and use of your
                      payment data is governed by{" "}
                      <a
                        href="https://stripe.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        Stripe&apos;s Privacy Policy
                      </a>
                      .
                    </p>
                  </Section>

                  <Section title="6. Your Rights">
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Access the data associated with your identity principal.
                      </li>
                      <li>
                        Delete uploaded content (subject to blockchain
                        immutability constraints for records already written
                        on-chain).
                      </li>
                      <li>
                        Withdraw your Internet Identity from the Platform at any
                        time by not authorizing future sessions.
                      </li>
                    </ul>
                  </Section>

                  <Section title="7. Security">
                    <p>
                      We take security seriously. Access to purchased content is
                      gated behind verified Stripe payment records. Your
                      identity principal is used solely for authentication and
                      is never shared externally.
                    </p>
                  </Section>

                  <Section title="8. Changes to This Policy">
                    <p>
                      We may update this Privacy Policy from time to time.
                      Changes will be reflected on this page with an updated
                      &quot;last updated&quot; date. Continued use of the
                      Platform after changes constitutes acceptance of the
                      revised policy.
                    </p>
                  </Section>

                  <Section title="9. Contact">
                    <p>
                      For privacy-related questions or requests, contact{" "}
                      {BUSINESS_NAME} at{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-gold hover:underline"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  </Section>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
