# Tenso Craft Website

Marketing site + lightweight admin panel for Tenso Craft (tensile structures,
established 2005, New Delhi). React (Vite) + Tailwind v4 + Firebase
(Firestore) + Cloudinary.

See `plan.md` for the full build plan, data model, and phase breakdown this
project was built against.

## Tech Stack

- **React 19 + Vite** -- frontend
- **Tailwind CSS v4** -- styling (CSS-based theme in `src/index.css`)
- **React Router v7** -- routing
- **Firebase Firestore** -- data (`solutions`, `inquiries`, `siteSettings`)
- **Cloudinary** -- image hosting (unsigned upload preset, admin-uploaded photos)

No custom backend server. No Firebase Auth -- admin login is a client-side
`.env` credential check only (see **Admin Access** below and `plan.md`
section 3 for the security trade-off this implies).

## Getting Started

```bash
npm install
cp .env.example .env   # fill in real values, see below
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `VITE_FIREBASE_API_KEY` etc. (6 vars) | Firebase Console → Project settings → General → Your apps → Web app config |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload presets (must be **Unsigned**) |
| `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD` | Pick your own -- used to log into `/admin/login` |

`.env` is git-ignored; `.env.example` is the tracked template.

**Note:** Vite reads `.env` only at startup. After changing any value,
stop and restart `npm run dev`. If a password contains `#` or `$`, wrap it in
quotes (`VITE_ADMIN_PASSWORD="my#pass"`) or the value gets truncated.

## Firebase Setup Checklist

1. `firebase init firestore` in this directory if not already done (creates
   `firebase.json` / `.firebaserc`).
2. `firebase deploy --only firestore:rules` to publish `firestore.rules`.
3. No Authentication setup needed -- this project doesn't use Firebase Auth
   at all (see Admin Access below).

## Cloudinary Setup Checklist

1. Create a free account at cloudinary.com.
2. Settings → Upload → Upload presets → Add upload preset → **Signing Mode:
   Unsigned** → Save.
3. Put the cloud name and preset name in `.env`.
4. Leave the preset's own folder setting empty -- the app sends the folder
   with every upload (see **Cloudinary folder structure** below).

## Project Structure

```
tenso-craft/
├── plan.md                 Build plan, data model, phase breakdown
├── README.md
├── firebase.json / .firebaserc / firestore.rules
├── .env / .env.example
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx            App entry (BrowserRouter + <App />)
    ├── App.jsx             All routes (public + admin), wraps app in AuthProvider;
    │                       every page except Home/NotFound is lazy-loaded
    ├── index.css           Tailwind v4 import + theme tokens
    ├── assets/images/      Static brand photos (logo, hero, solution photos, etc.)
    ├── components/
    │   ├── admin/
    │   │   ├── ProtectedRoute.jsx   Gate: redirects to /admin/login if not admin
    │   │   ├── AdminLayout.jsx      Admin shell: shared Navbar + <Outlet /> (no Footer)
    │   │   ├── SolutionsTable.jsx   Admin list: view / edit / delete
    │   │   └── SolutionForm.jsx     Add/edit form + Cloudinary uploads
    │   ├── home/           Home page sections (Hero, StatsBar, SolutionsGrid, WhyUs, ...)
    │   ├── layout/         Navbar (shared by public site AND admin), Footer, PublicLayout
    │   └── solutions/      SolutionCard (shared by Home + Solutions listing)
    ├── context/
    │   └── AuthContext.jsx        isAdmin state, login(), logout(), sessionStorage sync
    ├── data/
    │   └── homeSolutions.js       Fallback photos shown on Home until real
    │                              Firestore solutions exist
    ├── lib/
    │   ├── firebase.js            Firebase app + Firestore init
    │   ├── cloudinary.js          uploadImage / uploadImages / optimizedUrl helpers
    │   ├── cloudinaryUpload.js    Folder-aware upload used by the admin form
    │   │                          (buildSolutionFolder, uploadToFolder, slugify)
    │   └── firestore.js           CRUD for solutions / inquiries / siteSettings
    └── pages/
        ├── Home.jsx, About.jsx, Contact.jsx, PrivacyPolicy.jsx
        ├── Solutions.jsx, SolutionDetail.jsx
        ├── NotFound.jsx           404 page
        └── admin/
            ├── AdminLogin.jsx         Email + password form (show/hide password)
            ├── AdminDashboard.jsx     Solutions list page (renders SolutionsTable)
            └── AdminSolutionEdit.jsx  Add (/admin/solutions/new) and edit
                                       (/admin/solutions/:id/edit)
```

## Routes

| Route | Page | Access |
|---|---|---|
| `/` , `/about`, `/contact`, `/privacy-policy` | Static pages | Public |
| `/solutions`, `/solutions/:slug` | Listing + detail (live Firestore data) | Public |
| `/admin/login` | Admin login | Public |
| `/admin` | Solutions table | Admin only |
| `/admin/solutions/new` | Add solution | Admin only |
| `/admin/solutions/:id/edit` | Edit solution | Admin only |

