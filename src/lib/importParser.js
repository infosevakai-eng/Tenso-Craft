import { slugify } from "./cloudinaryUpload";

// Anything longer than this is still imported, just flagged for a human to skim.
const LONG_VALUE_CHARS = 800;

function cleanStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

/** Drops null/""/empty-array/empty-object values so they are never written. */
function pruneEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!isEmpty(v)) out[k] = v;
  }
  return out;
}

/** `{ key: value }` -> ordered `[{ key, value }]`. Rows with an empty key or value are dropped. */
function normalizeSpecsObject(specs) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];
  return Object.entries(specs)
    .map(([key, value]) => ({ key: cleanStr(key), value: cleanStr(value) }))
    .filter((r) => r.key && r.value);
}

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(cleanStr).filter(Boolean))];
}

/**
 * Parses and validates one import JSON file.
 *
 * `existing` lets the parser flag rows that already exist in Firestore, and
 * lets a product's `category` match an existing category by name even if it
 * isn't repeated in this file's own `categories` array:
 *   { categorySlugs: Set<string>, categoryNamesBySlug: Map<string,string>, productSlugs: Set<string> }
 *
 * Never throws for bad business data — only for unparsable JSON, reported as
 * the sole entry in `errors`. Rows with a blocking problem are left out of
 * the returned `categories` / `products` arrays; everything else is
 * normalized and ready to hand to `runImport`.
 */
