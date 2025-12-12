// src/hooks/useSession.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type Role =
  | "solicitud"
  | "revision"
  | "autorizacion"
  | "direccion"
  | "oficial_mayor"
  | "admin";

export type SessionUser = {
  uid: string;
  email: string;
  role: Role;
};

// Mock de usuarios DEMO
const MOCK_USERS: Array<{
  uid: string;
  email: string;
  password: string;
  role: Role;
}> = [
  {
    uid: "u-solicitud",
    email: "solicitud@tapachula.gob.mx",
    password: "tapachula2025",
    role: "solicitud",
  },
  {
    uid: "u-revision",
    email: "revision@tapachula.gob.mx",
    password: "tapachula2025",
    role: "revision",
  },
  {
    uid: "u-admin",
    email: "admin@tapachula.gob.mx",
    password: "tapachula2025",
    role: "admin",
  },
];

type SessionContextValue = {
  user: SessionUser | null;
  role: Role | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<SessionUser | null>;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "ofm_session_v1";

export function SessionProvider({ children }: { children: ReactNode }) {
  // Inicializar estado leyendo del localStorage si existe
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [role, setRole] = useState<Role | null>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved).role;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (
    email: string,
    password: string
  ): Promise<SessionUser | null> => {
    setLoading(true);
    setError(null);

    await new Promise((r) => setTimeout(r, 300));

    const found = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      setLoading(false);
      setError("Correo institucional o contraseña incorrectos.");
      return null;
    }

    const sessionUser: SessionUser = {
      uid: found.uid,
      email: found.email,
      role: found.role,
    };

    // Guardar en Estado y en LocalStorage
    setUser(sessionUser);
    setRole(found.role);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    
    setLoading(false);
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const value: SessionContextValue = {
    user,
    role,
    loading,
    error,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}