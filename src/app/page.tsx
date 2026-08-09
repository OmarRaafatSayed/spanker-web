import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FlyingServiceSection } from "@/components/home/FlyingServiceSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { DestinationsSection } from "@/components/home/DestinationsSection";
import { TravelNewsSection } from "@/components/home/TravelNewsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pb-20 lg:pb-0">
        <HeroBanner />
        <FlyingServiceSection />
        <SpecialOffersSection />
        <DestinationsSection />
        <TravelNewsSection />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
