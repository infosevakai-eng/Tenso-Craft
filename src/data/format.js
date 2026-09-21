/**
 * "Approx. ₹250 / sq ft" -- or "" when the product has no price, so callers can
 * simply do `{label && <p>{label}</p>}`.
 */
export function formatPrice(priceValue, priceUnit) {
  const value = Number(priceValue);
  if (!Number.isFinite(value) || value <= 0) return "";

  const amount = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
  const unit = String(priceUnit ?? "").trim();
  return `Approx. ₹${amount}${unit ? ` / ${unit}` : ""}`;
}