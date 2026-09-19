import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 4.06-5.06" />
      <path d="M9.9 5.24A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

export default function AdminLogin() {
  const { isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0b1c2c] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage solutions.</p>

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
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-11 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:text-slate-900"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

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