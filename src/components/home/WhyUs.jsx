import { Truck, Warehouse, Clock, Users, ShieldCheck, IndianRupee } from "lucide-react";
import whyUsImage from "../../assets/images/why-us-feature.webp";

const REASONS = [
  { icon: Truck, title: "Wide Distribution Network", description: "Structures delivered and installed across locations, not just around one city." },
  { icon: Warehouse, title: "Spacious Warehouse", description: "In-house stock and fabrication space to keep projects moving without delays." },
  { icon: Clock, title: "Prompt Delivery", description: "Projects scheduled and executed on the timeline you're given." },
  { icon: Users, title: "Client-Centric Approach", description: "Every structure is engineered around how the space will actually be used." },
  { icon: ShieldCheck, title: "Ethical Business Policy", description: "Transparent pricing and honest communication through every project stage." },
  { icon: IndianRupee, title: "Affordable Price Range", description: "Quality tensile engineering without an enterprise-only price tag." },
];

export default function WhyUs() {
  return (
    <section className="mx-auto max-w-container px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
            Why Tenso Craft
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-brand-navy sm:text-4xl">
            More Than Structures. We Create Experiences.
          </h2>

          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="group">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-brand-navy">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-ink/60">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
          <img
            src={whyUsImage}
            alt="Tenso Craft tensile structure detail"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/30 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}