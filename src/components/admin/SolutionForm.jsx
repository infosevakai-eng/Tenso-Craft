import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildSolutionFolder,
  slugify,
  uploadToFolder,
} from "../../lib/cloudinaryUpload";

const MAX_FILE_MB = 10;
const MAX_CATEGORY_LENGTH = 40;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NEW_CATEGORY = "__new_category__";
const RESERVED_CATEGORY = "uncategorized";

const EMPTY_VALUES = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  imageUrl: "",
  galleryUrls: [],
  featured: false,
  order: 1,
};

const cleanCategory = (text) => String(text ?? "").trim().replace(/\s+/g, " ");
const isReserved = (text) => cleanCategory(text).toLowerCase() === RESERVED_CATEGORY;

// Unique (case-insensitive), sorted list of real category names.
function buildCategoryOptions(categories, current) {
  const seen = new Map();
  [...categories, current].forEach((raw) => {
    const name = cleanCategory(raw);
    if (!name || isReserved(name)) return;
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  });
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

function validateImageFile(file) {
  if (!file.type.startsWith("image/")) return `${file.name} is not an image.`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `${file.name} is larger than ${MAX_FILE_MB} MB.`;
  }
  return "";
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0b1c2c] focus:ring-2 focus:ring-[#0b1c2c]/10";

const fileInputClass =
  "block w-full text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#0b1c2c] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#12304a] disabled:opacity-60";

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function SolutionForm({
  initialValues,
  categories = [],
  takenSlugs = [],
  submitLabel = "Save Solution",
  saving = false,
  serverError = "",
  onSubmit,
}) {
  const initialCategory = cleanCategory(initialValues?.category);
  const categoryOptions = buildCategoryOptions(categories, initialCategory);

  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues });
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [errors, setErrors] = useState({});

  // Category: "" = no category, an existing name, or NEW_CATEGORY (typing a new one)
  const [categoryChoice, setCategoryChoice] = useState(
    () =>
      categoryOptions.find((o) => o.toLowerCase() === initialCategory.toLowerCase()) ?? ""
  );
  const [newCategory, setNewCategory] = useState("");

  // Images are staged locally and only uploaded on Save, so the Cloudinary
  // folder always matches the final category + slug.
  const [mainFile, setMainFile] = useState(null);
  const [mainPreview, setMainPreview] = useState("");
  const [newGallery, setNewGallery] = useState([]); // [{ id, file, preview }]
  const [uploadError, setUploadError] = useState("");
  const [progress, setProgress] = useState("");

  const previewUrls = useRef(new Set());
  const nextId = useRef(0);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const makePreview = (file) => {
    const url = URL.createObjectURL(file);
    previewUrls.current.add(url);
    return url;
  };

  const dropPreview = (url) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
  };

  const setField = (field, value) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setValues((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setField("slug", e.target.value.toLowerCase());
  };

  const handleMainFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploadError("");
    dropPreview(mainPreview);
    setMainFile(file);
    setMainPreview(makePreview(file));
    setErrors((prev) => ({ ...prev, imageUrl: undefined }));
  };

  const handleGalleryFiles = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const problem = files.map(validateImageFile).find(Boolean);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploadError("");
    const items = files.map((file) => ({
      id: nextId.current++,
      file,
      preview: makePreview(file),
    }));
    setNewGallery((prev) => [...prev, ...items]);
  };

  const removeSavedGalleryImage = (index) => {
    setValues((prev) => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index),
    }));
  };

  const removeStagedGalleryImage = (item) => {
    dropPreview(item.preview);
    setNewGallery((prev) => prev.filter((g) => g.id !== item.id));
  };

  const resolveCategory = () => {
    if (categoryChoice !== NEW_CATEGORY) return categoryChoice;
    const typed = cleanCategory(newCategory);
    if (!typed || isReserved(typed)) return "";
    return categoryOptions.find((o) => o.toLowerCase() === typed.toLowerCase()) ?? typed;
  };

  const validate = () => {
    const next = {};
    const slug = values.slug.trim();

    if (!values.title.trim()) next.title = "Title is required.";

    if (!slug) next.slug = "Slug is required.";
    else if (!SLUG_RE.test(slug)) {
      next.slug = "Use lowercase letters, numbers and single hyphens only.";
    } else if (takenSlugs.includes(slug)) {
      next.slug = "Another solution already uses this slug.";
    }

    if (categoryChoice === NEW_CATEGORY) {
      const typed = cleanCategory(newCategory);
      if (!typed) next.category = "Enter a category name, or choose another option.";
      else if (typed.length > MAX_CATEGORY_LENGTH) {
        next.category = `Category must be ${MAX_CATEGORY_LENGTH} characters or fewer.`;
      } else if (!isReserved(typed) && !slugify(typed)) {
        next.category = "Category needs at least one letter or number.";
      }
    }

    if (!values.imageUrl && !mainFile) next.imageUrl = "Main image is required.";

    if (values.order === "" || Number.isNaN(Number(values.order))) {
      next.order = "Order must be a number.";
    }

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const category = resolveCategory();
    const slug = values.slug.trim();
    const folder = buildSolutionFolder(category, slug);
    const totalUploads = (mainFile ? 1 : 0) + newGallery.length;

    let imageUrl = values.imageUrl;
    const galleryUrls = [...values.galleryUrls];
    let done = 0;

    setUploadError("");

    // Each finished upload is moved into saved state right away, so if a later
    // step fails, a retry won't upload the same image twice.
    try {
      if (mainFile) {
        setProgress(`Uploading image ${done + 1} of ${totalUploads}…`);
        imageUrl = await uploadToFolder(mainFile, folder);
        done += 1;
        dropPreview(mainPreview);
        setMainFile(null);
        setMainPreview("");
        setValues((prev) => ({ ...prev, imageUrl }));
      }

      for (const item of newGallery) {
        setProgress(`Uploading image ${done + 1} of ${totalUploads}…`);
        const url = await uploadToFolder(item.file, folder);
        done += 1;
        galleryUrls.push(url);
        dropPreview(item.preview);
        setNewGallery((prev) => prev.filter((g) => g.id !== item.id));
        setValues((prev) => ({ ...prev, galleryUrls: [...prev.galleryUrls, url] }));
      }
    } catch (err) {
      console.error(err);
      setProgress("");
      setUploadError(
        `Image upload failed: ${err?.message || "unknown error"} The solution was not saved. Images already uploaded won't be uploaded again, so you can retry.`
      );
      return;
    }

    setProgress("Saving…");
    try {
      await onSubmit({
        title: values.title.trim(),
        slug,
        category,
        shortDescription: values.shortDescription.trim(),
        fullDescription: values.fullDescription.trim(),
        imageUrl,
        galleryUrls,
        featured: values.featured,
        order: Number(values.order),
      });
    } finally {
      setProgress("");
    }
  };

  const busy = saving || Boolean(progress);
  const mainPreviewSrc = mainPreview || values.imageUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={errors.title}>
          <input
            id="title"
            type="text"
            value={values.title}
            onChange={handleTitleChange}
            placeholder="Car Parking Shades"
            className={inputClass}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          error={errors.slug}
          hint="Used in the URL: /solutions/your-slug. Auto-filled from the title."
        >
          <input
            id="slug"
            type="text"
            value={values.slug}
            onChange={handleSlugChange}
            placeholder="car-parking-shades"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Category (optional)"
          htmlFor="category"
          error={errors.category}
          hint="Pick an existing category or add a new one."
        >
          <select
            id="category"
            value={categoryChoice}
            onChange={(e) => {
              setCategoryChoice(e.target.value);
              setErrors((prev) => ({ ...prev, category: undefined }));
            }}
            className={inputClass}
          >
            <option value="">No category</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ Add new category…</option>
          </select>
          {categoryChoice === NEW_CATEGORY && (
            <input
              id="newCategory"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              maxLength={MAX_CATEGORY_LENGTH}
              placeholder="e.g. Commercial"
              aria-label="New category name"
              autoFocus
              className={`${inputClass} mt-2`}
            />
          )}
        </Field>

        <Field
          label="Display order"
          htmlFor="order"
          error={errors.order}
          hint="Lower numbers appear first."
        >
          <input
            id="order"
            type="number"
            value={values.order}
            onChange={(e) => setField("order", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Short description" htmlFor="shortDescription" hint="Shown on solution cards.">
        <textarea
          id="shortDescription"
          rows={2}
          value={values.shortDescription}
          onChange={(e) => setField("shortDescription", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Full description" htmlFor="fullDescription" hint="Shown on the solution detail page.">
        <textarea
          id="fullDescription"
          rows={6}
          value={values.fullDescription}
          onChange={(e) => setField("fullDescription", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        label="Main image (card thumbnail)"
        htmlFor="mainImage"
        error={errors.imageUrl}
        hint="Images are uploaded when you click Save."
      >
        {mainPreviewSrc && (
          <img
            src={mainPreviewSrc}
            alt="Main preview"
            className="mb-3 h-40 w-64 rounded-lg object-cover"
          />
        )}
        <input
          id="mainImage"
          type="file"
          accept="image/*"
          onChange={handleMainFile}
          disabled={busy}
          className={fileInputClass}
        />
      </Field>

      <Field label="Gallery images (detail page)" htmlFor="galleryImages" hint="You can select multiple files.">
        {(values.galleryUrls.length > 0 || newGallery.length > 0) && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {values.galleryUrls.map((url, index) => (
              <div key={url + index} className="relative">
                <img src={url} alt={`Gallery ${index + 1}`} className="h-24 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeSavedGalleryImage(index)}
                  disabled={busy}
                  aria-label={`Remove gallery image ${index + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm leading-none text-white hover:bg-red-600 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
            {newGallery.map((item) => (
              <div key={item.id} className="relative">
                <img src={item.preview} alt={item.file.name} className="h-24 w-full rounded-lg object-cover ring-2 ring-[#d9a441]" />
                <span className="absolute bottom-1 left-1 rounded bg-[#d9a441] px-1.5 py-0.5 text-[10px] font-semibold text-slate-900">
                  New
                </span>
                <button
                  type="button"
                  onClick={() => removeStagedGalleryImage(item)}
                  disabled={busy}
                  aria-label={`Remove ${item.file.name}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm leading-none text-white hover:bg-red-600 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          id="galleryImages"
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryFiles}
          disabled={busy}
          className={fileInputClass}
        />
      </Field>

      {uploadError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={values.featured}
          onChange={(e) => setField("featured", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Featured (show on the homepage "Our Solutions" strip)
      </label>

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <Link
          to="/admin"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[#d9a441] px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#c8942f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {progress || (saving ? "Saving…" : submitLabel)}
        </button>
      </div>
    </form>
  );
}