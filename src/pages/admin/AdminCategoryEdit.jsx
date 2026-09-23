import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CategoryForm from "../../components/admin/CategoryForm";
import {
  createCategory,
  getCategories,
  getParentCategories,
  updateCategory,
} from "../../lib/firestore";

// firestore.js throws readable messages for expected problems (duplicate slug,
// missing name, ...). Anything else (network, permissions) gets a generic text.
function friendlyError(err) {
  const message = String(err?.message ?? "");
  return /already exists|required|can't be changed|Invalid|not found/i.test(message)
    ? message
    : "Could not save the category. Please try again.";
}

export default function AdminCategoryEdit() {
  const { slug } = useParams(); // category slug = Firestore doc id
  const navigate = useNavigate();
  const isEdit = Boolean(slug);

  const [categories, setCategories] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getParentCategories()])
      .then(([catList, parentList]) => {
        if (cancelled) return;
        setCategories(catList);
        setParentOptions(parentList);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoadError("Could not load data. Check your Firestore connection.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const existing = isEdit ? categories.find((c) => c.slug === slug) : null;
  const nextOrder = Math.max(0, ...categories.map((c) => Number(c.order) || 0)) + 1;
  const takenSlugs = categories.map((c) => c.slug);

  const handleSubmit = async (data) => {
    setSubmitError("");
    setSaving(true);
    try {
      if (isEdit) {
        await updateCategory(slug, data);
      } else {
        await createCategory(data);
      }
      navigate("/admin/categories");
    } catch (err) {
      console.error(err);
      setSubmitError(friendlyError(err));
      setSaving(false);
    }
  };

  let content;
  if (loading) {
    content = <p className="text-slate-500">Loading…</p>;
  } else if (loadError) {
    content = (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {loadError}
      </p>
    );
  } else if (isEdit && !existing) {
    content = (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-slate-900">Category not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been deleted.</p>
        <Link
          to="/admin/categories"
          className="mt-4 inline-block text-sm font-medium text-[#0b1c2c] hover:underline"
        >
          Back to categories
        </Link>
      </div>
    );
  } else {
    content = (
      <CategoryForm
        key={existing?.slug ?? "new"}
        isEdit={isEdit}
        parentOptions={parentOptions.filter((p) => p.slug !== existing?.slug)}
        initialValues={
          existing
            ? {
                name: existing.name ?? "",
                slug: existing.slug ?? "",
                description: existing.description ?? "",
                coverImage: existing.coverImage ?? "",
                showOnHome: Boolean(existing.showOnHome),
                order: existing.order ?? nextOrder,
                parentSlug: existing.parentSlug ?? "",
              }
            : { order: nextOrder, parentSlug: "" }
        }
        takenSlugs={takenSlugs}
        submitLabel={isEdit ? "Save Changes" : "Create Category"}
        saving={saving}
        serverError={submitError}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/admin/categories" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to categories
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold text-slate-900">
        {isEdit ? "Edit Category" : "Add Category"}
      </h1>
      {content}
    </div>
  );
}