import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  writeBatch,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { slugify } from "./cloudinaryUpload";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const productsRef = collection(db, "products");
const categoriesRef = collection(db, "categories");

/** Sort by numeric `order` (missing -> last), then by a text field. */
function byOrderThen(textKey) {
  return (a, b) => {
    const ao = Number.isFinite(a.order) ? a.order : 9999;
    const bo = Number.isFinite(b.order) ? b.order : 9999;
    if (ao !== bo) return ao - bo;
    return String(a[textKey] ?? "").localeCompare(String(b[textKey] ?? ""));
  };
}

/** A slug is used as the Firestore document id, so it must be clean. */
function assertSlug(value, label = "slug") {
  const s = String(value ?? "").trim();
  if (!s || s !== slugify(s)) {
    throw new Error(
      `Invalid ${label} "${value}". Use lowercase letters, numbers and hyphens only.`
    );
  }
  return s;
}

function prettifySlug(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toNumberOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Accepts `{ key: value }` or `[{ key, value }]`. Rows with empty key/value are dropped. */
export function normalizeSpecs(specs) {
  if (!specs) return [];
  const rows = Array.isArray(specs)
    ? specs
    : Object.entries(specs).map(([key, value]) => ({ key, value }));
  return rows
    .map((r) => ({
      key: String(r?.key ?? "").trim(),
      value: String(r?.value ?? "").trim(),
    }))
    .filter((r) => r.key && r.value);
}

function normalizeStringList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((x) => String(x ?? "").trim()).filter(Boolean))];
}

/**
 * Normalizes only the keys that were passed in (so partial updates are safe).
 * Firestore rejects `undefined`, so those are dropped here too.
 */
function normalizeProductFields(data = {}) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }

  // Managed by Firestore / this file, never taken from the caller.
  delete out.id;
  delete out.createdAt;
  delete out.updatedAt;

  for (const k of [
    "slug",
    "title",
    "shortDescription",
    "fullDescription",
    "imageUrl",
    "brochureUrl",
    "priceUnit",
    "moq",
    "category",
    "categorySlug",
    "importSource",
  ]) {
    if (k in out) out[k] = String(out[k] ?? "").trim();
  }

  if ("galleryUrls" in out) {
    out.galleryUrls = Array.isArray(out.galleryUrls)
      ? out.galleryUrls.filter(Boolean)
      : [];
  }
  if ("features" in out) out.features = normalizeStringList(out.features);
  if ("legacyCategories" in out) {
    out.legacyCategories = normalizeStringList(out.legacyCategories);
  }
  if ("specs" in out) out.specs = normalizeSpecs(out.specs);
  if ("priceValue" in out) out.priceValue = toNumberOrNull(out.priceValue);
  if ("order" in out) {
    const n = Number(out.order);
    out.order = Number.isFinite(n) ? n : 0;
  }
  if ("featured" in out) out.featured = Boolean(out.featured);
  if ("published" in out) out.published = Boolean(out.published);

  return out;
}

/**
 * Keeps `category` (display name) and `categorySlug` (source of truth) in sync
 * with the `categories` collection. If the category doesn't exist yet it is
 * created, so the "+ Add new category..." flow keeps working.
 */
async function resolveCategoryFields(out) {
  if (!("category" in out) && !("categorySlug" in out)) return;

  const slug = out.categorySlug ? slugify(out.categorySlug) : slugify(out.category);
  if (!slug) {
    out.category = "";
    out.categorySlug = "";
    return;
  }

  const snap = await getDoc(doc(db, "categories", slug));
  if (snap.exists()) {
    out.category = snap.data().name;
  } else {
    const name = out.category || prettifySlug(slug);
    await createCategory({ name, slug });
    out.category = name;
  }
  out.categorySlug = slug;
}

/* ------------------------------------------------------------------ */
/* Products  (collection: products, document id = slug)                */
/* ------------------------------------------------------------------ */

/** All products, sorted by `order`. Pass `{ publishedOnly: true }` for the public site. */
export async function getProducts({ publishedOnly = false } = {}) {
  const snap = await getDocs(productsRef);
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (publishedOnly) items = items.filter((p) => p.published !== false);
  return items.sort(byOrderThen("title"));
}

/** Public site: only published products. */
export async function getPublishedProducts() {
  return getProducts({ publishedOnly: true });
}

