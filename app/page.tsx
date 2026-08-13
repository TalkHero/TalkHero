import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AppPreview } from "@/components/landing/AppPreview";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { AdaptiveLearning } from "@/components/landing/AdaptiveLearning";

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-white">
      <Navbar />

      <div className="pt-20">
        <Hero />
        <ProductDemo />
        <section id="features" className="scroll-mt-24">
          <Features />
        </section>

        <section id="how-it-works" className="scroll-mt-24">
          <HowItWorks />
        </section>

        <section id="personalization" className="scroll-mt-24">
          <AdaptiveLearning />
        </section>

        <section id="preview" className="scroll-mt-24">
          <AppPreview />
        </section>

        <section id="faq" className="scroll-mt-24">
          <FAQ />
        </section>

        <CTA />
        <Footer />
      </div>
    </main>
  );
}
