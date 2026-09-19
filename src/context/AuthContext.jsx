import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "isAdmin";
const AuthContext = createContext(null);

function readFlag() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(readFlag);

  const login = useCallback((email, password) => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL ?? "").trim();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

    if (!adminEmail || !adminPassword) {
      return {
        ok: false,
        error:
          "Admin credentials are not configured. Set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in .env and restart the dev server.",
      };
    }

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.toLowerCase();
    const passwordMatches = password === adminPassword;

    // Temporary debug: prints lengths only, never the actual values.
    // Remove after login works.
    if (import.meta.env.DEV) {
      console.log("[auth debug]", {
        emailMatches,
        passwordMatches,
        envEmailLength: adminEmail.length,
        typedEmailLength: email.trim().length,
        envPasswordLength: adminPassword.length,
        typedPasswordLength: password.length,
      });
    }

    if (emailMatches && passwordMatches) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* sessionStorage blocked; state still works for this session */
      }
      setIsAdmin(true);
      return { ok: true };
    }

    return { ok: false, error: "Invalid email or password." };
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setIsAdmin(false);
  }, []);

  const value = useMemo(() => ({ isAdmin, login, logout }), [isAdmin, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}