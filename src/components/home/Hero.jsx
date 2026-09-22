import { Link } from "react-router-dom";
import heroImage from "../../assets/images/hero.webp";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy">
      <div className="mx-auto grid max-w-container gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28 lg:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
            Architecture Meets Innovation
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Spaces That Move People.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">
            Tenso Craft has been engineering tensile structures, tensile
            membrane roofing and outdoor shade solutions since 2005 -- built
            to be stronger, smarter and more beautiful.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/solutions"
              className="rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
            >
              Explore Our Work →
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              Talk to an Expert
            </Link>
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm text-white/50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Fatehpur Beri, New Delhi, India
          </p>
        </div>

        {/* Right side: real hero photo */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-square">
          <img
            src={heroImage}
            alt="Tenso Craft tensile structure"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>
      </div>
    </section>
  );
}