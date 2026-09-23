// One-time migration: adds a `parentSlug` (+ denormalized `parentName`) to
// every existing `categories/{slug}` doc, turning the flat category list
// into a 2-level Parent -> Sub-category hierarchy. Products are not touched.
//
// Usage (Node 20.6+; run from the project root):
//   node --env-file=.env scripts/migrate-categories-to-parents.mjs           # dry run
//   node --env-file=.env scripts/migrate-categories-to-parents.mjs --apply   # actually writes
//
// Safe to re-run (idempotent). Any category slug NOT in CATEGORY_TO_PARENT
// is left untouched and printed under "Unmapped" -- add it and re-run.

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
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
    "Missing VITE_FIREBASE_* variables. Run with: node --env-file=.env scripts/migrate-categories-to-parents.mjs"
  );
  process.exit(1);
}

const db = getFirestore(initializeApp(firebaseConfig));

// --- 1. The 9 parent categories to create -----------------------------
const PARENTS = [
  { slug: "tensile-structures", name: "Tensile Structures", order: 1 },
  { slug: "car-parking-structures", name: "Car Parking Structures", order: 2 },
  { slug: "swimming-pool-structures", name: "Swimming Pool Structures", order: 3 },
  { slug: "walkway-and-entrance-structures", name: "Walkway & Entrance Structures", order: 4 },
  { slug: "gazebo-and-outdoor-structures", name: "Gazebo & Outdoor Structures", order: 5 },
  { slug: "sports-structures", name: "Sports Structures", order: 6 },
  { slug: "tensile-umbrellas", name: "Tensile Umbrellas", order: 7 },
  { slug: "tensile-fabric-and-materials", name: "Tensile Fabric & Materials", order: 8 },
  { slug: "design-and-engineering-services", name: "Design & Engineering Services", order: 9 },
];

// --- 2. Existing category slug -> parent slug --------------------------
// Verify these against the real `categories` collection before --apply.
const CATEGORY_TO_PARENT = {
  "tensile-structure": "tensile-structures",
  "tensile-membrane-structure": "tensile-structures",
  "modular-tensile-structure": "tensile-structures",
  "pvc-tensile-fabric-canopies": "tensile-structures",
  "canopies": "tensile-structures",
  "tensile-fabric-structures": "tensile-structures",
  "outdoor-canopy": "tensile-structures",
  "outdoor-tent": "tensile-structures",
  "pagoda-tent": "tensile-structures",
  "prefabricated-structures": "tensile-structures",
  "tensile-canopies-pagoda-tent": "tensile-structures",
  "tensile-structure-and-fabric": "tensile-structures",

  "car-parking-tensile-structure": "car-parking-structures",
  "car-parking-structure": "car-parking-structures",
  "car-parking-shed": "car-parking-structures",
  "car-shed": "car-parking-structures",
  "tensile-car-canopy": "car-parking-structures",
  "car-parking-tensile-structure-manufacturers": "car-parking-structures",
  "mild-steel-parking-shed": "car-parking-structures",
  "parking-shed-fabrication": "car-parking-structures",

  "swimming-pool-tensile-structure": "swimming-pool-structures",
  "swimming-pool-tensile-cover": "swimming-pool-structures",

  "walkway-covering-structure": "walkway-and-entrance-structures",
  "entrance-tensile-structure": "walkway-and-entrance-structures",
  "bus-shelter": "walkway-and-entrance-structures",
  "tensile-structure-manufacturer": "walkway-and-entrance-structures",

  "gazebo-tensile-structure": "gazebo-and-outdoor-structures",
  "outdoor-shade": "gazebo-and-outdoor-structures",
  "shade-sail": "gazebo-and-outdoor-structures",

  "badminton-court-roofing-shed": "sports-structures",
  "auditorium-tensile-structures": "sports-structures",

  "tensile-umbrella": "tensile-umbrellas",
  "garden-umbrella": "tensile-umbrellas",
  "inverted-umbrella-tensile-structures": "tensile-umbrellas",

  "pvc-coated-fabric": "tensile-fabric-and-materials",
  "tensile-membrane": "tensile-fabric-and-materials",
  "high-strength-tensile-membrane": "tensile-fabric-and-materials",
  "tensile-fabric-for-use": "tensile-fabric-and-materials",

  "tensile-structure-designing-service": "design-and-engineering-services",
  "structure-service": "design-and-engineering-services",
};

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (nothing is written)\n");

  const snap = await getDocs(collection(db, "categories"));
  const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`Found ${categories.length} categor${categories.length === 1 ? "y" : "ies"} in Firestore.\n`);

  const parentBySlug = new Map(PARENTS.map((p) => [p.slug, p]));
  const existingSlugs = new Set(categories.map((c) => c.id));

  const toUpdate = [];
  const unmapped = [];
  const alreadyParent = [];

  for (const cat of categories) {
    if (parentBySlug.has(cat.id)) {
      alreadyParent.push(cat.id);
      continue;
    }
    const parentSlug = CATEGORY_TO_PARENT[cat.id];
    if (!parentSlug) {
      unmapped.push(cat.id);
      continue;
    }
    if (!parentBySlug.has(parentSlug)) {
      console.warn(`  ! "${cat.id}" maps to unknown parent "${parentSlug}" -- check PARENTS.`);
      continue;
    }
    if (cat.parentSlug === parentSlug) continue; // already correct
    toUpdate.push({
      slug: cat.id,
      parentSlug,
      parentName: parentBySlug.get(parentSlug).name,
    });
  }

  const newParents = PARENTS.filter((p) => !existingSlugs.has(p.slug));

  console.log(`Parent categories to create (${newParents.length}):`);
  newParents.forEach((p) => console.log(`  - ${p.slug}  ("${p.name}")`));

  console.log(`\nSub-categories to update with parentSlug (${toUpdate.length}):`);
  toUpdate.forEach((u) => console.log(`  - ${u.slug}  ->  ${u.parentSlug}`));

  if (alreadyParent.length) {
    console.log(`\nAlready a parent doc, skipped (${alreadyParent.length}):`);
    alreadyParent.forEach((s) => console.log(`  - ${s}`));
  }

  if (unmapped.length) {
    console.log(`\nUnmapped -- left untouched (${unmapped.length}):`);
    unmapped.forEach((s) => console.log(`  - ${s}`));
    console.log("  Add these to CATEGORY_TO_PARENT above and re-run.");
  }

  if (!APPLY) {
    console.log("\nDry run finished. Re-run with --apply to write.");
    return;
  }

  for (const p of newParents) {
    await setDoc(doc(db, "categories", p.slug), {
      name: p.name,
      slug: p.slug,
      description: "",
      coverImage: "",
      order: p.order,
      showOnHome: false,
      parentSlug: "",
      parentName: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const u of toUpdate) {
    await updateDoc(doc(db, "categories", u.slug), {
      parentSlug: u.parentSlug,
      parentName: u.parentName,
      updatedAt: serverTimestamp(),
    });
  }

  console.log(
    `\nDone. Created ${newParents.length} parent categories, updated ${toUpdate.length} sub-categories.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nMigration failed:", err);
    process.exit(1);
  });