import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAdmin) return <Navigate to={redirectTo} replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const result = login(email, password);
    if (result.ok) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1c2c] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to manage solutions.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-[#0b1c2c] px-4 py-2.5 font-medium text-white transition hover:bg-[#12304a]"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}