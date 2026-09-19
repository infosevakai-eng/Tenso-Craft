import bannerImage from "../../assets/images/process-banner-bg.webp";

export default function ProcessBanner() {
  return (
    <section className="relative overflow-hidden">
      <img
        src={bannerImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-brand-navy/80" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
          Turning Ideas Into Iconic Spaces
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-semibold text-white sm:text-4xl">
          Design. Engineer. Fabricate. Install.
        </h2>
        <p className="mt-4 max-w-xl text-white/70">
          We combine architectural vision with engineering precision to
          deliver tensile structures built to last -- from the first sketch
          to the final install.
        </p>
      </div>
    </section>
  );
}