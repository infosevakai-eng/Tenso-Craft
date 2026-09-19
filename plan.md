# Tenso Craft Website — Build Plan

## 1. Project Overview

Tensile structures company website (referencing "Tenso Craft" design). Public marketing site + admin panel for dynamic content. Design/assets already ready (hero, featured projects, solution icons, testimonials, insight thumbnails, materials graphics — all listed in the assets folder).

**Stack:**
- **React (Vite)** — frontend
- **Tailwind CSS** — styling
- **Firebase** — Auth (admin login) + Firestore (data) + Hosting (deploy)
- **Cloudinary** — image upload/storage/CDN (unsigned upload preset, no backend needed)

No custom backend server needed — Firestore + Cloudinary handles everything client-side. Keeps it simple, matches pragmatic-over-complex approach.

---

## 2. Pages

| Page | Route | Type |
|---|---|---|
| Home | `/` | Static (pulls featured solutions dynamically) |
| About | `/about` | Static |
| Contact | `/contact` | Static (form → Firestore `inquiries` collection) |
| Privacy Policy | `/privacy-policy` | Static |
| **Solutions** (dynamic) | `/solutions` and `/solutions/:slug` | Dynamic — CRUD from admin |
| Admin Login | `/admin/login` | Auth gate |
| Admin Dashboard | `/admin` | Protected — manage solutions |

**Naming decision — "Solutions"**: matches the site's own nav language ("Tensile Solutions for Every Space" / "Our Solutions" in the design), reads well for both products (car parking shades, tensile roofing) and services (design/install). Avoids the ambiguity of calling structures "products" when it's really engineered solutions. Each entry = one solution (e.g. "Car Parking Shades", "Walkways & Canopies").

If later you want to split **Solutions** (what they build) vs **Projects** (case studies of completed work, as seen in "Featured Projects" section) — that can be phase 2, same pattern (another Firestore collection).

---

## 3. Firebase Setup

### Auth — Simple `.env`-based login (frontend-only, no Firebase Auth at all)
- No Firebase Auth of any kind (no anonymous sign-in, no email/password provider). Login is purely a client-side check.
- Login page: email + password fields → compared against `import.meta.env.VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD`. On match, set an `isAdmin` flag in `sessionStorage`; `ProtectedRoute` reads that flag to gate `/admin/*`.
- On logout: just clear the flag.
- **Important trade-off**: since there's no real Firebase Auth, Firestore security rules have no way to tell an admin apart from anyone else — `request.auth` is always null. So `solutions`, `inquiries`, and `siteSettings` are left open (`allow read, write: if true`) in `firestore.rules`. The `.env` check only gates the `/admin` UI in the browser — it does **not** stop someone from opening devtools and writing to Firestore directly, with or without the password. Acceptable for a low-stakes single-client site; not something to reuse on anything sensitive.

### Firestore Collections

**`solutions`**
```
{
  id: auto,
  title: string,          // "Car Parking Shades"
  slug: string,           // "car-parking-shades"
  shortDescription: string,
  fullDescription: string,
  category: string,       // optional filter e.g. "Commercial", "Hospitality"
  imageUrl: string,       // Cloudinary URL (card/thumbnail)
  galleryUrls: string[],  // Cloudinary URLs (detail page gallery)
  featured: boolean,      // show on homepage "Our Solutions" strip
  order: number,          // manual sort order
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**`inquiries`** (contact form submissions)
```
{
  id: auto,
  name: string,
  email: string,
  phone: string,
  message: string,
  createdAt: timestamp,
  status: "new" | "read"
}
```

**`siteSettings`** (optional, single doc) — for things like stats bar (15+ years, 500+ projects, etc.), contact info, social links — so those become admin-editable too instead of hardcoded.

### Security Rules (high-level)
- No Firebase Auth exists in this project (see the Auth note above), so rules can't gate by `request.auth`.
- `solutions`, `inquiries`, `siteSettings`: fully open (`allow read, write: if true`) — protection is UI-level only (the `.env` check on `/admin`), not database-level. See `firestore.rules`.

---

## 4. Cloudinary Setup

- Create an **unsigned upload preset** (Cloudinary dashboard → Settings → Upload).
- Admin panel uploads directly from browser to Cloudinary via `fetch` to `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload` — no backend needed.
- Store the returned `secure_url` in the Firestore `solutions` doc.
- Recommended: use Cloudinary's `f_auto,q_auto` transformation in the URL for auto format/compression on delivery.

---

## 5. Folder Structure

```
tenso-craft/
├── src/
│   ├── assets/              # static images (hero, logos, icons)
│   ├── components/
│   │   ├── layout/          # Navbar, Footer
│   │   ├── home/            # HomeHero, StatsBar, SolutionsGrid, FeaturedProjects, WhyUs, Materials, Testimonials, InsightsPreview, CTA
│   │   ├── solutions/       # SolutionCard, SolutionDetail
│   │   └── admin/           # AdminLayout, SolutionForm, SolutionsTable, ProtectedRoute
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── PrivacyPolicy.jsx
│   │   ├── Solutions.jsx
│   │   ├── SolutionDetail.jsx
│   │   ├── admin/
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AdminSolutionEdit.jsx
│   ├── lib/
│   │   ├── firebase.js      # Firebase init
│   │   ├── cloudinary.js    # upload helper
│   │   └── firestore.js     # CRUD helper functions (getSolutions, addSolution, etc.)
│   ├── context/
│   │   └── AuthContext.jsx  # admin auth state
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css            # tailwind directives
├── .env                      # Firebase + Cloudinary keys
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 6. Build Phases (sequential, Cursor-friendly prompts)

Since context resets between sessions, treat each phase as one self-contained prompt with the plan file as reference.

1. **Scaffold** — Vite + React + Tailwind setup, install Firebase SDK, folder structure, routing (`react-router-dom`), Navbar/Footer shell.
2. **Firebase + Cloudinary wiring** — `firebase.js` init, `.env` setup, `cloudinary.js` upload helper, Firestore CRUD helper functions.
3. **Static pages** — Home (all sections, static content + hardcoded solution cards as placeholder), About, Privacy Policy.
4. **Contact page** — form UI + write to `inquiries` collection.
5. **Solutions (public)** — Solutions listing page (fetch from Firestore) + Solution detail page (`/solutions/:slug`) + wire Home's "Our Solutions" section to pull real data.
6. **Admin auth** — login page (email + password fields checked against `.env`, purely client-side), `AuthContext` (tracks `isAdmin` flag in `sessionStorage`), `ProtectedRoute` wrapper.
7. **Admin CRUD** — dashboard listing all solutions (table), add/edit form (title, description, category, image upload to Cloudinary, gallery upload, featured toggle, order), delete.
8. **Polish** — loading states, empty states, 404 page, responsive check, deploy to Firebase Hosting.

Each phase above = one prompt to hand Cursor, with "here's plan.md, build phase N."

---

## 7. Env Variables Needed

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_ADMIN_EMAIL=
VITE_ADMIN_PASSWORD=
```

---

## 8. Open Questions (confirm before Phase 1)

- Solutions need a `category` filter on the listing page, or just a flat grid?
- Should "Featured Projects" (case studies with location tags) be a separate dynamic collection too, or static for now?