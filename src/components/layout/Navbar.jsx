import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import logo from "../../assets/images/logo.webp";
import { useAuth } from "../../context/AuthContext";
import { getCategories, getPublishedProducts } from "../../lib/firestore";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
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

// Shared: categories that actually have at least one published product,
// sorted by their `order` field.
function useCategoriesWithProducts() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getPublishedProducts()])
      .then(([categoryList, productList]) => {
        if (cancelled) return;

        const counts = {};
        productList.forEach((p) => {
          if (p.categorySlug) counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
        });

        const withProducts = categoryList
          .filter((c) => counts[c.slug] > 0)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setCategories(withProducts);
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}

// Desktop "Products" nav item with a hover/click dropdown of live categories.
function ProductsDropdown() {
  const categories = useCategoriesWithProducts();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef(null);
  const { pathname } = useLocation();
  const isActive = pathname.startsWith("/products");

  function open() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setIsOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={open} onMouseLeave={scheduleClose}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors ${
          isActive ? "text-brand-gold" : "text-white/85 hover:text-brand-gold"
        }`}
        aria-expanded={isOpen}
      >
        Products
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-xl border border-brand-navy/10 bg-white py-2 shadow-xl">
          <NavLink
            to="/products"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-cream/60"
          >
            All Products
          </NavLink>

          {categories.length > 0 && <div className="my-1 border-t border-brand-navy/10" />}

          <div className="max-h-72 overflow-y-auto">
            {categories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-brand-ink/70 hover:bg-brand-cream/60 hover:text-brand-navy"
              >
                {cat.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile "Products" item with an expandable list of categories underneath.
function MobileProductsSection({ onNavigate }) {
  const categories = useCategoriesWithProducts();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <NavItem to="/products" label="Products" onClick={onNavigate} />
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label="Toggle product categories"
            className="p-1 text-white/70"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {isExpanded && categories.length > 0 && (
        <div className="mt-1 ml-3 flex max-h-60 flex-col gap-1 overflow-y-auto border-l border-white/10 pl-3">
          {categories.map((cat) => (
            <NavLink
              key={cat.slug}
              to={`/products?category=${encodeURIComponent(cat.slug)}`}
              onClick={onNavigate}
              className="py-1.5 text-sm text-white/70 hover:text-brand-gold"
            >
              {cat.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
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
      <div className="mx-auto flex max-w-container items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
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
          <NavItem to="/" label="Home" />
          <ProductsDropdown />
          <NavItem to="/about" label="About" />
          <NavItem to="/contact" label="Contact" />
          {isAdmin && <NavItem to={ADMIN_LINK.to} label={ADMIN_LINK.label} />}
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
          <div className="py-2">
            <NavItem to="/" label="Home" onClick={closeMenu} />
          </div>

          <MobileProductsSection onNavigate={closeMenu} />

          <div className="py-2">
            <NavItem to="/about" label="About" onClick={closeMenu} />
          </div>
          <div className="py-2">
            <NavItem to="/contact" label="Contact" onClick={closeMenu} />
          </div>
          {isAdmin && (
            <div className="py-2">
              <NavItem to={ADMIN_LINK.to} label={ADMIN_LINK.label} onClick={closeMenu} />
            </div>
          )}

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