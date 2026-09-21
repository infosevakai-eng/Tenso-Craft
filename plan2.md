# Tenso Craft — Plan 2: Categories, Product Format & Bulk Import

Continuation of `plan.md` (Phases 1–8). This plan covers:

1. A real **Categories** collection with its own admin tab.
2. An upgraded **product (solution) format** — price, MOQ, spec table, features, brochure, published/draft.
3. A **bulk import** (JSON) for **categories + products text data** from the old tensocraft.com listing.
4. A **manual image workflow** — images are NOT imported; they are added later, one product at a time, from the admin edit form.

Admin UI text stays in **English**. Existing rules still apply: Cloudinary uploads go to `TensoCraft/<category-slug>/<product-slug>`, and the word "Uncategorized" is never shown in the UI.

---

## 0. Decisions locked in

| Topic | Decision |
|---|---|
| Images | Not part of import. Added later via admin edit form (Cloudinary → URL saved in Firestore). |
| Import scope | Categories **and** products, from one `.json` file. |
| Import format | JSON: `{ categories: [...], products: [...] }`. Specs are a key → value object per product, so a product only carries the specs it actually has (no empty columns). |
| Imported products | Saved as **Draft** (`published: false`) so half-finished products (no image) never appear on the public site. |
| Re-import safety | Import **never** overwrites images, brochure, or the `published` flag of an existing product. |
| Collections | New data lives in **`products`** (replaces `solutions`). **Document ID = slug** everywhere (products and categories) — no random IDs. |
| Category storage | New `categories` collection. Doc ID = category slug. |
| Public labels/routes | Keep "Solutions" and `/solutions/:slug` for now (no route breakage). Rename later if wanted. |

### Open items (defaults in brackets, change anytime)
- Show price on the public site? [Optional per product; hidden if empty.]
- Delete a category that still has products? [Blocked until products are moved.]
- Old categories `Architectural / Commercial / Residential` on the live site? [Kept as normal editable categories; new ones added beside them.]

---

## 1. Data model

### `categories/{slug}`
| Field | Type | Notes |
|---|---|---|
| `name` | string | Required |
| `slug` | string | Required, unique, **locked after creation** (Cloudinary folder names depend on it) |
| `description` | string | Optional |
| `coverImage` | string (URL) | Optional, Cloudinary |
| `order` | number | Sort order |
| `showOnHome` | boolean | Default false |
| `createdAt`, `updatedAt` | timestamp | |

### `products/{slug}` — fields
Doc ID **is** the slug, and a `slug` field with the same value is stored too (rules enforce they match). Uniqueness comes for free from the doc ID. Changing a product's slug **moves** the doc to the new ID (a doc ID can't be renamed); Cloudinary images already uploaded stay in the old folder.

New / changed fields:
| Field | Type | Notes |
|---|---|---|
| `categorySlug` | string | **Source of truth** for category |
| `category` | string | Denormalized category *name* (keeps existing code working). Batch-updated when a category is renamed. Empty string = no category. |
| `priceValue` | number \| null | Optional, e.g. 250 |
| `priceUnit` | string | e.g. `sq ft` |
| `moq` | string | e.g. `10 sq ft` |
| `specs` | array of `{ key, value }` | **Ordered, flexible** (spec keys differ per product) |
| `features` | string[] | Tags, e.g. Waterproof, UV Resistant |
| `brochureUrl` | string | Optional PDF (Cloudinary) |
| `published` | boolean | `false` = hidden from public site |
| `legacyCategories` | string[] | Old-site categories the product came from (traceability) |
| `importSource` | string | e.g. `tensocraft.com-2026` (only set by importer) |

Existing fields carried over with their **real names**: `title`, `slug`, `shortDescription`, `fullDescription`, `imageUrl` (main image), `galleryUrls`, `featured`, `order`, `createdAt`, `updatedAt`. (Earlier drafts of this plan said `mainImage` / `galleryImages` — those names are wrong; the code and database use `imageUrl` / `galleryUrls`.)

