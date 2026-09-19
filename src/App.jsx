import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import PublicLayout from "./components/layout/PublicLayout";
import WhatsAppButton from "./components/layout/WhatsAppButton";


// Loaded eagerly: the landing page and the 404 are needed for first paint.
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Loaded on demand: each page becomes its own chunk, so public visitors
// never download the admin code (forms, tables, upload logic).
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Solutions = lazy(() => import("./pages/Solutions"));
const SolutionDetail = lazy(() => import("./pages/SolutionDetail"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSolutionEdit = lazy(() => import("./pages/admin/AdminSolutionEdit"));

function PageLoader() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
    </div>
  );
}

// Suspense is wrapped per route (not around <Routes>) so the Navbar/Footer
// from PublicLayout stay on screen while a page chunk loads.
function Page({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public site -- Navbar + Footer wrap every page here */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<Page><About /></Page>} />
          <Route path="/contact" element={<Page><Contact /></Page>} />
          <Route path="/privacy-policy" element={<Page><PrivacyPolicy /></Page>} />
          <Route path="/solutions" element={<Page><Solutions /></Page>} />
          <Route path="/solutions/:slug" element={<Page><SolutionDetail /></Page>} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin login -- outside the protected group, or nobody could ever log in */}
        <Route path="/admin/login" element={<Page><AdminLogin /></Page>} />

        {/* Admin -- gated by ProtectedRoute; AdminLayout reuses the public Navbar (no Footer) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Page><AdminDashboard /></Page>} />
            <Route path="/admin/solutions/new" element={<Page><AdminSolutionEdit /></Page>} />
            <Route path="/admin/solutions/:id/edit" element={<Page><AdminSolutionEdit /></Page>} />
          </Route>
        </Route>
      </Routes>
      <WhatsAppButton />
    </AuthProvider>
  );
}