export function parseImportFile(rawText, existing = {}) {
  const existingCategorySlugs = existing.categorySlugs || new Set();
  const existingCategoryNamesBySlug = existing.categoryNamesBySlug || new Map();
  const existingProductSlugs = existing.productSlugs || new Set();

  const errors = [];
  const warnings = [];
  let data;

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return {
      categories: [],
      products: [],
      errors: [`Invalid JSON: ${e.message}`],
      warnings: [],
    };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      categories: [],
      products: [],
      errors: ['Root of the file must be an object with "categories" and "products" arrays.'],
      warnings: [],
    };
  }

  const rawCategories = Array.isArray(data.categories) ? data.categories : [];
  const rawProducts = Array.isArray(data.products) ? data.products : [];

  /* ---------------------------- Categories ---------------------------- */

  const categories = [];
  const categorySlugsInFile = new Set();
  const categoryNameToSlugInFile = new Map(); // lowercase name -> slug

  rawCategories.forEach((raw, i) => {
    const row = i + 1;
    const name = cleanStr(raw?.name);
    if (!name) {
      errors.push(`Category #${row}: "name" is required.`);
      return;
    }

    const slug = slugify(cleanStr(raw?.slug) || name);
    if (!slug) {
      errors.push(`Category #${row} ("${name}"): could not derive a valid slug.`);
      return;
    }
    if (categorySlugsInFile.has(slug)) {
      errors.push(`Category #${row} ("${name}"): duplicate slug "${slug}" in this file.`);
      return;
    }
    categorySlugsInFile.add(slug);
    categoryNameToSlugInFile.set(name.toLowerCase(), slug);

    const description = cleanStr(raw?.description);
    if (description.length > LONG_VALUE_CHARS) {
      warnings.push(`Category "${name}": description is very long (${description.length} chars).`);
    }

    const orderNum = Number(raw?.order);
    const existsInFirestore = existingCategorySlugs.has(slug);
    if (existsInFirestore) {
      warnings.push(`Category "${name}": slug "${slug}" already exists in Firestore.`);
    }

    categories.push(
      pruneEmpty({
        name,
        slug,
        description,
        order: Number.isFinite(orderNum) ? orderNum : undefined,
        showOnHome: raw?.showOnHome ? true : undefined,
        existsInFirestore,
      })
    );
  });

  /* ----------------------------- Products ------------------------------ */

  const products = [];
  const productSlugsInFile = new Set();

  rawProducts.forEach((raw, i) => {
    const row = i + 1;
    const title = cleanStr(raw?.title);
    const categoryInput = cleanStr(raw?.category);

    if (!title) {
      errors.push(`Product #${row}: "title" is required.`);
      return;
    }
    if (!categoryInput) {
      errors.push(`Product #${row} ("${title}"): "category" is required.`);
      return;
    }

    const slug = slugify(cleanStr(raw?.slug) || title);
    if (!slug) {
      errors.push(`Product #${row} ("${title}"): could not derive a valid slug.`);
      return;
    }
    if (productSlugsInFile.has(slug)) {
      errors.push(`Product #${row} ("${title}"): duplicate slug "${slug}" in this file.`);
      return;
    }
    productSlugsInFile.add(slug);

    // `category` may be a slug or a display name, matched against this
    // file's own categories first, then against what's already in Firestore.
    const inputAsSlug = slugify(categoryInput);
    let categorySlug = null;
    let categoryName = null;

    if (categorySlugsInFile.has(inputAsSlug)) {
      categorySlug = inputAsSlug;
      categoryName = categories.find((c) => c.slug === inputAsSlug)?.name || categoryInput;
    } else if (categoryNameToSlugInFile.has(categoryInput.toLowerCase())) {
      categorySlug = categoryNameToSlugInFile.get(categoryInput.toLowerCase());
      categoryName = categories.find((c) => c.slug === categorySlug)?.name || categoryInput;
    } else if (existingCategorySlugs.has(inputAsSlug)) {
      categorySlug = inputAsSlug;
      categoryName = existingCategoryNamesBySlug.get(inputAsSlug) || categoryInput;
    } else {
      const existingMatch = [...existingCategoryNamesBySlug.entries()].find(
        ([, name]) => name.toLowerCase() === categoryInput.toLowerCase()
      );
      if (existingMatch) {
        categorySlug = existingMatch[0];
        categoryName = existingMatch[1];
      }
    }

    if (!categorySlug) {
      errors.push(
        `Product #${row} ("${title}"): category "${categoryInput}" was not found in this file's categories or in Firestore.`
      );
      return;
    }

    const specs = normalizeSpecsObject(raw?.specs);
    if (specs.length === 0) {
      warnings.push(`Product "${title}": no specs.`);
    }

    const fullDescription = cleanStr(raw?.fullDescription);
    if (fullDescription.length > LONG_VALUE_CHARS) {
      warnings.push(`Product "${title}": fullDescription is very long (${fullDescription.length} chars).`);
    }

    const priceValueRaw = raw?.priceValue;
    const priceValueNum =
      priceValueRaw === "" || priceValueRaw === null || priceValueRaw === undefined
        ? null
        : Number(priceValueRaw);
    if (priceValueRaw !== undefined && priceValueRaw !== null && priceValueRaw !== "" && !Number.isFinite(priceValueNum)) {
      warnings.push(`Product "${title}": priceValue "${priceValueRaw}" is not a number and was dropped.`);
    }

    const existsInFirestore = existingProductSlugs.has(slug);
    if (existsInFirestore) {
      warnings.push(`Product "${title}": slug "${slug}" already exists in Firestore.`);
    }

    products.push(
      pruneEmpty({
        title,
        slug,
        category: categoryName,
        categorySlug,
        shortDescription: cleanStr(raw?.shortDescription),
        fullDescription,
        priceValue: Number.isFinite(priceValueNum) ? priceValueNum : undefined,
        priceUnit: cleanStr(raw?.priceUnit),
        moq: cleanStr(raw?.moq),
        features: normalizeList(raw?.features),
        specs,
        legacyCategories: normalizeList(raw?.legacyCategories),
        importSource: cleanStr(raw?.importSource),
        existsInFirestore,
      })
    );
  });

  return { categories, products, errors, warnings };
}

/** Summary line: "3 categories new, 1 updated · 42 products new, 5 updated". */
export function summarizeImport({ categories, products }) {
  const catNew = categories.filter((c) => !c.existsInFirestore).length;
  const catUpdate = categories.length - catNew;
  const prodNew = products.filter((p) => !p.existsInFirestore).length;
  const prodUpdate = products.length - prodNew;
  return `${categories.length} categories (${catNew} new, ${catUpdate} existing) · ${products.length} products (${prodNew} new, ${prodUpdate} existing)`;
}