`published` defaults to `true` when a product is created from code/admin; the importer passes `published: false` explicitly.

### Migration of existing data
- Existing `solutions` docs (currently 5, random IDs) are copied to `products/<slug>` with `categorySlug`, `published: true`, `specs: []`, `features: []`, and matching `categories/<slug>` docs are created from their category strings. Done by `scripts/migrate-solutions-to-products.mjs` (dry run by default, `--apply` to write, safe to re-run).
- The old `solutions` collection is left untouched; delete it manually in the Firebase console once everything is verified, then remove its block from `firestore.rules`.

### Firestore rules
- Add `products` and `categories`: open read/delete, and create/update only when the `slug` field equals the doc ID. Everything else stays as before (`solutions` open until deleted, `inquiries` create-only).
- **Note:** the whole admin, including Import, sits behind the client-side login only. Anyone hitting Firestore directly can write. Acceptable for this site, but do not reuse the pattern for sensitive data.

### Querying
- ~250 products max, so **fetch all and filter/sort on the client** instead of composite indexes (`published` + `order` + `category`). Cache the list in memory during the session.

---

## 2. Phases

### Phase 9 — Data layer + migration
- Rewrite `src/lib/firestore.js`: product functions on the `products` collection with slug doc IDs (`getProducts`, `getPublishedProducts`, `getFeaturedProducts`, `getProductBySlug`, `getPublishedProductBySlug`, `createProduct`, `updateProduct`, `deleteProduct`) and category functions (`getCategories`, `getCategory`, `getCategoryProductCounts`, `createCategory`, `updateCategory`, `deleteCategory`).
- The old names (`getSolutions`, `addSolution`, `getSolutionBySlug`, ...) stay as aliases to the new functions, so existing pages and the admin form keep working until they are updated in Phases 10–12. Public pages still show drafts until Phase 12 switches them to the `Published` functions, so **don't run the import (Phase 13) before Phase 12.**
- `slugify` is reused from `cloudinaryUpload.js`. From Phase 11 on, build Cloudinary folders from `categorySlug` (not the category name), so renaming a category never changes its folder.
- Update `firestore.rules` and deploy them **before** running the migration.
- Run `scripts/migrate-solutions-to-products.mjs` (dry run first).

**Done when:** `products` and `categories` exist with slug IDs, the site and admin still work exactly as before, and nothing on the public site broke.

### Phase 10 — Admin: Categories tab
- Admin nav becomes tabs: **Solutions | Categories | Import**.
- New pages/components:
  - `src/pages/admin/AdminCategories.jsx` (list: name, slug, product count, order, show-on-home, Edit/Delete)
  - `src/components/admin/CategoryForm.jsx` (add/edit modal or page)
- Rules:
  - Slug auto-generated from name, editable on create, **read-only on edit**.
  - Rename → batch-update `category` (name) on that category's products.
  - Delete blocked if the category has products; show count and a message.
  - Optional cover image upload to `TensoCraft/_categories/<slug>`.
- Solution form's category dropdown now reads from `categories`. Keep "No category" and a "+ Add new category…" shortcut that creates a real category doc.

**Done when:** categories can be created/edited/deleted from admin and appear in the solution form dropdown.

