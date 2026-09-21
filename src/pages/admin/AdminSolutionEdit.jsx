import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SolutionForm from "../../components/admin/SolutionForm";
import {
  createProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "../../lib/firestore";

// firestore.js throws readable messages for expected problems (duplicate slug,
// invalid slug, ...). Anything else (network, permissions) gets a generic text.
function friendlyError(err) {
  const message = String(err?.message ?? "");
  return /already exists|required|Invalid|not found/i.test(message)
    ? message
    : "Could not save the solution. Please try again.";
}

// Most-used values first, so autocomplete suggests the common ones.
function topValues(values, limit = 150) {
  const counts = new Map();
  values.forEach((raw) => {
    const value = String(raw ?? "").trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

// The next product (after `currentId` in list order, wrapping around) that has
// no main image yet. The current product is never returned.
function findNextNeedingImage(list, currentId) {
  const start = list.findIndex((s) => s.id === currentId);
  const ordered = [...list.slice(start + 1), ...list.slice(0, Math.max(start, 0))];
  return ordered.find((s) => s.id !== currentId && !s.imageUrl)?.id ?? null;
}

export default function AdminSolutionEdit() {
  const { id } = useParams(); // product slug (Firestore doc id = slug)
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        if (cancelled) return;
        setSolutions(productList);
        setCategories(categoryList);
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

  const existing = isEdit ? solutions.find((s) => s.id === id) : null;
  const nextOrder =
    Math.max(0, ...solutions.map((s) => Number(s.order) || 0)) + 1;

  // Slugs used by *other* solutions (the one being edited may keep its own).
  const takenSlugs = solutions.filter((s) => s.id !== id).map((s) => s.slug);

  const specKeySuggestions = useMemo(
    () => topValues(solutions.flatMap((s) => (s.specs ?? []).map((row) => row.key))),
    [solutions]
  );
  const featureSuggestions = useMemo(
    () => topValues(solutions.flatMap((s) => s.features ?? [])),
    [solutions]
  );

  const hasNextNeedingImage = isEdit && Boolean(findNextNeedingImage(solutions, id));

  const handleSubmit = async (data, intent = "save") => {
    setSubmitError("");

    // Safety net: the form already checks this before uploading anything.
    if (takenSlugs.includes(data.slug)) {
      setSubmitError("Another solution already uses this slug. Please choose a different one.");
      return;
    }

    setSaving(true);
    try {
      if (!isEdit) {
        await createProduct(data);
        navigate("/admin");
        return;
      }

      const finalSlug = await updateProduct(id, data); // moves the doc if the slug changed

      // Keep the local lists in sync, so "Save & next" never jumps back to a
      // product that was just saved, and new categories show up in the dropdown.
      const updatedList = solutions.map((s) =>
        s.id === id ? { ...s, ...data, id: finalSlug } : s
      );
      setSolutions(updatedList);
      if (data.categorySlug && !categories.some((c) => c.slug === data.categorySlug)) {
        setCategories([...categories, { slug: data.categorySlug, name: data.category }]);
      }

      if (intent === "next") {
        const target = findNextNeedingImage(updatedList, finalSlug);
        setSaving(false);
        window.scrollTo({ top: 0 });
        navigate(target ? `/admin/solutions/${target}/edit` : "/admin");
        return;
      }

      navigate("/admin");
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
        <p className="font-medium text-slate-900">Solution not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been deleted.</p>
        <Link to="/admin" className="mt-4 inline-block text-sm font-medium text-[#0b1c2c] hover:underline">
          Back to solutions
        </Link>
      </div>
    );
  } else {
    content = (
      <SolutionForm
        key={existing?.id ?? "new"}
        isEdit={isEdit}
        showSaveAndNext={hasNextNeedingImage}
        initialValues={
          existing
            ? {
                title: existing.title ?? "",
                slug: existing.slug ?? "",
                category: existing.category ?? "",
                categorySlug: existing.categorySlug ?? "",
                shortDescription: existing.shortDescription ?? "",
                fullDescription: existing.fullDescription ?? "",
                imageUrl: existing.imageUrl ?? "",
                galleryUrls: existing.galleryUrls ?? [],
                featured: Boolean(existing.featured),
                order: existing.order ?? nextOrder,
                priceValue: existing.priceValue ?? "",
                priceUnit: existing.priceUnit || "sq ft",
                moq: existing.moq ?? "",
                specs: (existing.specs ?? []).map((row) => ({
                  key: String(row?.key ?? ""),
                  value: String(row?.value ?? ""),
                })),
                features: existing.features ?? [],
                brochureUrl: existing.brochureUrl ?? "",
                published: existing.published !== false,
              }
            : { order: nextOrder }
        }
        categories={categories}
        specKeySuggestions={specKeySuggestions}
        featureSuggestions={featureSuggestions}
        takenSlugs={takenSlugs}
        submitLabel={isEdit ? "Save Changes" : "Create Solution"}
        saving={saving}
        serverError={submitError}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/admin" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to solutions
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold text-slate-900">
        {isEdit ? "Edit Solution" : "Add Solution"}
      </h1>
      {content}
    </div>
  );
}