const INDUSTRIES = [
  "Commercial", "Residential", "Hospitality", "Healthcare",
  "Sports & Recreation", "Public Infrastructure", "Education", "Industrial",
];

export default function IndustriesServed() {
  return (
    <section className="mx-auto max-w-container px-4 py-20 sm:px-6 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
        Industries We Serve
      </p>
      <h2 className="mt-2 max-w-xl font-heading text-3xl font-semibold text-brand-navy sm:text-4xl">
        Structures for a Better Tomorrow
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {INDUSTRIES.map((industry) => (
          <div
            key={industry}
            className="rounded-xl border border-brand-navy/10 px-4 py-6 text-center text-sm font-medium text-brand-navy"
          >
            {industry}
          </div>
        ))}
      </div>
    </section>
  );
}