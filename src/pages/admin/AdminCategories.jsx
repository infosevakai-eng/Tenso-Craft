import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteCategory,
  getCategories,
  getCategoryProductCounts,
} from "../../lib/firestore";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getCategoryProductCounts()])
      .then(([list, countMap]) => {
        if (cancelled) return;
        setCategories(list);
        setCounts(countMap);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Could not load categories. Check your Firestore connection.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete the category "${category.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setDeletingSlug(category.slug);
    try {
      await deleteCategory(category.slug);
      setCategories((prev) => prev.filter((c) => c.slug !== category.slug));
    } catch (err) {
      console.error(err);
      // deleteCategory throws a readable message when the category still has products.
      setError(err?.message || `Could not delete "${category.name}". Please try again.`);
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold text-brand-navy">Categories</h1>
        <Link
          to="/admin/categories/new"
          className="rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
        >
          + Add Category
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading categories…</p>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-800">No categories yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Click "+ Add Category" to create your first one.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Cover</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Solutions</th>
                <th className="px-4 py-3 font-medium">On homepage</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => {
                const count = counts[category.slug] || 0;
                const isDeleting = deletingSlug === category.slug;
                return (
                  <tr key={category.slug} className="align-middle">
                    <td className="px-4 py-3">
                      {category.coverImage ? (
                        <img
                          src={category.coverImage}
                          alt=""
                          className="h-12 w-[72px] rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-12 w-[72px] rounded-md bg-slate-100" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{category.name}</p>
                      <p className="text-xs text-slate-500">{category.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{count}</td>
                    <td className="px-4 py-3">
                      {category.showOnHome ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          Shown
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{category.order ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          to={`/admin/categories/${category.slug}/edit`}
                          className="font-medium text-[#0b1c2c] hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={isDeleting || count > 0}
                          title={
                            count > 0
                              ? `Move or delete its ${count} solution${count === 1 ? "" : "s"} first`
                              : undefined
                          }
                          className="font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}