import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFeaturedProducts } from "../../lib/firestore";
import SolutionCard from "../solutions/SolutionCard";

export default function SolutionsGrid() {
  const [solutions, setSolutions] = useState([]);
  const [status, setStatus] = useState("loading");
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    // Featured AND published products only.
    getFeaturedProducts()
      .then((data) => {
        if (cancelled) return;
        setSolutions(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Could not load featured solutions:", err);
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isCarousel = status === "ready" && solutions.length > 5;

  function scrollByCard(direction) {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-card]")?.offsetWidth ?? 384;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-container px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-navy/10 pb-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
            Our Products
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-brand-navy sm:text-4xl">
            Tensile Solutions for Every Space
          </h2>
          <p className="mt-3 max-w-xl text-sm text-brand-ink/60">
            From car parks to walkways to façades -- engineered and built to
            fit the space, not the other way around.
          </p>
        </div>

        <Link
          to="/solutions"
          className="whitespace-nowrap text-sm font-semibold text-brand-navy underline underline-offset-4 hover:text-brand-gold"
        >
          View All Products →
        </Link>
      </div>

      {status === "loading" && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-xl bg-brand-cream/60"
            />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="mt-10 text-sm text-red-600">
          Couldn't load solutions right now.
        </p>
      )}

      {status === "ready" && solutions.length === 0 && (
        <p className="mt-10 text-sm text-brand-ink/60">
          No featured solutions added yet.
        </p>
      )}

      {status === "ready" && solutions.length > 0 && !isCarousel && (
        <div className="mt-10 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </div>
      )}

      {isCarousel && (
        <>
          {/* Desktop: arrows sit beside the card row, scrollbar hidden */}
          <div className="relative mt-10 hidden lg:block">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full border border-brand-navy/15 bg-white p-2 text-brand-navy shadow-md transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>

            <div
              ref={scrollerRef}
              className="flex items-stretch gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {solutions.map((solution) => (
                <div
                  key={solution.id}
                  data-card
                  className="flex w-96 flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <SolutionCard solution={solution} />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full border border-brand-navy/15 bg-white p-2 text-brand-navy shadow-md transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Mobile/tablet: plain grid, no arrows */}
          <div className="mt-10 grid items-stretch gap-6 sm:grid-cols-2 lg:hidden">
            {solutions.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}