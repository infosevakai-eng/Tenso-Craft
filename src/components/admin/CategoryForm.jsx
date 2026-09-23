import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { slugify, uploadToFolder } from "../../lib/cloudinaryUpload";

const MAX_FILE_MB = 10;
const MAX_NAME_LENGTH = 40;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_NAME = "uncategorized"; // never shown in the UI, so it can't be a real category

// Underscore prefix can't clash with a category slug (slugify strips underscores).
const COVER_FOLDER_ROOT = "TensoCraft/_categories";

const EMPTY_VALUES = {
  name: "",
  slug: "",
  description: "",
  coverImage: "",
  showOnHome: false,
  order: 1,
  parentSlug: "",
};

const cleanName = (text) => String(text ?? "").trim().replace(/\s+/g, " ");

function validateImageFile(file) {
  if (!file.type.startsWith("image/")) return `${file.name} is not an image.`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `${file.name} is larger than ${MAX_FILE_MB} MB.`;
  }
  return "";
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0b1c2c] focus:ring-2 focus:ring-[#0b1c2c]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

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

export default function CategoryForm({
  initialValues,
  isEdit = false,
  takenSlugs = [],
  parentOptions = [], // top-level categories this one can nest under
  submitLabel = "Save Category",
  saving = false,
  serverError = "",
  onSubmit,
}) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues });
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});

  // Cover image is staged locally and uploaded on Save, into
  // TensoCraft/_categories/<slug>, so the folder always matches the final slug.
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [progress, setProgress] = useState("");

  const previewUrl = useRef("");

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  const dropPreview = () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = "";
    }
  };

  const setField = (field, value) => setValues((prev) => ({ ...prev, [field]: value }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    setValues((prev) => ({
      ...prev,
      name,
      // Only auto-fill the slug while creating; on edit it is locked.
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setField("slug", e.target.value.toLowerCase());
  };

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploadError("");
    dropPreview();
    previewUrl.current = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverPreview(previewUrl.current);
  };

  const removeCover = () => {
    dropPreview();
    setCoverFile(null);
    setCoverPreview("");
    setField("coverImage", "");
  };

  const validate = () => {
    const next = {};
    const name = cleanName(values.name);
    const slug = values.slug.trim();

    if (!name) next.name = "Name is required.";
    else if (name.length > MAX_NAME_LENGTH) {
      next.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
    } else if (name.toLowerCase() === RESERVED_NAME) {
      next.name = "This name is reserved. Please choose another.";
    }

    if (!isEdit) {
      if (!slug) next.slug = "Slug is required.";
      else if (!SLUG_RE.test(slug)) {
        next.slug = "Use lowercase letters, numbers and single hyphens only.";
      } else if (slug === RESERVED_NAME) {
        next.slug = "This slug is reserved. Please choose another.";
      } else if (takenSlugs.includes(slug)) {
        next.slug = "Another category already uses this slug.";
      }
    }

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

    const slug = values.slug.trim();
    let coverImage = values.coverImage;

    setUploadError("");

    if (coverFile) {
      setProgress("Uploading cover image…");
      try {
        coverImage = await uploadToFolder(coverFile, `${COVER_FOLDER_ROOT}/${slug}`);
        // Keep the uploaded URL, so a retry after a failed save won't upload again.
        dropPreview();
        setCoverFile(null);
        setCoverPreview("");
        setValues((prev) => ({ ...prev, coverImage }));
      } catch (err) {
        console.error(err);
        setProgress("");
        setUploadError(
          `Image upload failed: ${err?.message || "unknown error"} The category was not saved.`
        );
        return;
      }
    }

    setProgress("Saving…");
    try {
      await onSubmit({
        name: cleanName(values.name),
        slug,
        description: values.description.trim(),
        coverImage,
        showOnHome: values.showOnHome,
        order: Number(values.order),
        parentSlug: values.parentSlug,
      });
    } finally {
      setProgress("");
    }
  };

  const busy = saving || Boolean(progress);
  const coverSrc = coverPreview || values.coverImage;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={handleNameChange}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Car Parking"
            className={inputClass}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          error={errors.slug}
          hint={
            isEdit
              ? "The slug can't be changed after a category is created (image folders are named after it)."
              : "Auto-filled from the name. It is locked once the category is created."
          }
        >
          <input
            id="slug"
            type="text"
            value={values.slug}
            onChange={handleSlugChange}
            disabled={isEdit}
            placeholder="car-parking"
            className={inputClass}
          />
        </Field>
      </div>
      <Field
        label="Parent category"
        htmlFor="parentSlug"
        hint={
          parentOptions.length > 0
            ? "Leave as “Top-level” to make this a parent category itself."
            : "No parent categories exist yet — this will be created as a top-level category."
        }
      >
        <select
          id="parentSlug"
          value={values.parentSlug}
          onChange={(e) => setField("parentSlug", e.target.value)}
          disabled={parentOptions.length === 0}
          className={inputClass}
        >
          <option value="">— Top-level (no parent) —</option>
          {parentOptions
            .filter((p) => p.slug !== values.slug)
            .map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
        </select>
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
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

      <Field label="Description (optional)" htmlFor="description">
        <textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        label="Cover image (optional)"
        htmlFor="coverImage"
        hint="Uploaded when you click Save."
      >
        {coverSrc && (
          <div className="mb-3">
            <img
              src={coverSrc}
              alt="Cover preview"
              className="h-40 w-64 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={removeCover}
              disabled={busy}
              className="mt-2 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Remove image
            </button>
          </div>
        )}
        <input
          id="coverImage"
          type="file"
          accept="image/*"
          onChange={handleCoverFile}
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
          checked={values.showOnHome}
          onChange={(e) => setField("showOnHome", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Show on the homepage
      </label>

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <Link
          to="/admin/categories"
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