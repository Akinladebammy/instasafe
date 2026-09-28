import { CtaSection } from "@/components/cta-section";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { IntegrationRail } from "@/components/integration-rail";
import { Outcomes } from "@/components/outcomes";
import { SecurityLedger } from "@/components/security-ledger";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrustGap } from "@/components/trust-gap";
import { WhatsappDemo } from "@/components/whatsapp-demo";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <IntegrationRail />
        <TrustGap />
        <HowItWorks />
        <WhatsappDemo />
        <SecurityLedger />
        <Outcomes />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
