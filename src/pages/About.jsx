import { Award } from "lucide-react";
import WhyUs from "../components/home/WhyUs";
import whatWeDoImage from "../assets/images/process-banner-bg.webp";
export default function About() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
              Who We Are
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold text-white sm:text-5xl">
              About Tenso Craft
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/70">
              Established in 2005 and based in Fatehpur Beri, New Delhi, Tenso
              Craft manufactures, supplies and installs tensile structures,
              tensile membrane roofing and outdoor shade solutions. Under the
              leadership of owner Armaan Ahmad, the business has grown by
              focusing on one thing consistently: giving every client a
              structure that's engineered to fit their space, not a
              one-size-fits-all product.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5">
              <Award className="h-5 w-5 text-brand-gold" strokeWidth={1.75} />
              <span className="text-sm font-medium text-white">
                20+ Years of Tensile Engineering
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl lg:order-2">
            <img
              src={whatWeDoImage}
              alt="Tenso Craft tensile structure installation"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="lg:order-1">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
              Our Process
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-brand-navy sm:text-3xl">
              What We Do
            </h2>
            <p className="mt-4 leading-relaxed text-brand-ink/70">
              We work as manufacturer, wholesaler and service provider across
              the full lifecycle of a tensile structure project -- design,
              fabric selection, fabrication, and on-site installation. That
              covers everything from car parking shades and walkway canopies
              to large-span roofing, swimming pool covers and custom
              architectural structures.
            </p>
            <p className="mt-4 leading-relaxed text-brand-ink/70">
              We follow transparent business practices and keep clients
              informed at every stage of a project, from the first design
              conversation through to final handover.
            </p>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="border-y border-brand-ink/10 bg-brand-navy/[0.03] py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <span className="text-sm font-medium uppercase tracking-widest text-brand-gold">
            From the Owner
          </span>
          <blockquote className="max-w-2xl font-heading text-xl font-medium text-brand-navy sm:text-2xl">
            "Every client gets a structure engineered to fit their space --
            never a one-size-fits-all product."
          </blockquote>
          <div>
            <p className="font-semibold text-brand-navy">Armaan Ahmad</p>
            <p className="text-sm text-brand-ink/60">Owner, Tenso Craft</p>
          </div>
        </div>
      </section>

      <WhyUs />
    </main>
  );
}