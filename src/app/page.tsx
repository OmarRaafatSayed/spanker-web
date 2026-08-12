import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FlyingServiceSection } from "@/components/home/FlyingServiceSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { BookingProcessSection } from "@/components/home/BookingProcessSection";
import { HotelServiceSection } from "@/components/home/HotelServiceSection";
import { TravelNewsSection } from "@/components/home/TravelNewsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pb-20 lg:pb-0">
        <HeroBanner />
        <FlyingServiceSection />
        <SpecialOffersSection />
        <BookingProcessSection />
        <HotelServiceSection />
        <TravelNewsSection />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
