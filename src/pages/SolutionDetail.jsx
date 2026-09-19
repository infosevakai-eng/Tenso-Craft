import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getSolutionBySlug, getSolutions } from "../lib/firestore";
import { optimizedUrl } from "../lib/cloudinary";
import SolutionCard from "../components/solutions/SolutionCard";

export default function SolutionDetail() {
  const { slug } = useParams();
  const [solution, setSolution] = useState(null);
  const [status, setStatus] = useState("loading");
  const [related, setRelated] = useState([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setRelated([]);

    getSolutionBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setStatus("not-found");
          return;
        }
        setSolution(data);
        setStatus("ready");

        // Fetch related solutions from the same category
        if (data.category) {
          getSolutions()
            .then((all) => {
              if (cancelled) return;
              const relatedList = all.filter(
                (s) => s.category === data.category && s.slug !== data.slug
              );
              setRelated(relatedList);
            })
            .catch(() => {
              if (cancelled) return;
              setRelated([]);
            });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  function scrollByCard(direction) {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-card]")?.offsetWidth ?? 280;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: "smooth" });
  }

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[3/2] animate-pulse rounded-2xl bg-brand-cream" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-brand-cream" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-brand-cream" />
            <div className="h-24 w-full animate-pulse rounded bg-brand-cream" />
          </div>
        </div>
      </main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-semibold text-brand-navy">
          Solution not found
        </h1>
        <Link to="/solutions" className="mt-4 inline-block text-brand-gold underline">
          ← Back to all solutions
        </Link>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <p className="text-sm text-red-600">
          Couldn't load this solution right now. Please refresh the page.
        </p>
      </main>
    );
  }

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/solutions"
          className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-navy"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to all solutions
        </Link>

        {/* Product-style layout: image left, content right */}
        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Left: image */}
          <div className="aspect-[3/2] w-full overflow-hidden rounded-2xl bg-brand-cream/60 p-4 lg:sticky lg:top-24">
            {solution.imageUrl ? (
              <img
                src={optimizedUrl(solution.imageUrl)}
                alt={solution.title}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl text-sm text-brand-ink/40">
                No image
              </div>
            )}
          </div>

          {/* Right: content */}
          <div>
            {solution.category && (
              <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
                {solution.category}
              </p>
            )}
            <h1 className="mt-2 font-heading text-3xl font-semibold text-brand-navy sm:text-4xl">
              {solution.title}
            </h1>

            {solution.shortDescription && (
              <p className="mt-4 text-base leading-relaxed text-brand-ink/70">
                {solution.shortDescription}
              </p>
            )}

            <div className="mt-6 border-t border-brand-navy/10 pt-6">
              <p className="whitespace-pre-line leading-relaxed text-brand-ink/70">
                {solution.fullDescription}
              </p>
            </div>

            {/* CTA block */}
            <div className="mt-8 rounded-xl bg-brand-cream p-6 text-center">
              <p className="font-heading text-lg font-semibold text-brand-navy">
                Interested in this solution?
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-block rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
              >
                Get a Quote →
              </Link>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {Array.isArray(solution.galleryUrls) && solution.galleryUrls.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Gallery
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {solution.galleryUrls.map((url) => (
                <div key={url} className="aspect-[3/2] overflow-hidden rounded-xl">
                  <img
                    src={optimizedUrl(url)}
                    alt={solution.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related solutions -- same category */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-brand-navy/10 pt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
                  You May Also Like
                </p>
                <h2 className="mt-1.5 font-heading text-xl font-semibold text-brand-navy">
                  More in {solution.category}
                </h2>
              </div>

              {related.length > 3 && (
                <div className="hidden gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => scrollByCard(-1)}
                    aria-label="Scroll left"
                    className="rounded-full border border-brand-navy/15 p-2 text-brand-navy transition-colors hover:border-brand-gold hover:text-brand-gold"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByCard(1)}
                    aria-label="Scroll right"
                    className="rounded-full border border-brand-navy/15 p-2 text-brand-navy transition-colors hover:border-brand-gold hover:text-brand-gold"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>

            <div
              ref={scrollerRef}
              className="mt-8 flex gap-6 overflow-x-auto scroll-smooth pb-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {related.map((item) => (
                <div
                  key={item.id}
                  data-card
                  className="w-64 flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <SolutionCard solution={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}