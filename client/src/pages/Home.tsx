import HeroSection from "@/components/HeroSection";
import ThreePillarSection from "@/components/ThreePillarSection";
import ProblemSolutionSection from "@/components/ProblemSolutionSection";
import FeatureDeepDiveSection from "@/components/FeatureDeepDiveSection";
import SocialProofSection from "@/components/SocialProofSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ThreePillarSection />
      <ProblemSolutionSection />
      <FeatureDeepDiveSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </div>
  );
}
