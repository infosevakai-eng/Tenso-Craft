import { useEffect, useState } from "react";
import { FaWhatsapp, FaPhoneAlt, FaChevronUp } from "react-icons/fa";

const WHATSAPP_NUMBER = "919599145624"; // Arman Ahmad — country code + number, no + or spaces
const CALL_NUMBER = "+919599145624"; // used for tel: link, keep + and no spaces
const DEFAULT_MESSAGE = "Hi, I'm interested in your tensile structure solutions.";

export default function WhatsAppButton() {
  const [showTop, setShowTop] = useState(false);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
  const callHref = `tel:${CALL_NUMBER}`;

  // Only show "Back to top" once the visitor has scrolled down a bit.
  useEffect(() => {
    function handleScroll() {
      setShowTop(window.scrollY > 300);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
        WhatsApp
      </a>

      <a
        href={callHref}
        aria-label="Call us now"
        className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <FaPhoneAlt className="h-4 w-4" aria-hidden="true" />
        Call Now
      </a>

      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="flex items-center gap-2 rounded-full bg-brand-navy px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <FaChevronUp className="h-4 w-4" aria-hidden="true" />
          Top
        </button>
      )}
    </div>
  );
}