import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteCategory,
  getCategoryTree,
  getCategoryProductCounts,
} from "../../lib/firestore";

export default function AdminCategories() {
  const [tree, setTree] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategoryTree(), getCategoryProductCounts()])
      .then(([groups, countMap]) => {
        if (cancelled) return;
        setTree(groups);
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

  const toggleCollapsed = (slug) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete the category "${category.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setDeletingSlug(category.slug);
    try {
      await deleteCategory(category.slug);
      setTree((prev) =>
        prev
          .filter((p) => p.slug !== category.slug)
          .map((p) => ({
            ...p,
            subCategories: p.subCategories.filter((c) => c.slug !== category.slug),
          }))
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || `Could not delete "${category.name}". Please try again.`);
    } finally {
      setDeletingSlug(null);
    }
  };

  const subCountFor = (slug) => counts[slug] || 0;
  // A parent's own count = sum of its sub-categories' product counts
  // (products always point at a sub-category, never at the parent directly).
  const parentCountFor = (parent) =>
    parent.subCategories.reduce((sum, c) => sum + subCountFor(c.slug), 0);

  const rowActions = (category, blockDelete) => {
    const isDeleting = deletingSlug === category.slug;
    return (
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
          disabled={isDeleting || blockDelete}
          title={blockDelete ? "Move or delete what's underneath it first" : undefined}
          className="font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-container px-4 py-10 sm:px-6 lg:px-8">
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
      ) : tree.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-800">No categories yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Click "+ Add Category" to create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((parent) => {
            const isCollapsed = collapsed.has(parent.slug);
            return (
              <div key={parent.slug} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* Parent row */}
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(parent.slug)}
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200"
                  >
                    <span className={`inline-block transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>
                      ▾
                    </span>
                  </button>

                  {parent.coverImage ? (
                    <img src={parent.coverImage} alt="" className="h-10 w-14 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-14 rounded-md bg-slate-200" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{parent.name}</p>
                    <p className="text-xs text-slate-500">
                      {parent.slug} · {parent.subCategories.length} sub-categor
                      {parent.subCategories.length === 1 ? "y" : "ies"} · {parentCountFor(parent)} products
                    </p>
                  </div>

                  {parent.showOnHome && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Shown on home
                    </span>
                  )}

                  <div className="w-56 shrink-0">
                    {rowActions(parent, parent.subCategories.length > 0)}
                  </div>
                </div>

                {/* Sub-categories */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {parent.subCategories.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-slate-400">No sub-categories yet.</p>
                    ) : (
                      parent.subCategories.map((cat) => {
                        const count = subCountFor(cat.slug);
                        return (
                          <div key={cat.slug} className="flex items-center gap-3 px-4 py-3 pl-14">
                            {cat.coverImage ? (
                              <img src={cat.coverImage} alt="" className="h-9 w-12 rounded-md object-cover" />
                            ) : (
                              <div className="h-9 w-12 rounded-md bg-slate-100" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900">{cat.name}</p>
                              <p className="text-xs text-slate-500">
                                {cat.slug} · {count} product{count === 1 ? "" : "s"}
                              </p>
                            </div>
                            {cat.showOnHome && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                Shown
                              </span>
                            )}
                            <div className="w-56 shrink-0">{rowActions(cat, count > 0)}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}