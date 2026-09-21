// One-time migration: `solutions` (random doc ids) -> `products` (slug doc ids)
// and creates a `categories` doc (slug id) for every distinct category found.
//
// Usage (Node 20.6+; run from the project root):
//   node --env-file=.env scripts/migrate-solutions-to-products.mjs           # dry run, writes nothing
//   node --env-file=.env scripts/migrate-solutions-to-products.mjs --apply   # actually writes
//
// - Safe to run more than once: existing products/categories are skipped.
// - The old `solutions` collection is NOT touched or deleted.
// - Requires the new firestore.rules to be deployed first (products/categories).

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const APPLY = process.argv.includes("--apply");

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error(
    "Missing VITE_FIREBASE_* variables. Run with: node --env-file=.env scripts/migrate-solutions-to-products.mjs"
  );
  process.exit(1);
}

// Same rules as slugify() in src/lib/cloudinaryUpload.js
// (copied because that file uses import.meta.env and can't run in plain Node).
function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const db = getFirestore(initializeApp(firebaseConfig));

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (nothing is written)\n");

  const snap = await getDocs(collection(db, "solutions"));
  const solutions = snap.docs
    .map((d) => ({ oldId: d.id, ...d.data() }))
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  console.log(`Found ${solutions.length} document(s) in "solutions".\n`);

  const categories = new Map(); // slug -> name (first spelling wins)
  const products = [];
  const skipped = [];
  const seenSlugs = new Set();

  for (const s of solutions) {
    const title = String(s.title ?? "").trim();
    const slug = slugify(s.slug || title);

    if (!slug) {
      skipped.push(`${s.oldId}: no slug/title`);
      continue;
    }
    if (seenSlugs.has(slug)) {
      skipped.push(`${s.oldId}: duplicate slug "${slug}" inside solutions`);
      continue;
    }
    seenSlugs.add(slug);

    const existing = await getDoc(doc(db, "products", slug));
    if (existing.exists()) {
      skipped.push(`${s.oldId}: products/${slug} already exists`);
      continue;
    }

    const categoryName = String(s.category ?? "").trim();
    const categorySlug = slugify(categoryName);
    if (categorySlug && !categories.has(categorySlug)) {
      categories.set(categorySlug, categoryName);
    }

    products.push({
      slug,
      data: {
        title: title || slug,
        slug,
        category: categorySlug ? categories.get(categorySlug) : "",
        categorySlug,
        shortDescription: s.shortDescription ?? "",
        fullDescription: s.fullDescription ?? "",
        imageUrl: s.imageUrl ?? "",
        galleryUrls: Array.isArray(s.galleryUrls) ? s.galleryUrls : [],
        featured: Boolean(s.featured),
        order: Number.isFinite(Number(s.order)) ? Number(s.order) : 0,
        priceValue: null,
        priceUnit: "",
        moq: "",
        specs: [],
        features: [],
        brochureUrl: "",
        published: true,
        legacyCategories: [],
        createdAt: s.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    });
  }

  // Categories that don't exist yet.
  const newCategories = [];
  let categoryOrder = 0;
  for (const [slug, name] of categories) {
    categoryOrder += 1;
    const existing = await getDoc(doc(db, "categories", slug));
    if (!existing.exists()) newCategories.push({ slug, name, order: categoryOrder });
  }

  console.log(`Categories to create (${newCategories.length}):`);
  newCategories.forEach((c) => console.log(`  - ${c.slug}  ("${c.name}")`));
  console.log(`\nProducts to create (${products.length}):`);
  products.forEach((p) =>
    console.log(`  - products/${p.slug}  [category: ${p.data.categorySlug || "none"}]`)
  );
  if (skipped.length) {
    console.log(`\nSkipped (${skipped.length}):`);
    skipped.forEach((m) => console.log(`  - ${m}`));
  }

  if (!APPLY) {
    console.log("\nDry run finished. Re-run with --apply to write.");
    return;
  }

  for (const c of newCategories) {
    await setDoc(doc(db, "categories", c.slug), {
      name: c.name,
      slug: c.slug,
      description: "",
      coverImage: "",
      order: c.order,
      showOnHome: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  for (const p of products) {
    await setDoc(doc(db, "products", p.slug), p.data);
  }
  console.log(
    `\nDone. Wrote ${newCategories.length} categories and ${products.length} products.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nMigration failed:", err);
    process.exit(1);
  });
