import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.webp";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Solutions", to: "/solutions" },
  { label: "Contact", to: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Tenso Craft logo" className="h-8 w-8 object-contain" />
              <span className="font-heading text-lg font-semibold text-white">
                TENSO CRAFT
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Innovative tensile structures for a stronger, smarter and more
              beautiful tomorrow.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition-colors hover:text-brand-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
              Contact Us
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li>+91 00000 00000</li>
              <li>info@tensocraft.com</li>
              <li>Prayagraj, Uttar Pradesh, India</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
              Legal
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-white/60 transition-colors hover:text-brand-gold"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {year} Tenso Craft. All rights reserved.
        </div>
      </div>
    </footer>
  );
}