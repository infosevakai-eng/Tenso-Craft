import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategoryTree, getPublishedProducts } from "../lib/firestore";
import SolutionCard from "../components/solutions/SolutionCard";

const PAGE_SIZE = 12;

const DEFAULT_TAG = "Our Products";
const DEFAULT_TITLE = "Tensile Products for Every Space";
const DEFAULT_DESCRIPTION =
  "From car parks to walkways to full architectural structures -- engineered, fabricated and installed end to end.";

export default function Solutions() {
  const [solutions, setSolutions] = useState([]);
  const [tree, setTree] = useState([]);
  const [status, setStatus] = useState("loading");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category") || "";

  useEffect(() => {
    let cancelled = false;

    Promise.all([getPublishedProducts(), getCategoryTree()])
      .then(([productList, categoryTree]) => {
        if (cancelled) return;
        setSolutions(productList);
        setTree(categoryTree);
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

  // Group sub-categories that actually have published products, under their parent.
  const groups = useMemo(() => {
    const counts = {};
    solutions.forEach((s) => {
      if (s.categorySlug) counts[s.categorySlug] = (counts[s.categorySlug] || 0) + 1;
    });

    return tree
      .map((parent) => ({
        ...parent,
        subCategories: parent.subCategories
          .filter((c) => counts[c.slug] > 0)
          .map((c) => ({ ...c, count: counts[c.slug] })),
      }))
      .filter((parent) => parent.subCategories.length > 0);
  }, [tree, solutions]);

  const allSubCategories = useMemo(
    () =>
      groups.flatMap((parent) =>
        parent.subCategories.map((c) => ({ ...c, parentName: parent.name }))
      ),
    [groups]
  );

  const activeCategory = allSubCategories.find((c) => c.slug === requestedCategory) || null;
  const activeSlug = activeCategory ? activeCategory.slug : "";

  const filtered = activeSlug
    ? solutions.filter((s) => s.categorySlug === activeSlug)
    : solutions;
  const visible = filtered.slice(0, visibleCount);

  function selectCategory(slug) {
    setVisibleCount(PAGE_SIZE);
    setSearchParams(slug ? { category: slug } : {}, { replace: true });
  }

  const sidebarItemClass = (active) =>
    `flex w-full items-start justify-between gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-gold text-brand-navy"
        : "text-brand-ink/70 hover:bg-brand-cream hover:text-brand-navy"
    }`;

  const heroTag = activeCategory ? activeCategory.parentName : DEFAULT_TAG;
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

      {/* Mobile category dropdown — hidden on desktop */}
      {status === "ready" && groups.length > 0 && (
        <div className="mx-auto max-w-container px-4 pt-8 sm:px-6 md:hidden">
          <label htmlFor="category-select" className="sr-only">
            Filter by category
          </label>
          <div className="relative">
            <select
              id="category-select"
              value={activeSlug}
              onChange={(e) => selectCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-brand-navy/15 bg-white px-4 py-3 pr-10 text-sm font-medium text-brand-navy shadow-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
            >
              <option value="">All Products ({solutions.length})</option>
              {groups.map((parent, index) => (
                <optgroup key={parent.slug} label={`${index + 1}. ${parent.name}`}>
                  {parent.subCategories.map((chip) => (
                    <option key={chip.slug} value={chip.slug}>
                      {chip.name} ({chip.count})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Sidebar + Grid */}
      <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex gap-10">
          {/* Category sidebar — desktop only */}
          {status === "ready" && groups.length > 0 && (
            <aside className="hidden w-64 shrink-0 md:block">
              <div className="sticky top-24 space-y-5">
                <button
                  type="button"
                  onClick={() => selectCategory("")}
                  className={sidebarItemClass(activeSlug === "")}
                >
                  <span className="flex-1 text-left leading-snug">All Products</span>
                  <span className="shrink-0 pt-0.5 text-xs opacity-60">{solutions.length}</span>
                </button>

                {groups.map((parent, index) => (
                  <div key={parent.slug}>
                    <p className="mb-2 px-4 text-sm font-bold uppercase tracking-wide text-brand-navy">
                      {index + 1}. {parent.name}
                    </p>
                    <div className="space-y-1">
                      {parent.subCategories.map((chip) => (
                        <button
                          key={chip.slug}
                          type="button"
                          onClick={() => selectCategory(chip.slug)}
                          className={sidebarItemClass(activeSlug === chip.slug)}
                        >
                          <span className="flex-1 text-left leading-snug">{chip.name}</span>
                          <span className="shrink-0 pt-0.5 text-xs opacity-60">{chip.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Products */}
          <div className="min-w-0 flex-1">
            {status === "loading" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-brand-cream/60" />
                ))}
              </div>
            )}

            {status === "error" && (
              <p className="text-sm text-red-600">
                Couldn't load products right now. Please refresh the page.
              </p>
            )}

            {status === "ready" && filtered.length === 0 && (
              <p className="text-sm text-brand-ink/60">No products found in this category.</p>
            )}

            {status === "ready" && filtered.length > 0 && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>
      </section>
    </main>
  );
}