### Phase 11 — Admin: Product form + list upgrade
Form (`SolutionForm.jsx`) additions:
- Price (value + unit), MOQ.
- **Specs editor:** rows of key/value, add/remove/reorder; key suggestions from previously used keys.
- **Features:** tag input.
- **Brochure PDF** upload (Cloudinary upload endpoint must be `auto`/raw for PDFs — the current image-only upload won't accept them).
- **Published** toggle with hint "Draft products are hidden from the public site".

List (`SolutionsTable.jsx`) additions — needed because ~250 products will exist:
- Search by title, filter by category, filter by status (Draft / Published), filter **"Needs image"**.
- Badges: `Draft`, `No image`.
- Pagination or "load more".

**Image workflow (the main manual task):**
- Add **"Save & next (needs image)"** button on the edit form: saves, then opens the next product that has no main image.
- Multi-file select/drag-drop for gallery.
- Images upload to `TensoCraft/<categorySlug>/<productSlug>` as before; saving does not touch fields the admin did not change.

**Done when:** one product can be fully created/edited with all new fields, and the "needs image" loop works end-to-end.

### Phase 12 — Public site: new product format
- `SolutionDetail.jsx` new layout:
  - Gallery (main + thumbnails) — hide gracefully if no image.
  - Title, category link, price ("Approx. ₹250 / sq ft" only if set), MOQ.
  - **Spec table** from `specs`.
  - **Feature badges** from `features`.
  - Description, brochure download button (if set).
  - **"Get Quote" button** → `/contact?product=<slug>` with the product name prefilled; store `productSlug` / `productTitle` on the inquiry doc.
- `SolutionCard.jsx`: category label, title, short description, optional price.
- `Solutions.jsx`: only `published` products; category filter chips come from `categories` and show only categories that have ≥ 1 published product.
- Home page fallback photos (`homeSolutions.js`) unchanged.

**Done when:** a published product shows the new page correctly, and drafts return 404/not-found publicly.

### Phase 13 — Admin: Import (categories + products, JSON)

**Page:** `src/pages/admin/AdminImport.jsx` (lazy-loaded, like other admin pages).

**Parsing:** plain `JSON.parse` in the browser — no extra library. Input: upload a `.json` file (or paste JSON into a textarea).

**Import JSON format (one file):**

```json
{
  "categories": [
    { "name": "Car Parking", "slug": "car-parking", "description": "", "order": 1, "showOnHome": true }
  ],
  "products": [
    {
      "title": "Tensile Structure For Stadiums",
      "slug": "tensile-structure-for-stadiums",
      "category": "Stadiums & Auditoriums",
      "shortDescription": "",
      "fullDescription": "",
      "priceValue": 250,
      "priceUnit": "sq ft",
      "moq": "10 sq ft",
      "features": ["Waterproof", "Fire Retardant"],
      "specs": {
        "Fabric Material": "PVC Coated",
        "Fabric GSM": "1050 GSM",
        "Warranty": "10 Years"
      },
      "legacyCategories": ["Tensile Structure"]
    }
  ]
}
```

**Field rules:**
- Required: `title` and `category` for products, `name` for categories. Everything else is optional and can simply be **missing**.
- `slug` is generated from the title/name when missing (same `slugify` used for Cloudinary folders).
- `category` = category name or slug; it must exist in the file's `categories` array or already in Firestore.
- `specs` is an object (key → value). The importer converts it to the ordered `{ key, value }` array stored in Firestore.
- **Empty values are skipped:** `null`, `""`, and empty arrays/objects are never stored. A product with only 3 specs stores 3 specs, and the public page renders only the rows that exist — no blank spec rows or empty columns anywhere.
- All spec values are stored as strings (numbers are converted).
- No image fields, no `published` field: imports are always Draft.

**Import flow:**
1. Choose file → parse → **validation + preview** (tabs for Categories / Products).
2. Summary: `X categories new, Y updated · A products new, B updated · errors, warnings`.
3. Validation errors (block import): invalid JSON, missing title/category, category not found, duplicate slug inside the file.
4. Warnings (allow import): very long values, product with no specs, slug already exists in Firestore.
5. Mode: **Create new only** or **Create + update existing (match by slug)**.
6. Confirm → write categories first, then products, in batches of ≤ 500, with a progress bar.
7. Result report: created / updated / skipped / failed, with a downloadable error list.

**Safety rules (must hold):**
- New products: `published: false`, `imageUrl: ""`, `galleryUrls: []`.
- Updating an existing product **never** changes `imageUrl`, `galleryUrls`, `brochureUrl`, `published`, `featured`, or `order` unless the file explicitly provides a non-empty value for that field.
- Idempotent: running the same file twice creates no duplicates.

**Optional extra:** an **Export JSON** button (same format) that downloads all categories + products as a backup, and can be re-imported later.

**Done when:** a 10-product test file imports cleanly, re-import changes nothing, and the imported drafts appear in the admin list with the `Draft` + `No image` badges.

---

### Phase 14 — Data prep, real import, images, publish
This phase is mostly content work, not UI.

**14a. Fill the gaps in the scraped JSON (optional but recommended)**
The current JSON has `approx_price: null`, empty `description` everywhere, and no images or brochure links. The old product page (see screenshot) has an approx. price, a description paragraph, a gallery, and a brochure PDF. Either re-scrape those fields, or leave them empty and fill them in the admin form.

**14b. One-time cleaning script: scraped JSON → import JSON**
A local Node script (not part of the deployed site) that reads the scraped JSON and writes `import-data.json` (format in Phase 13) plus `needs-review.json`. Since the output is plain JSON, it can also be tweaked by hand in the editor afterwards. Cleaning rules:
- Drop rows with `product_name: null` (each category's first row is junk: `"Home": "Who We Are"`).
- Same title, same category: keep the row with the most specs, drop empty-spec duplicates (e.g. `Tensile Driveway Shade`, `Tensile Railway Platform Canopy`, `Tensile Metro Station Canopy`).
- Same title across categories (e.g. `White Square Tensile Membrane Canopy Structure` ×3, `Gazebo Tensile Structure` ×2): merge into one product, keep the fullest specs, record the others in `legacyCategories`.
- Same title but **different** specs (e.g. `Commercial Car Parking Tensile Structure`, `Tensile Structure Designing Service`): don't guess — write these to `needs-review.json`.
- De-duplicate repeated values (`"Yes, Yes"`, repeated comma lists such as in `Warehouse Tensile Roofing` and `Waterproof Modular Tensile Structure`).
- Move `Features` out of specs into the `features` array (split on commas).
- Normalize spec keys, e.g. `Fabric GSM` / `GSM` / `Gsm` / `Fabric GSM (Grams per sq. mtr)` → `Fabric GSM`; `Is It Waterproof` / `Waterproof` / `Waterproof Level` → `Waterproof`; `Minimum Order Quantity` → the `moq` field. Map `Fabric Thickness` to GSM only when the value is in gsm (the `Serge Ferrari Tensile Fabric` thickness `0.7 mm` is a real thickness, keep it).
- Paragraph-style values in `Shape` (the "Tensile Membrane Structures are thin-shell…" text, plus truncated versions cut at ~100 chars): remove from specs; use the full one as `fullDescription` where useful, drop the truncated ones.
- Typo pass: `Mehgies`, `Materail`, `Dico Paint`, `Fore retardent`, `UV Resistent`, category `Gazebo Tensile Structue`.
- `Service Location/City` values like `delhi`, `all india`, `Pan India` → normalize or drop.

**14c. Category mapping (proposal — edit freely)**
The old site has 40+ overlapping categories. Suggested clean set, default mapping by old category, with an optional per-product override in the script:

| New category | Old categories folded in |
|---|---|
| Car Parking | Car Parking Tensile Structure, car parking structure, Car Parking Tensile Structure Manufacturers, Car Parking Shed, car shed, Mild Steel Parking Shed, Parking Shed Fabrication, Tensile Car Canopy |
| Swimming Pool Covers | Swimming Pool Tensile Cover, swimming pool tensile structure |
| Walkways & Entrances | Walkway Covering Structure, tensile structure manufacturer, Entrance Tensile Structure, bus shelter |
| Canopies & Tents | Canopies, Outdoor Canopy, PVC Tensile Fabric Canopies, outdoor tent, Pagoda Tent, Tensile Canopies Pagoda Tent |
| Gazebos, Umbrellas & Shade Sails | Gazebo Tensile Structure, Gazebo Tensile Structue, Tensile Umbrella, Garden Umbrella, Inverted Umbrella Tensile Structures, Shade Sail |
| Stadiums & Auditoriums | Auditorium Tensile Structures, Badminton Court Roofing Shed (plus stadium products from *Tensile Structure*, moved by override) |
| Tensile Membrane Structures | Tensile Structure, Tensile Membrane Structure, Tensile Membrane, Modular Tensile Structure, Outdoor Shade, Prefabricated Structures, tensile structure and fabric |
| Tensile Fabrics | Pvc Coated Fabric, High Strength Tensile Membrane, Tensile Fabric For Use, Tensile Fabric Structures |
| Design Services | Tensile Structure Designing Service, Structure Service |
| *(per product)* | New Items → assign each product to one of the above |

**14d. Client review pass (before publishing anything)**
The scraped data comes from IndiaMART-style listings, which often contain auto-filled or inconsistent values. Spot-check with the client before these go on their own site:
- MOQ varies wildly for similar products (5 / 10 / 11 / 200 / 500 / 1000 / 5000 sq ft).
- Same product shows different GSM (`Fabric GSM: 900 GSM` and `Gsm: 700`, e.g. *Outdoor Tensile Structure*).
- `Tensile Roofing Solutions` lists brand `JSW` and warranty `5 Years`, different from the rest.
- Warranty (10 / 10+ years) and fabric brand claims (Serge Ferrari, Mehler) — confirm they are true for each product.

**14e. Run**
1. Test import with ~10 products → check admin list, category counts, spec editor.
2. Full import (all as Draft).
3. Upload images one by one via **Save & next (needs image)**. Publish each product when its main image is in.
4. Optional bulk action later: "Publish selected".

---

## 3. Content quality note (SEO)

~250 near-identical products (same spec template, only the title differs, some appear 3× with tiny variations) can look like thin/duplicate content to search engines and can also feel repetitive for visitors. That is why imports land as **Draft** and get published selectively. A good target is to publish the best 40–80 distinct products with real photos, and keep the rest as drafts or merge them.

---

## 4. Files to add / touch (suggested)

```
src/lib/firestore.js                     + category CRUD, upsert helpers, batch helpers
src/lib/cloudinaryUpload.js              + PDF (auto/raw) upload support
src/lib/importParser.js                  NEW  validate + normalize the import JSON
src/pages/admin/AdminCategories.jsx      NEW
src/pages/admin/AdminImport.jsx          NEW
src/components/admin/CategoryForm.jsx    NEW
src/components/admin/SpecsEditor.jsx     NEW
src/components/admin/TagInput.jsx        NEW
src/components/admin/SolutionForm.jsx    + price, MOQ, specs, features, brochure, published, Save & next
src/components/admin/SolutionsTable.jsx  + search, filters, badges, pagination
src/components/admin/AdminLayout.jsx     + tabs (Solutions | Categories | Import)
src/pages/SolutionDetail.jsx             new product layout
src/components/solutions/SolutionCard.jsx  price / category label
src/pages/Solutions.jsx                  published-only + categories-collection filters
src/pages/Contact.jsx                    ?product= prefill
firestore.rules                          + categories
scripts/clean-scraped-json.mjs           NEW (local one-time cleaning script, not deployed)
```

---

## 5. Build status (update as you go)

| Phase | What | Status |
|---|---|---|
| 9 | Data layer + migration | ✅ |
| 10 | Admin Categories tab | ✅ |
| 11 | Product form + list upgrade, image workflow | 🔧 Code delivered, testing |
| 12 | Public product page / cards / filters | 🔧 Code delivered, testing |
| 13 | Admin Import (categories + products) | ⬜ |
| 14 | Data prep, import run, images, publish | ⬜ |