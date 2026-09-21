import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getPublishedProductBySlug, getPublishedProducts } from "../lib/firestore";
import { optimizedUrl } from "../lib/cloudinary";
import { formatPrice } from "../lib/format";
import SolutionCard from "../components/solutions/SolutionCard";

const MAX_RELATED = 12;

export default function SolutionDetail() {
  const { slug } = useParams();
  const [solution, setSolution] = useState(null);
  const [status, setStatus] = useState("loading");
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setRelated([]);
    setActiveImage(0);

    // Returns null for missing AND draft products, so drafts show "not found".
    getPublishedProductBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setStatus("not-found");
          return;
        }
        setSolution(data);
        setStatus("ready");

        // Related solutions: other published products in the same category
        if (data.categorySlug) {
          getPublishedProducts()
            .then((all) => {
              if (cancelled) return;
              setRelated(
                all
                  .filter((s) => s.categorySlug === data.categorySlug && s.slug !== data.slug)
                  .slice(0, MAX_RELATED)
              );
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

  // Browser tab title, restored when leaving the page.
  useEffect(() => {
    if (status !== "ready" || !solution?.title) return undefined;
    const previous = document.title;
    document.title = `${solution.title} | Tenso Craft`;
    return () => {
      document.title = previous;
    };
  }, [status, solution]);

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

  // Main image first, then the gallery (no duplicates).
  const images = [
    ...new Set(
      [solution.imageUrl, ...(Array.isArray(solution.galleryUrls) ? solution.galleryUrls : [])].filter(
        Boolean
      )
    ),
  ];
  const currentImage = images[Math.min(activeImage, images.length - 1)];

  const price = formatPrice(solution.priceValue, solution.priceUnit);
  const specs = Array.isArray(solution.specs) ? solution.specs : [];
  const features = Array.isArray(solution.features) ? solution.features : [];

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

        {/* Product-style layout: images left, content right */}
        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Left: main image + thumbnails */}
          <div className="lg:sticky lg:top-24">
            <div className="aspect-[3/2] w-full overflow-hidden rounded-2xl bg-brand-cream/60 p-4">
              {currentImage ? (
                <img
                  src={optimizedUrl(currentImage)}
                  alt={solution.title}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl text-sm text-brand-ink/40">
                  No image
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === activeImage ? "true" : undefined}
                    className={`h-16 w-24 flex-none overflow-hidden rounded-lg border-2 transition-colors ${
                      index === activeImage
                        ? "border-brand-gold"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={optimizedUrl(url)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: content */}
          <div>
            {solution.category && (
              <Link
                to={
                  solution.categorySlug
                    ? `/solutions?category=${encodeURIComponent(solution.categorySlug)}`
                    : "/solutions"
                }
                className="text-sm font-medium uppercase tracking-widest text-brand-gold hover:text-brand-navy"
              >
                {solution.category}
              </Link>
            )}
            <h1 className="mt-2 font-heading text-3xl font-semibold text-brand-navy sm:text-4xl">
              {solution.title}
            </h1>

            {(price || solution.moq) && (
              <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                {price && (
                  <p className="font-heading text-2xl font-semibold text-brand-navy">{price}</p>
                )}
                {solution.moq && (
                  <p className="text-sm text-brand-ink/60">
                    Minimum order:{" "}
                    <span className="font-medium text-brand-navy">{solution.moq}</span>
                  </p>
                )}
              </div>
            )}

            {solution.shortDescription && (
              <p className="mt-4 text-base leading-relaxed text-brand-ink/70">
                {solution.shortDescription}
              </p>
            )}

            {features.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full border border-brand-navy/15 bg-white px-3 py-1 text-xs font-medium text-brand-navy"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA block */}
            <div className="mt-8 rounded-xl bg-brand-cream p-6">
              <p className="font-heading text-lg font-semibold text-brand-navy">
                Interested in this solution?
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  to={`/contact?product=${encodeURIComponent(solution.slug)}`}
                  className="inline-block rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
                >
                  Get a Quote →
                </Link>
                {solution.brochureUrl && (
                  <a
                    href={solution.brochureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-navy/20 bg-white px-5 py-3 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-gold hover:text-brand-gold"
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                    Download brochure
                  </a>
                )}
              </div>
            </div>

            {/* Specifications */}
            {specs.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-semibold text-brand-navy">
                  Specifications
                </h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-brand-navy/10">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-brand-navy/10">
                      {specs.map((row, index) => (
                        <tr key={`${row.key}-${index}`}>
                          <th
                            scope="row"
                            className="w-2/5 bg-brand-cream/60 px-4 py-2.5 align-top font-medium text-brand-navy"
                          >
                            {row.key}
                          </th>
                          <td className="px-4 py-2.5 text-brand-ink/70">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Full description */}
            {solution.fullDescription && (
              <div className="mt-10 border-t border-brand-navy/10 pt-8">
                <h2 className="font-heading text-xl font-semibold text-brand-navy">
                  About this solution
                </h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-brand-ink/70">
                  {solution.fullDescription}
                </p>
              </div>
            )}
          </div>
        </div>

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