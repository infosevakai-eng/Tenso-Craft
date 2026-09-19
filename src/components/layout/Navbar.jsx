import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.webp";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Solutions", to: "/solutions" },
  { label: "Contact", to: "/contact" },
];

// Only shown while logged in as admin.
const ADMIN_LINK = { label: "Dashboard", to: "/admin" };

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `text-sm font-medium tracking-wide transition-colors ${
          isActive ? "text-brand-gold" : "text-white/85 hover:text-brand-gold"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

const ctaClass =
  "rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light";

// One header for the whole app (public site + admin area).
// - Public pages: nav links + "Get a Quote" button.
// - Admin area (/admin/*): same header, "Get a Quote" is replaced by "Log Out".
// - While logged in as admin, a "Dashboard" link is added to the nav.
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isAdminArea = pathname.startsWith("/admin");
  const links = isAdmin ? [...NAV_LINKS, ADMIN_LINK] : NAV_LINKS;

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-navy/95 backdrop-blur supports-[backdrop-filter]:bg-brand-navy/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Tenso Craft logo" className="h-9 w-9 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-xl font-semibold tracking-wide text-white">
              TENSO CRAFT
            </span>
            <span className="text-[10px] tracking-[0.2em] text-brand-gold-light">
              SHAPING SPACES. BEYOND LIMITS.
            </span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        {/* Desktop CTA */}
        {isAdminArea ? (
          <button
            type="button"
            onClick={handleLogout}
            className={`hidden md:inline-block ${ctaClass}`}
          >
            Log Out
          </button>
        ) : (
          <NavLink to="/contact" className={`hidden md:inline-block ${ctaClass}`}>
            Get a Quote →
          </NavLink>
        )}

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-md p-2 text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 md:hidden">
          {links.map((link) => (
            <div key={link.to} className="py-2">
              <NavItem {...link} onClick={closeMenu} />
            </div>
          ))}
          {isAdminArea ? (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-full bg-brand-gold px-5 py-2.5 text-center text-sm font-semibold text-brand-navy"
            >
              Log Out
            </button>
          ) : (
            <NavLink
              to="/contact"
              onClick={closeMenu}
              className="mt-2 rounded-full bg-brand-gold px-5 py-2.5 text-center text-sm font-semibold text-brand-navy"
            >
              Get a Quote →
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}