import Link from "next/link";
import { Flame, MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter } from "lucide-react";

const HOURS = [
  { day: "Monday – Thursday", hours: "11:00 AM – 10:00 PM" },
  { day: "Friday – Saturday", hours: "11:00 AM – 11:00 PM" },
  { day: "Sunday", hours: "11:00 AM – 9:00 PM" },
];

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Ember & Oak
              </span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed mb-5">
              Wood-fired flavors crafted with passion. Modern American cuisine
              rooted in tradition, served in the heart of Austin.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-stone-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Menu", href: "/menu" },
                { label: "Order Online", href: "/menu" },
                { label: "About Us", href: "#about" },
                { label: "Gift Cards", href: "#" },
                { label: "Catering", href: "#" },
                { label: "Careers", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-stone-400 hover:text-orange-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Hours
            </h3>
            <ul className="space-y-2">
              {HOURS.map(({ day, hours }) => (
                <li key={day}>
                  <p className="text-xs text-stone-500 mb-0.5">{day}</p>
                  <p className="text-sm text-stone-300">{hours}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-stone-400">
                  1234 Main Street
                  <br />
                  Austin, TX 78701
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a
                  href="tel:5125550123"
                  className="text-sm text-stone-400 hover:text-orange-400 transition-colors"
                >
                  (512) 555-0123
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a
                  href="mailto:hello@emberandoak.com"
                  className="text-sm text-stone-400 hover:text-orange-400 transition-colors"
                >
                  hello@emberandoak.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Ember & Oak. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/admin" className="hover:text-stone-300 transition-colors">
              Admin
            </Link>
            <Link href="/kitchen" className="hover:text-stone-300 transition-colors">
              Kitchen
            </Link>
            <a href="#" className="hover:text-stone-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-stone-300 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
