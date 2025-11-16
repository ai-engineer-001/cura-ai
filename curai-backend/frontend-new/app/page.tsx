import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import DisclaimerSection from "@/components/disclaimer-section"
import Footer from "@/components/footer"


export default function Home() {
  return (
    <main className="w-full bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <DisclaimerSection />
      <Footer />
    </main>
  );
}
