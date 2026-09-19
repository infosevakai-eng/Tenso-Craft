import { useEffect, useState } from "react";
import { getSolutions } from "../lib/firestore";
import SolutionCard from "../components/solutions/SolutionCard";

const CATEGORY_LABELS = ["All", "Architectural", "Commercial", "Residential"];

export default function Solutions() {
  const [solutions, setSolutions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let cancelled = false;

    getSolutions()
      .then((data) => {
        if (cancelled) return;
        setSolutions(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    activeCategory === "All"
      ? solutions
      : solutions.filter((s) => s.category === activeCategory);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
              Our Solutions
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold text-white sm:text-5xl">
              Tensile Solutions for Every Space
            </h1>
            <p className="mt-4 text-white/70">
              From car parks to walkways to full architectural structures --
              engineered, fabricated and installed end to end.
            </p>
          </div>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {status === "ready" && solutions.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {CATEGORY_LABELS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "border-brand-gold bg-brand-gold text-brand-navy"
                    : "border-brand-navy/15 text-brand-ink/60 hover:border-brand-gold hover:text-brand-navy"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {status === "loading" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-brand-cream/60"
              />
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-red-600">
            Couldn't load solutions right now. Please refresh the page.
          </p>
        )}

        {status === "ready" && filtered.length === 0 && (
          <p className="text-sm text-brand-ink/60">
            No solutions found in this category.
          </p>
        )}

        {status === "ready" && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}