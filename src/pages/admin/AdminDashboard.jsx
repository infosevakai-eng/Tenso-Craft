import { Link } from "react-router-dom";
import SolutionsTable from "../../components/admin/SolutionsTable";

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-container px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold text-brand-navy">Products</h1>
        <Link
          to="/admin/products/new"
          className="rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light"
        >
          + Add Product
        </Link>
      </div>

      <SolutionsTable />
    </div>
  );
}