import { Link } from "react-router-dom";
import { optimizedUrl } from "../../lib/cloudinary";

export default function SolutionCard({ solution }) {
  return (
    <Link
      to={`/solutions/${solution.slug}`}
      className="group block overflow-hidden rounded-2xl border border-brand-navy/10 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image, contained with padding like a product shot */}
      <div className="aspect-[3/2] w-full overflow-hidden bg-brand-cream/60 p-4">
        {solution.imageUrl ? (
          <img
            src={optimizedUrl(solution.imageUrl)}
            alt={solution.title}
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
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-ink/60">
          {solution.shortDescription}
        </p>
      </div>
    </Link>
  );
}