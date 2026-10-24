import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLoader } from "@/components/ui/PageLoader";
import { HeroBanner } from "@/components/home/HeroBanner";
import { AiTripPlannerSection } from "@/components/home/AiTripPlannerSection";
import { FlyingServiceSection } from "@/components/home/FlyingServiceSection";
import { SpecialOffersSection } from "@/components/home/SpecialOffersSection";
import { BookingProcessSection } from "@/components/home/BookingProcessSection";
import { HotelServiceSection } from "@/components/home/HotelServiceSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TravelNewsSection } from "@/components/home/TravelNewsSection";
import { FAQSection } from "@/components/home/FAQSection";
import { SectionDivider } from "@/components/ui/SectionDivider";

export default function Home() {
  return (
    <>
      <PageLoader />
      <TopBar />
      {/* Hero starts from very top — navbar floats over it */}
      <main className="pt-0 pb-20 lg:pb-0 overflow-x-hidden w-full max-w-full">
        {/* 1 — Hero (navbar floats over this) */}
        <HeroBanner />

        {/* 2 — AI Trip Planner */}
        <AiTripPlannerSection />

        {/* Hero → FlyingService: no dark divider needed */}
        <FlyingServiceSection />

        {/* FlyingService → SpecialOffers */}
        <SpecialOffersSection />

        {/* SpecialOffers → BookingProcess */}
        <SectionDivider from="dark" to="green-dark" variant="wave" flip />
        <BookingProcessSection />

        {/* BookingProcess → HotelService */}
        <HotelServiceSection />

        {/* HotelService → Testimonials */}
        <TestimonialsSection />

        <TravelNewsSection />

        <FAQSection />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
