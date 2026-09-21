import { Link } from "react-router-dom";
import { optimizedUrl } from "../../lib/cloudinary";
import { formatPrice } from "../../lib/format";

export default function SolutionCard({ solution }) {
  const price = formatPrice(solution.priceValue, solution.priceUnit);

  // Imported products often have no short description yet -- show their first
  // few features instead of leaving the card body empty.
  const summary =
    solution.shortDescription ||
    (Array.isArray(solution.features) ? solution.features.slice(0, 3).join(" · ") : "");

  return (
    <Link
      to={`/products/${solution.slug}`}
      className="group block overflow-hidden rounded-2xl border border-brand-navy/10 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image, contained with padding like a product shot */}
      <div className="aspect-[3/2] w-full overflow-hidden bg-brand-cream/60 p-4">
        {solution.imageUrl ? (
          <img
            src={optimizedUrl(solution.imageUrl)}
            alt={solution.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg text-xs text-brand-ink/40">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {solution.category && (
          <p className="text-xs font-medium uppercase tracking-wide text-brand-gold">
            {solution.category}
          </p>
        )}
        <h3 className="mt-1.5 font-heading text-base font-semibold text-brand-navy">
          {solution.title}
        </h3>
        {summary && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-ink/60">
            {summary}
          </p>
        )}
        {price && (
          <p className="mt-3 text-sm font-semibold text-brand-navy">{price}</p>
        )}
      </div>
    </Link>
  );
}