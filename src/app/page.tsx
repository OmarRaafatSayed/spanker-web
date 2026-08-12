import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLoader } from "@/components/ui/PageLoader";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FlyingServiceSection } from "@/components/home/FlyingServiceSection";
import { StatsSection } from "@/components/home/StatsSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { BookingProcessSection } from "@/components/home/BookingProcessSection";
import { HotelServiceSection } from "@/components/home/HotelServiceSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TravelNewsSection } from "@/components/home/TravelNewsSection";
import { FAQSection } from "@/components/home/FAQSection";

export default function Home() {
  return (
    <>
      <PageLoader />
      <Navbar />
      <main className="pb-20 lg:pb-0">
        <HeroBanner />
        <FlyingServiceSection />
        <StatsSection />
        <SpecialOffersSection />
        <BookingProcessSection />
        <HotelServiceSection />
        <TestimonialsSection />
        <TravelNewsSection />
        <FAQSection />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
