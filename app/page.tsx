import { AdaptiveLearning } from "@/components/landing/AdaptiveLearning";
import { AdventureShowcase } from "@/components/landing/AdventureShowcase";
import { CTA } from "@/components/landing/CTA";
import { FAQ } from "@/components/landing/FAQ";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { SpeakingDemo } from "@/components/landing/SpeakingDemo";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        <Hero />

        <SpeakingDemo />

        <Features />

        <HowItWorks />

        <AdventureShowcase />

        <AdaptiveLearning />

        <FAQ />

        <CTA />
      </main>

      <Footer />
    </>
  );
}
