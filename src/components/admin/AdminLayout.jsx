import { Outlet } from "react-router-dom";
import Navbar from "../layout/Navbar";

// Admin pages use the same header as the public site (no public Footer).
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f7f5f1]">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}