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
import { SectionDivider } from "@/components/ui/SectionDivider";

export default function Home() {
  return (
    <>
      <PageLoader />
      <Navbar />
      {/* pt-18 adds top padding to account for fixed navbar (h-18) */}
      <main className="pt-18 pb-20 lg:pb-0">
        {/* 1 — Hero (transparent/dark image bg) */}
        <HeroBanner />

        {/* Hero → FlyingService: dark bg slides in */}
        <SectionDivider from="dark" to="dark" variant="wave" />
        <FlyingServiceSection />

        {/* FlyingService → Stats: wave up */}
        <SectionDivider from="dark" to="green-dark" variant="tilt" flip />
        <StatsSection />

        {/* Stats → SpecialOffers: curve down */}
        <SectionDivider from="green-dark" to="dark" variant="curve" />
        <SpecialOffersSection />

        {/* SpecialOffers → BookingProcess */}
        <SectionDivider from="dark" to="green-dark" variant="wave" flip />
        <BookingProcessSection />

        {/* BookingProcess → HotelService */}
        <SectionDivider from="green-dark" to="dark" variant="tilt" />
        <HotelServiceSection />

        {/* HotelService → Testimonials */}
        <SectionDivider from="dark" to="dark" variant="zigzag" />
        <TestimonialsSection />

        {/* Testimonials → TravelNews */}
        <SectionDivider from="dark" to="green-dark" variant="curve" flip />
        <TravelNewsSection />

        {/* TravelNews → FAQ */}
        <SectionDivider from="green-dark" to="dark" variant="wave" />
        <FAQSection />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
