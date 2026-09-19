// NOTE: only "Years of Experience" is a verified real figure (established 2005).
// The rest are placeholders -- swap in real numbers from the client before
// this goes live, or drop the ones that don't apply.
const STATS = [
  { value: "20+", label: "Years of Experience" },
  { value: "PAN-India", label: "Delivery" },
  { value: "100%", label: "Custom-Engineered" },
  { value: "10+", label: "Team Members" }, // from "Upto 10 People" on the old listing
];

export default function StatsBar() {
  return (
    <section className="border-y border-brand-navy/10 bg-brand-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-heading text-2xl font-semibold text-brand-navy sm:text-3xl">
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-brand-ink/60 sm:text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}