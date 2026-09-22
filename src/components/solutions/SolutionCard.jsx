import { Link } from "react-router-dom";

export default function SolutionCard({ solution }) {
  const {
    slug,
    title,
    category,
    imageUrl,
    features = [],
    priceValue,
    priceUnit,
  } = solution;

  return (
    <Link
      to={`/products/${slug}`}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-brand-cream/60">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {category && (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
            {category}
          </p>
        )}

        <h3 className="mt-1 font-heading text-lg font-semibold text-brand-navy">
          {title}
        </h3>

        {features.length > 0 && (
          <p className="mt-2 text-sm text-brand-ink/60">
            {features.join(" · ")}
          </p>
        )}

        {/* spacer pushes price to the bottom regardless of text length above */}
        <div className="mt-auto pt-3">
          {priceValue && (
            <p className="font-semibold text-brand-navy">
              Approx. ₹{priceValue} / {priceUnit}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}