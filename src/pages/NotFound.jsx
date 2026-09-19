import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-semibold text-brand-navy">
          404 -- Page not found
        </h1>
        <Link to="/" className="mt-6 inline-block text-brand-gold underline">
          Back to Home
        </Link>
      </section>
    </main>
  );
}
