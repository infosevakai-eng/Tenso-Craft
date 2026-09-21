import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "../../lib/firestore";

const PAGE_SIZE = 25;
const NO_CATEGORY = "__none__";

const EMPTY_FILTERS = { search: "", category: "", status: "all", needsImage: false };

const filterInputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0b1c2c] focus:ring-2 focus:ring-[#0b1c2c]/10";

export default function SolutionsTable() {
  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null); // row currently being deleted / published
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

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
        if (!cancelled) setError("Could not load solutions. Check your Firestore connection.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const stats = useMemo(() => {
    const published = solutions.filter((s) => s.published !== false).length;
    return {
      total: solutions.length,
      published,
      drafts: solutions.length - published,
      needImage: solutions.filter((s) => !s.imageUrl).length,
    };
  }, [solutions]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return solutions.filter((s) => {
      if (query) {
        const haystack = `${s.title ?? ""} ${s.slug ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.category === NO_CATEGORY) {
        if (s.categorySlug) return false;
      } else if (filters.category && s.categorySlug !== filters.category) {
        return false;
      }
      if (filters.status === "published" && s.published === false) return false;
      if (filters.status === "draft" && s.published !== false) return false;
      if (filters.needsImage && s.imageUrl) return false;
      return true;
    });
  }, [solutions, filters]);

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    Boolean(filters.category) ||
    filters.status !== "all" ||
    filters.needsImage;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const handleDelete = async (solution) => {
    const confirmed = window.confirm(
      `Delete "${solution.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setBusyId(solution.id);
    try {
      await deleteProduct(solution.id);
      setSolutions((prev) => prev.filter((s) => s.id !== solution.id));
    } catch (err) {
      console.error(err);
      setError(`Could not delete "${solution.title}". Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePublish = async (solution) => {
    const publishing = solution.published === false;

    if (publishing && !solution.imageUrl) {
      setError(`Add a main image to "${solution.title}" before publishing it.`);
      return;
    }

    setError("");
    setBusyId(solution.id);
    try {
      await updateProduct(solution.id, { published: publishing });
      setSolutions((prev) =>
        prev.map((s) => (s.id === solution.id ? { ...s, published: publishing } : s))
      );
    } catch (err) {
      console.error(err);
      setError(
        `Could not ${publishing ? "publish" : "unpublish"} "${solution.title}". Please try again.`
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Loading products…</p>;
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {solutions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-800">No solutions yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Click "+ Add Solution" to create your first one.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">
            {stats.total} solutions · {stats.published} published · {stats.drafts} drafts ·{" "}
            {stats.needImage} need an image
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Search by title or slug"
              aria-label="Search solutions"
              className={`${filterInputClass} min-w-[14rem] flex-1`}
            />
            <select
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value)}
              aria-label="Filter by category"
              className={filterInputClass}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value={NO_CATEGORY}>No category</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
              aria-label="Filter by status"
              className={filterInputClass}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.needsImage}
                onChange={(e) => setFilter("needsImage", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Needs image
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="font-medium text-slate-800">No solutions match these filters</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm font-medium text-[#0b1c2c] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Image</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Featured</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((solution) => {
                    const isDraft = solution.published === false;
                    const isBusy = busyId === solution.id;
                    return (
                      <tr key={solution.id} className="align-middle">
                        <td className="px-4 py-3">
                          {solution.imageUrl ? (
                            <img
                              src={solution.imageUrl}
                              alt=""
                              className="h-14 w-[84px] rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-md bg-slate-100" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{solution.title}</p>
                          <p className="text-xs text-slate-500">/{solution.slug}</p>
                          {(isDraft || !solution.imageUrl) && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {isDraft && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  Draft
                                </span>
                              )}
                              {!solution.imageUrl && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                  No image
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{solution.category || "—"}</td>
                        <td className="px-4 py-3">
                          {solution.featured ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                              Featured
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{solution.order ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-4">
                            {!isDraft && (
                              <Link
                                to={`/solutions/${solution.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-slate-900"
                              >
                                View
                              </Link>
                            )}
                            <Link
                              to={`/admin/solutions/${solution.id}/edit`}
                              className="font-medium text-[#0b1c2c] hover:underline"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(solution)}
                              disabled={isBusy}
                              className="font-medium text-slate-600 hover:text-slate-900 hover:underline disabled:opacity-50"
                            >
                              {isDraft ? "Publish" : "Unpublish"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(solution)}
                              disabled={isBusy}
                              className="font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              {isBusy ? "Working…" : "Delete"}
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

          {filtered.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <p>
                Showing {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}