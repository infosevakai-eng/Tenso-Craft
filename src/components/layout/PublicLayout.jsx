import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
