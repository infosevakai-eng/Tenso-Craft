import { Link } from "react-router-dom";
import ctaImage from "../../assets/images/final-cta-bg.webp";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <img
        src={ctaImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-brand-navy/85" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
          Let's Build Something Extraordinary.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Have a project in mind? Our team is ready to help you design and
          deliver a tensile solution that's unique, functional and
          future-ready.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/contact"
            className="rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
          >
            Get a Quote →
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
          >
            Schedule a Consultation
          </Link>
        </div>
      </div>
    </section>
  );
}