/** Homepage strip: featured + published. */
export async function getFeaturedProducts() {
  const snap = await getDocs(query(productsRef, where("featured", "==", true)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.published !== false)
    .sort(byOrderThen("title"));
}

/** One product by slug (= doc id). Returns null if missing. Includes drafts. */
export async function getProductBySlug(slug) {
  if (!slug || String(slug).includes("/")) return null;
  const snap = await getDoc(doc(db, "products", String(slug)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Public detail page: null for missing OR draft products. */
export async function getPublishedProductBySlug(slug) {
  const product = await getProductBySlug(slug);
  return product && product.published !== false ? product : null;
}

/**
 * Create a product. The document id is the slug (taken from `data.slug`, or
 * generated from the title). Throws if that slug is already taken.
 * `published` defaults to true; the importer passes `published: false`.
 */
export async function createProduct(data) {
  const fields = normalizeProductFields(data);
  if (!fields.title) throw new Error("Title is required.");
  const slug = assertSlug(fields.slug || slugify(fields.title), "product slug");

  await resolveCategoryFields(fields);

  const payload = {
    shortDescription: "",
    fullDescription: "",
    imageUrl: "",
    galleryUrls: [],
    category: "",
    categorySlug: "",
    featured: false,
    order: 0,
    priceValue: null,
    priceUnit: "",
    moq: "",
    specs: [],
    features: [],
    brochureUrl: "",
    published: true,
    legacyCategories: [],
    ...fields,
    slug,
  };

  const ref = doc(db, "products", slug);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      throw new Error(`A product with slug "${slug}" already exists.`);
    }
    tx.set(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return slug;
}

/**
 * Update a product by id (= slug). Only the passed fields change.
 * If `data.slug` differs from `id`, the document is MOVED to the new id
 * (a doc id can't be renamed). Returns the final slug.
 * Note: images already uploaded to Cloudinary stay in their old folder.
 */
export async function updateProduct(id, data) {
  const fields = normalizeProductFields(data);
  await resolveCategoryFields(fields);

  const newSlug = fields.slug ? assertSlug(fields.slug, "product slug") : id;
  const oldRef = doc(db, "products", id);

  if (newSlug === id) {
    await updateDoc(oldRef, { ...fields, slug: id, updatedAt: serverTimestamp() });
    return id;
  }

  const newRef = doc(db, "products", newSlug);
  await runTransaction(db, async (tx) => {
    const [oldSnap, newSnap] = await Promise.all([tx.get(oldRef), tx.get(newRef)]);
    if (!oldSnap.exists()) throw new Error("Product not found.");
    if (newSnap.exists()) {
      throw new Error(`A product with slug "${newSlug}" already exists.`);
    }
    tx.set(newRef, {
      ...oldSnap.data(),
      ...fields,
      slug: newSlug,
      updatedAt: serverTimestamp(),
    });
    tx.delete(oldRef);
  });
  return newSlug;
}

/** Delete a product by id (= slug). Cloudinary images are not deleted. */
export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}

/* ------------------------------------------------------------------ */
/* Categories  (collection: categories, document id = slug)            */
/* ------------------------------------------------------------------ */

/** All categories, sorted by `order` then name. */
export async function getCategories() {
  const snap = await getDocs(categoriesRef);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort(byOrderThen("name"));
}

/** One category by slug (= doc id), or null. */
export async function getCategory(slug) {
  if (!slug || String(slug).includes("/")) return null;
  const snap = await getDoc(doc(db, "categories", String(slug)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** `{ [categorySlug]: productCount }` for the admin Categories tab. */
export async function getCategoryProductCounts() {
  const products = await getProducts();
  return products.reduce((acc, p) => {
    if (p.categorySlug) acc[p.categorySlug] = (acc[p.categorySlug] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Create a category. Slug (= doc id) comes from `data.slug` or the name.
 * The slug is locked afterwards because Cloudinary folder names depend on it.
 */
export async function createCategory(data) {
  const name = String(data?.name ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  const slug = assertSlug(data.slug || slugify(name), "category slug");

  let order = Number(data.order);
  if (!Number.isFinite(order)) {
    const existing = await getCategories();
    order = existing.reduce((max, c) => Math.max(max, Number(c.order) || 0), 0) + 1;
  }

  const ref = doc(db, "categories", slug);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      throw new Error(`A category with slug "${slug}" already exists.`);
    }
    tx.set(ref, {
      name,
      slug,
      description: String(data.description ?? "").trim(),
      coverImage: String(data.coverImage ?? "").trim(),
      order,
      showOnHome: Boolean(data.showOnHome),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return slug;
}

/** Copy a renamed category's name onto all its products (batches of 400). */
async function renameCategoryOnProducts(categorySlug, name) {
  const snap = await getDocs(
    query(productsRef, where("categorySlug", "==", categorySlug))
  );
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) =>
      batch.update(d.ref, { category: name, updatedAt: serverTimestamp() })
    );
    await batch.commit();
  }
}

/** Update a category. Slug can't change. Renaming updates the name on its products. */
export async function updateCategory(slug, data) {
  if (data?.slug && data.slug !== slug) {
    throw new Error("A category slug can't be changed after it is created.");
  }
  const ref = doc(db, "categories", slug);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error("Category not found.");

  const update = { updatedAt: serverTimestamp() };
  if ("name" in data) {
    const name = String(data.name ?? "").trim();
    if (!name) throw new Error("Category name is required.");
    update.name = name;
  }
  if ("description" in data) update.description = String(data.description ?? "").trim();
  if ("coverImage" in data) update.coverImage = String(data.coverImage ?? "").trim();
  if ("showOnHome" in data) update.showOnHome = Boolean(data.showOnHome);
  if ("order" in data) {
    const n = Number(data.order);
    update.order = Number.isFinite(n) ? n : 0;
  }

  await updateDoc(ref, update);
  if (update.name && update.name !== current.data().name) {
    await renameCategoryOnProducts(slug, update.name);
  }
}

/** Delete a category. Blocked while any product still uses it. */
export async function deleteCategory(slug) {
  const countSnap = await getCountFromServer(
    query(productsRef, where("categorySlug", "==", slug))
  );
  const count = countSnap.data().count;
  if (count > 0) {
    throw new Error(
      `This category still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`
    );
  }
  await deleteDoc(doc(db, "categories", slug));
}

/* ------------------------------------------------------------------ */
/* Legacy names (so existing pages/forms keep working)                 */
/* ------------------------------------------------------------------ */
/* These now read/write the `products` collection. They can be removed */
/* once every import of them has been renamed to the product functions.*/

export const getSolutions = getProducts;
export const getFeaturedSolutions = getFeaturedProducts;
export const getSolutionBySlug = getProductBySlug;
export const getSolutionById = getProductBySlug; // id === slug now
export const addSolution = createProduct;
export const updateSolution = updateProduct;
export const deleteSolution = deleteProduct;

/* ------------------------------------------------------------------ */
/* Inquiries (contact form)                                            */
/* ------------------------------------------------------------------ */

const inquiriesRef = collection(db, "inquiries");

/** Submit a contact form entry. `data`: { name, email, phone, message }. */
export async function addInquiry(data) {
  const docRef = await addDoc(inquiriesRef, {
    ...data,
    status: "new",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** All inquiries, newest first -- for the admin dashboard. */
export async function getInquiries() {
  const q = query(inquiriesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Mark an inquiry as read. */
export async function markInquiryRead(id) {
  await updateDoc(doc(db, "inquiries", id), { status: "read" });
}

/* ------------------------------------------------------------------ */
/* Site settings (single doc)                                          */
/* ------------------------------------------------------------------ */

const siteSettingsDoc = doc(db, "siteSettings", "main");

/** Editable homepage bits: stats bar, contact info, social links. Returns null if not yet created. */
export async function getSiteSettings() {
  const snap = await getDoc(siteSettingsDoc);
  return snap.exists() ? snap.data() : null;
}

/** Create/update the single site settings doc (creates it on first save). */
export async function updateSiteSettings(data) {
  await setDoc(siteSettingsDoc, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/* ------------------------------------------------------------------ */
/* Import (Phase 13 — categories + products from a parsed JSON file)   */
/* ------------------------------------------------------------------ */

/**
 * Loads what `importParser.parseImportFile` needs to resolve categories and
 * flag "already exists" rows, without re-reading Firestore per row.
 */
export async function getImportContext() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return {
    categorySlugs: new Set(categories.map((c) => c.slug)),
    categoryNamesBySlug: new Map(categories.map((c) => [c.slug, c.name])),
    productSlugs: new Set(products.map((p) => p.slug ?? p.id)),
  };
}

/**
 * Writes parsed, normalized categories + products (from `parseImportFile`)
 * to Firestore in batches of <=450 docs.
 *
 * `mode`:
 *  - "create": only rows that don't exist yet are written; existing ones are
 *    counted as "skipped".
 *  - "upsert": existing rows are updated too (matched by slug). Only the
 *    fields present on the parsed row are touched — imageUrl, galleryUrls,
 *    brochureUrl, published, featured and order are never part of an import
 *    row, so they are never overwritten by this function.
 *
 * Categories are written before products, in the same call, so a brand-new
 * category is already committed by the time its products batch runs.
 * Idempotent: running the same parsed payload twice with the same `existing`
 * snapshot re-classifies everything as "existing" and creates no duplicates
 * (doc id = slug).
 *
 * Returns `{ categories: {created,updated,skipped}, products: {created,updated,skipped} }`.
 */
export async function runImport({ categories = [], products = [] }, mode = "create") {
  const result = {
    categories: { created: 0, updated: 0, skipped: 0 },
    products: { created: 0, updated: 0, skipped: 0 },
  };

  for (let i = 0; i < categories.length; i += 450) {
    const chunk = categories.slice(i, i + 450);
    const batch = writeBatch(db);

    chunk.forEach((cat) => {
      const ref = doc(db, "categories", cat.slug);

      if (cat.existsInFirestore) {
        if (mode !== "upsert") {
          result.categories.skipped += 1;
          return;
        }
        const update = { updatedAt: serverTimestamp() };
        if (cat.name) update.name = cat.name;
        if (cat.description) update.description = cat.description;
        if (Number.isFinite(cat.order)) update.order = cat.order;
        if (cat.showOnHome) update.showOnHome = true;
        batch.update(ref, update);
        result.categories.updated += 1;
      } else {
        batch.set(ref, {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || "",
          coverImage: "",
          order: Number.isFinite(cat.order) ? cat.order : 0,
          showOnHome: Boolean(cat.showOnHome),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        result.categories.created += 1;
      }
    });

    await batch.commit();
  }

  const productUpdateKeys = [
    "title",
    "category",
    "categorySlug",
    "shortDescription",
    "fullDescription",
    "priceValue",
    "priceUnit",
    "moq",
    "features",
    "specs",
    "legacyCategories",
    "importSource",
  ];

  for (let i = 0; i < products.length; i += 450) {
    const chunk = products.slice(i, i + 450);
    const batch = writeBatch(db);

    chunk.forEach((p) => {
      const ref = doc(db, "products", p.slug);

      if (p.existsInFirestore) {
        if (mode !== "upsert") {
          result.products.skipped += 1;
          return;
        }
        const update = { updatedAt: serverTimestamp() };
        for (const key of productUpdateKeys) {
          if (p[key] !== undefined) update[key] = p[key];
        }
        batch.update(ref, update);
        result.products.updated += 1;
      } else {
        batch.set(ref, {
          title: p.title,
          slug: p.slug,
          category: p.category || "",
          categorySlug: p.categorySlug || "",
          shortDescription: p.shortDescription || "",
          fullDescription: p.fullDescription || "",
          imageUrl: "",
          galleryUrls: [],
          featured: false,
          order: 0,
          priceValue: p.priceValue ?? null,
          priceUnit: p.priceUnit || "",
          moq: p.moq || "",
          specs: p.specs || [],
          features: p.features || [],
          brochureUrl: "",
          published: false,
          legacyCategories: p.legacyCategories || [],
          importSource: p.importSource || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        result.products.created += 1;
      }
    });

    await batch.commit();
  }

  return result;
}

/** Builds a downloadable backup in the same shape `parseImportFile` reads. */
export async function exportImportJson() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return {
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      order: c.order,
      showOnHome: Boolean(c.showOnHome),
    })),
    products: products.map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category || "",
      shortDescription: p.shortDescription || "",
      fullDescription: p.fullDescription || "",
      priceValue: p.priceValue ?? null,
      priceUnit: p.priceUnit || "",
      moq: p.moq || "",
      features: p.features || [],
      specs: Object.fromEntries((p.specs || []).map((r) => [r.key, r.value])),
      legacyCategories: p.legacyCategories || [],
      importSource: p.importSource || "",
    })),
  };
}