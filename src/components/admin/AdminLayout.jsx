import { Link, Outlet, useLocation } from "react-router-dom";
import Navbar from "../layout/Navbar";

// One entry per admin section. `match` decides when the tab is highlighted, so
// e.g. /admin/solutions/new and /admin/solutions/:id/edit keep "Solutions" active.
const TABS = [
  {
    label: "Products",
    to: "/admin",
    match: (path) => path === "/admin" || path.startsWith("/admin/solutions"),
  },
  {
    label: "Categories",
    to: "/admin/categories",
    match: (path) => path.startsWith("/admin/categories"),
  },
  {
    label: "Import",
    to: "/admin/import",
    match: (path) => path.startsWith("/admin/import"),
  },
];

// Admin pages use the same header as the public site (no public Footer).
export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#f7f5f1]">
      <Navbar />

      <div className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Admin sections"
          className="mx-auto flex max-w-7xl gap-6 px-4 sm:px-6 lg:px-8"
        >
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-brand-gold text-brand-navy"
                    : "border-transparent text-slate-500 hover:text-brand-navy"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main>
        <Outlet />
      </main>
    </div>
  );
}