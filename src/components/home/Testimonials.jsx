// PLACEHOLDER -- do not treat this as a real client quote. Replace with an
// actual testimonial (and, ideally, a real client name/company) once the
// client has one to share. The name below is intentionally generic.
const PLACEHOLDER_TESTIMONIAL = {
  quote: "Placeholder review text -- replace with a real client testimonial before launch.",
  name: "Client Name",
  role: "Company / Project",
};

export default function Testimonials() {
  return (
    <section className="bg-brand-navy">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
          Client Stories
        </p>
        <blockquote className="mt-6 font-heading text-xl font-medium leading-relaxed text-white sm:text-2xl">
          "{PLACEHOLDER_TESTIMONIAL.quote}"
        </blockquote>
        <p className="mt-4 text-sm text-white/50">
          {PLACEHOLDER_TESTIMONIAL.name} -- {PLACEHOLDER_TESTIMONIAL.role}
        </p>
      </div>
    </section>
  );
}