## Admin Access

Go to `/admin/login` and sign in with the email/password set in `.env`
(`VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD`). A successful login stores an
`isAdmin` flag in `sessionStorage` (cleared on Log Out or when the tab closes).

**Important:** this is a frontend-only check, not real Firebase
Authentication. It gates the `/admin` UI in the browser, but
`firestore.rules` allows open read/write on `solutions` and `siteSettings` --
anyone who calls the Firestore SDK/REST API directly can read or write those
collections regardless of the admin password. `inquiries` is create-only
(the contact form works, but submissions can't be read or deleted from the
client; read them in the Firebase Console). This is an accepted trade-off for
a low-stakes single-client site (see `plan.md` section 3) -- don't reuse this
auth pattern anywhere the data matters more.

**Also note:** `VITE_ADMIN_PASSWORD` is baked into the built JS bundle, so
anyone can read it via devtools. Use a password you don't use anywhere else.

## Admin Panel (Solutions)

- **List:** `/admin` shows all solutions sorted by `order`, with thumbnail,
  category, featured badge, and View / Edit / Delete actions.
- **Add / Edit:** title, slug (auto-generated from title, editable, must be
  unique), category, short + full description, main image, gallery images,
  featured toggle, display order.
- **Category:** a dropdown of categories already used by other solutions, plus
  "No category" and "+ Add new category…". Categories aren't a separate
  collection -- a category exists as long as at least one solution uses it.
  A solution with no category is saved with `category: ""`; the word
  "Uncategorized" is never shown in the UI (public pages must skip empty
  categories, e.g. in filters).
- **Images:** chosen files are previewed locally and uploaded to Cloudinary
  when you click Save (unsigned preset); the returned URLs are saved in
  Firestore. Max 10 MB per image. Cancelling uploads nothing.
- **Delete:** removes the Firestore document only. Images stay in Cloudinary
  (unsigned presets can't delete); remove them from the Cloudinary dashboard
  if needed.

## Cloudinary folder structure

Every admin upload goes to `TensoCraft/<category>/<solution-slug>`, e.g.
`TensoCraft/commercial/car-parking-shades`. Category and slug are lowercased
and hyphenated; a solution with no category goes to
`TensoCraft/uncategorized/<solution-slug>`. Main and gallery images of a
solution share one folder.

Existing images are not moved if you later change a solution's category or
slug (unsigned uploads can't move assets); only new uploads use the new
folder. Move old ones in the Cloudinary Media Library if needed.

## Build & Deploy

```bash
npm install -g firebase-tools   # once
firebase login                  # once
npm run build                   # outputs to dist/ (reads .env at build time)
firebase deploy --only hosting,firestore:rules
```

- `firebase.json` has a Hosting config: serves `dist/`, rewrites every path to
  `index.html` (needed for React Router deep links like `/solutions/:slug`),
  and sets long-lived cache headers on `/assets/**`.
- `vite.config.js` splits `firebase` and `react-vendor` into their own chunks,
  and `App.jsx` lazy-loads pages, so public visitors don't download admin code.
- `.env` values are inlined at **build** time -- rebuild after changing them.

## Content To Fill In Before Launch

A few things were left as clearly-marked placeholders during the build --
search the codebase for `TODO` / `placeholder` comments, or check this list:

- **Phone number & email** -- `src/pages/Contact.jsx` and
  `src/components/layout/Footer.jsx` have placeholder contact details.
- **`StatsBar` numbers** (`src/components/home/StatsBar.jsx`) -- only "20+
  Years" is a verified figure; the rest need confirming or replacing.
- **Testimonial** (`src/components/home/Testimonials.jsx`) -- placeholder
  text, not a real client quote. Replace before launch.
- **Logo transparency** -- confirm `src/assets/images/logo.webp` has a
  transparent background so it doesn't show a box on the dark navbar.
- **Privacy Policy** -- has a disclaimer that it needs legal review against
  India's DPDP Act, 2023 before publishing.

## Build Status

| Phase | What | Status |
|---|---|---|
| 1 | Scaffold (Vite + Tailwind + Router) | ✅ Done |
| 2 | Firebase + Cloudinary wiring | ✅ Done |
| 3 | Static pages (Home, About, Privacy Policy) | ✅ Done |
| 4 | Contact form → Firestore | ✅ Done |
| 5 | Solutions listing + detail (live Firestore data) | ✅ Done |
| 6 | Admin login (`.env` check, `AuthContext`, `ProtectedRoute`) | ✅ Done |
| 7 | Admin CRUD (Solutions table, add/edit form, Cloudinary upload) | ✅ Done |
| 8 | Polish (responsive pass, code-splitting, deploy) | 🔧 In progress -- code-splitting + Hosting config added; responsive check + deploy pending |