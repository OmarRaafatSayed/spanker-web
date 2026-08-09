import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FlightSearchWidget } from "@/components/home/FlightSearchWidget";
import { FlyingServiceSection } from "@/components/home/FlyingServiceSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { DestinationsSection } from "@/components/home/DestinationsSection";
import { TravelNewsSection } from "@/components/home/TravelNewsSection";
import { MobileAppBanner } from "@/components/home/MobileAppBanner";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pb-20 lg:pb-0">
        <HeroBanner />
        {/* Search widget sits between hero and services, full-width with contained max-width */}
        <div className="bg-bg-alt py-6 md:py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <FlightSearchWidget />
          </div>
        </div>
        <FlyingServiceSection />
        <SpecialOffersSection />
        <DestinationsSection />
        <TravelNewsSection />
        <MobileAppBanner />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
