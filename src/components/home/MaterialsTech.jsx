import fabricLayers from "../../assets/images/materials-fabric-dark.webp";
import uvCloseup from "../../assets/images/materials-uv-closeup.webp";

const FEATURES = [
  { title: "UV-Resistant Coating", description: "Longer fabric life, better sun protection." },
  { title: "High-Strength Fabric", description: "Engineered to hold up against wind and weather." },
  { title: "Reinforced Core", description: "Built for long-term structural durability." },
  { title: "Advanced Surface Finish", description: "Self-cleaning, low-maintenance surface." },
];

export default function MaterialsTech() {
  return (
    <section className="bg-brand-navy">
      <div className="mx-auto max-w-container px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
              Materials & Technology
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-white sm:text-4xl">
              Engineered for Excellence
            </h2>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="border-l-2 border-brand-gold/60 pl-4">
                  <h3 className="font-heading text-sm font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl bg-brand-navy-light">
              <img src={fabricLayers} alt="Layered tensile fabric" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 overflow-hidden rounded-xl border-4 border-brand-navy shadow-xl sm:block">
              <img src={uvCloseup} alt="UV weather-resistant fabric close-up" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}