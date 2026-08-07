import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FlyingServiceSection } from "@/components/home/FlyingServiceSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { DestinationsSection } from "@/components/home/DestinationsSection";
import { TravelNewsSection } from "@/components/home/TravelNewsSection";
import { MobileAppBanner } from "@/components/home/MobileAppBanner";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroBanner />
        <FlyingServiceSection />
        <SpecialOffersSection />
        <DestinationsSection />
        <TravelNewsSection />
        <MobileAppBanner />
      </main>
      <Footer />
    </>
  );
}
