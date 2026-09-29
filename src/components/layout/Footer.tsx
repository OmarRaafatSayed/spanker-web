"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/icons";

export function Footer() {
  const { t, locale } = useI18n();
  const f = t.footer;
  const l = f.links;

  const FOOTER_COLUMNS = [
    {
      title: f.bookManage,
      links: [
        { label: l.bookFlight,    href: `/${locale}/book-flight`         },
        { label: l.myBooking,     href: `/${locale}/my-booking`          },
        { label: l.onlineCheckin, href: `/${locale}/check-in-online`     },
        { label: l.seatSelection, href: `/${locale}/seat-selection`      },
        { label: l.flightStatus,  href: `/${locale}/flight-status`       },
      ],
    },
    {
      title: f.travelInfo,
      links: [
        { label: l.baggage,            href: `/${locale}/baggage`                    },
        { label: l.specialAssistance,  href: `/${locale}/special-assistance`         },
        { label: l.travelingPets,      href: `/${locale}/pets`                       },
        { label: l.travelingChildren,  href: `/${locale}/traveling-with-children`    },
        { label: l.visaHealth,         href: `/${locale}/visa-and-health`            },
      ],
    },
    {
      title: f.airCairo,
      links: [
        { label: l.aboutAirCairo,  href: `/${locale}/about-air-cairo`  },
        { label: l.missionVision,  href: `/${locale}/mission-vision`   },
        { label: l.ourFleet,       href: `/${locale}/our-fleet`        },
        { label: l.routeMap,       href: `/${locale}/route-map`        },
        { label: l.charterFlights, href: `/${locale}/charter-flights`  },
        { label: l.pressRelease,   href: `/${locale}/press-release`    },
      ],
    },
    {
      title: f.helpContact,
      links: [
        { label: l.faqs,             href: `/${locale}/faqs`              },
        { label: l.officeContacts,   href: `/${locale}/office-contacts`   },
        { label: l.customerFeedback, href: `/${locale}/customer-feedback` },
        { label: l.claims,           href: `/${locale}/claims`            },
        { label: l.refund,           href: `/${locale}/refund`            },
      ],
    },
  ];

  const POLICY_LINKS = [
    { label: l.privacyPolicy,      href: `/${locale}/privacy-policy`          },
    { label: l.cookies,            href: `/${locale}/cookies`                 },
    { label: l.conditionCarriage,  href: `/${locale}/condition-of-carriage`   },
    { label: l.terms,              href: `/${locale}/termsandconditions`      },
    { label: l.ticketNotices,      href: `/${locale}/ticket-notices`          },
  ];

  return (
    <footer className="bg-brand-dark text-white pb-20 lg:pb-0 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 lg:px-8 pt-12 pb-8 w-full max-w-full">

        {/* Logo + Social */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <Link href="/" className="flex items-center">
            <img
              src="/width-logo.png"
              alt="Spanker Logo"
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            {[
              { href: "https://facebook.com/spanker",  label: "Facebook",  Icon: FacebookIcon  },
              { href: "https://instagram.com/spanker", label: "Instagram", Icon: InstagramIcon },
              { href: "https://twitter.com/spanker",   label: "Twitter",   Icon: TwitterIcon   },
              { href: "https://youtube.com/spanker",   label: "YouTube",   Icon: YoutubeIcon   },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white/60 hover:text-white transition-colors"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {FOOTER_COLUMNS.map((col, i) => (
            <div key={`${col.title}-${i}`}>
              <h3 className="font-semibold text-sm text-white mb-4 uppercase tracking-wide">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={`${link.label}-${j}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
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
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
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
