import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteSolution, getSolutions } from "../../lib/firestore";

export default function SolutionsTable() {
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        getSolutions()
            .then((list) => {
                if (!cancelled) setSolutions(list);
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

    const handleDelete = async (solution) => {
        const confirmed = window.confirm(
            `Delete "${solution.title}"? This cannot be undone.`
        );
        if (!confirmed) return;

        setError("");
        setDeletingId(solution.id);
        try {
            await deleteSolution(solution.id);
            setSolutions((prev) => prev.filter((s) => s.id !== solution.id));
        } catch (err) {
            console.error(err);
            setError(`Could not delete "${solution.title}". Please try again.`);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <p className="text-slate-500">Loading solutions…</p>;
    }

    const sorted = [...solutions].sort(
        (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
    );

    return (
        <div>
            {error && (
                <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </p>
            )}

            {sorted.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <p className="font-medium text-slate-800">No solutions yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Click "+ Add Solution" to create your first one.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                    <table className="w-full min-w-[640px] text-left text-sm">
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
                            {sorted.map((solution) => (
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
                                            <Link
                                                to={`/solutions/${solution.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-slate-500 hover:text-slate-900"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                to={`/admin/solutions/${solution.id}/edit`}
                                                className="font-medium text-[#0b1c2c] hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(solution)}
                                                disabled={deletingId === solution.id}
                                                className="font-medium text-red-600 hover:underline disabled:opacity-50"
                                            >
                                                {deletingId === solution.id ? "Deleting…" : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}