import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SolutionForm from "../../components/admin/SolutionForm";
import { addSolution, getSolutions, updateSolution } from "../../lib/firestore";

export default function AdminSolutionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getSolutions()
      .then((list) => {
        if (!cancelled) setSolutions(list);
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

  // Category names already used by other solutions (drives the dropdown).
  const categories = solutions.map((s) => s.category).filter(Boolean);
  // Slugs used by *other* solutions (the one being edited may keep its own).
  const takenSlugs = solutions.filter((s) => s.id !== id).map((s) => s.slug);

  const handleSubmit = async (data) => {
    setSubmitError("");

    // Safety net: the form already checks this before uploading anything.
    if (takenSlugs.includes(data.slug)) {
      setSubmitError("Another solution already uses this slug. Please choose a different one.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateSolution(id, data);
      } else {
        await addSolution(data);
      }
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setSubmitError("Could not save the solution. Please try again.");
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
        initialValues={
          existing
            ? {
                title: existing.title ?? "",
                slug: existing.slug ?? "",
                category: existing.category ?? "",
                shortDescription: existing.shortDescription ?? "",
                fullDescription: existing.fullDescription ?? "",
                imageUrl: existing.imageUrl ?? "",
                galleryUrls: existing.galleryUrls ?? [],
                featured: Boolean(existing.featured),
                order: existing.order ?? nextOrder,
              }
            : { order: nextOrder }
        }
        categories={categories}
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