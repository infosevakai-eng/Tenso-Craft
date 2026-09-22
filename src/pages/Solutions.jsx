import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, getPublishedProducts } from "../lib/firestore";
import SolutionCard from "../components/solutions/SolutionCard";

const PAGE_SIZE = 12;

const DEFAULT_TAG = "Our Products";
const DEFAULT_TITLE = "Tensile Products for Every Space";
const DEFAULT_DESCRIPTION =
  "From car parks to walkways to full architectural structures -- engineered, fabricated and installed end to end.";

export default function Solutions() {
  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // The active category lives in the URL (?category=slug), so a filtered
  // list can be shared or linked to (e.g. from a product page).
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category") || "";

  useEffect(() => {
    let cancelled = false;

    Promise.all([getPublishedProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        if (cancelled) return;
        setSolutions(productList);
        setCategories(categoryList);
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

  // Only categories that have at least one published product get a chip.
  const chips = useMemo(() => {
    const counts = {};
    solutions.forEach((s) => {
      if (s.categorySlug) counts[s.categorySlug] = (counts[s.categorySlug] || 0) + 1;
    });
    return categories
      .filter((c) => counts[c.slug] > 0)
      .map((c) => ({ slug: c.slug, name: c.name, count: counts[c.slug] }));
  }, [solutions, categories]);

  // Valid against ALL categories (not just ones with products), so a
  // category page with zero products still shows that category -- not "All".
  const activeSlug = categories.some((c) => c.slug === requestedCategory)
    ? requestedCategory
    : "";
  const activeCategory = activeSlug
    ? categories.find((c) => c.slug === activeSlug)
    : null;

  const filtered = activeSlug
    ? solutions.filter((s) => s.categorySlug === activeSlug)
    : solutions;
  const visible = filtered.slice(0, visibleCount);

  function selectCategory(slug) {
    setVisibleCount(PAGE_SIZE);
    setSearchParams(slug ? { category: slug } : {}, { replace: true });
  }

  const chipClass = (active) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-brand-gold bg-brand-gold text-brand-navy"
        : "border-brand-navy/15 text-brand-ink/60 hover:border-brand-gold hover:text-brand-navy"
    }`;

  const heroTag = activeCategory ? "Category" : DEFAULT_TAG;
  const heroTitle = activeCategory ? activeCategory.name : DEFAULT_TITLE;
  const heroDescription =
    activeCategory && activeCategory.description
      ? activeCategory.description
      : DEFAULT_DESCRIPTION;

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-container px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
              {heroTag}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold text-white sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-4 text-white/70">{heroDescription}</p>
          </div>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        {status === "ready" && chips.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory("")}
              className={chipClass(activeSlug === "")}
            >
              All
            </button>
            {chips.map((chip) => (
              <button
                key={chip.slug}
                type="button"
                onClick={() => selectCategory(chip.slug)}
                className={chipClass(activeSlug === chip.slug)}
              >
                {chip.name}
                <span className="ml-1.5 text-xs opacity-60">{chip.count}</span>
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
            Couldn't load products right now. Please refresh the page.
          </p>
        )}

        {status === "ready" && filtered.length === 0 && (
          <p className="text-sm text-brand-ink/60">
            No products found in this category.
          </p>
        )}

        {status === "ready" && filtered.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visible.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
              ))}
            </div>

            {visible.length < filtered.length && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="rounded-full border border-brand-navy/20 px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-gold hover:text-brand-gold"
                >
                  Show more ({filtered.length - visible.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}