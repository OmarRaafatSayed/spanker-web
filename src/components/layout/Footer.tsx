"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/icons";

export function Footer() {
  const { t } = useI18n();
  const f = t.footer;
  const l = f.links;

  const FOOTER_COLUMNS = [
    {
      title: f.bookManage,
      links: [
        { label: l.bookFlight, href: "/en-eg/book-flight" },
        { label: l.myBooking, href: "/en-eg/my-booking" },
        { label: l.onlineCheckin, href: "/en-eg/check-in-online" },
        { label: l.seatSelection, href: "/en-eg/seat-selection" },
        { label: l.flightStatus, href: "/en-eg/flight-status" },
      ],
    },
    {
      title: f.travelInfo,
      links: [
        { label: l.baggage, href: "/en-eg/baggage" },
        { label: l.specialAssistance, href: "/en-eg/special-assistance" },
        { label: l.travelingPets, href: "/en-eg/pets" },
        { label: l.travelingChildren, href: "/en-eg/traveling-with-children" },
        { label: l.visaHealth, href: "/en-eg/visa-and-health" },
      ],
    },
    {
      title: f.airCairo,
      links: [
        { label: l.aboutAirCairo, href: "/en-eg/about-air-cairo" },
        { label: l.missionVision, href: "/en-eg/mission-vision" },
        { label: l.ourFleet, href: "/en-eg/our-fleet" },
        { label: l.routeMap, href: "/en-eg/route-map" },
        { label: l.charterFlights, href: "/en-eg/charter-flights" },
        { label: l.pressRelease, href: "/en-eg/press-release" },
      ],
    },
    {
      title: f.helpContact,
      links: [
        { label: l.faqs, href: "/en-eg/faqs" },
        { label: l.officeContacts, href: "/en-eg/office-contacts" },
        { label: l.customerFeedback, href: "/en-eg/customer-feedback" },
        { label: l.claims, href: "/en-eg/claims" },
        { label: l.refund, href: "/en-eg/refund" },
      ],
    },
  ];

  const POLICY_LINKS = [
    { label: l.privacyPolicy, href: "/en-eg/privacy-policy" },
    { label: l.cookies, href: "/en-eg/cookies" },
    { label: l.conditionCarriage, href: "/en-eg/condition-of-carriage" },
    { label: l.terms, href: "/en-eg/termsandconditions" },
    { label: l.ticketNotices, href: "/en-eg/ticket-notices" },
  ];

  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-8">
        {/* Logo + Social */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="18" cy="18" r="18" fill="#3D6833" />
              <path d="M8 20 L18 10 L28 20 L24 20 L18 14 L12 20 Z" fill="white" />
              <path d="M14 20 L18 16 L22 20 L20 20 L18 18 L16 20 Z" fill="#FDD12A" />
              <rect x="16" y="20" width="4" height="6" rx="1" fill="white" />
            </svg>
            <span className="font-bold text-xl text-white">{f.airCairo}</span>
          </Link>

          <div className="flex items-center gap-4">
            {[
              { href: "https://facebook.com/spanker", label: "Facebook", Icon: FacebookIcon },
              { href: "https://instagram.com/spanker", label: "Instagram", Icon: InstagramIcon },
              { href: "https://twitter.com/spanker", label: "Twitter", Icon: TwitterIcon },
              { href: "https://youtube.com/spanker", label: "YouTube", Icon: YoutubeIcon },
            ].map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-white/60 hover:text-white transition-colors">
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-sm text-white mb-4 uppercase tracking-wide">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} {f.airCairo}. {f.copyright}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {POLICY_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="text-xs text-white/50 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
