/**
 * Formats a product's price for display, or "" if there's nothing to show.
 * Price is optional per product — hide it entirely rather than show a blank.
 *
 * formatPrice(250, "sq ft")   -> "Approx. ₹250 / sq ft"
 * formatPrice(250, "")        -> "Approx. ₹250"
 * formatPrice(null, "sq ft")  -> ""
 * formatPrice("", "sq ft")    -> ""
 */
export function formatPrice(priceValue, priceUnit = "") {
  if (priceValue === null || priceValue === undefined || priceValue === "") return "";
  const n = Number(priceValue);
  if (!Number.isFinite(n)) return "";

  const amount = n.toLocaleString("en-IN");
  const unit = String(priceUnit ?? "").trim();
  return unit ? `Approx. ₹${amount} / ${unit}` : `Approx. ₹${amount}`;
}