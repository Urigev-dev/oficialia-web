// src/hooks/useSession.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type Role = "solicitud" | "revision" | "autorizacion" | "direccion" | "admin";

export type SessionUser = {
  uid: string;
  email: string;
  role: Role;
  organo: string;
  titular: string;
  password?: string;
};

// Admin por defecto para bootstrap
const BOOTSTRAP_ADMIN: SessionUser = {
  uid: "admin-master",
  email: "admin@tapachula.gob.mx",
  password: "admin",
  role: "admin",
  organo: "URIGEV",
  titular: "Uriel Gerónimo Velázquez"
};

type SessionContextValue = {
  user: SessionUser | null;
  role: Role | null;
  allUsers: SessionUser[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<SessionUser | null>;
  logout: () => void;
  createUser: (user: Omit<SessionUser, "uid">) => void;
  updateUser: (uid: string, data: Partial<SessionUser>) => void;
  deleteUser: (uid: string) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_SESSION = "ofm_session_v2";
const STORAGE_USERS = "ofm_users_db_v2";

export function SessionProvider({ children }: { children: ReactNode }) {
  // LEER DE INMEDIATO (Síncrono) para evitar problemas de AuthGuard en ventanas nuevas
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_SESSION);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [allUsers, setAllUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(false); // Ya no inicia en true
  const [error, setError] = useState<string | null>(null);

  // Cargar BD de usuarios
  useEffect(() => {
    const savedUsers = window.localStorage.getItem(STORAGE_USERS);
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    } else {
      setAllUsers([BOOTSTRAP_ADMIN]);
      window.localStorage.setItem(STORAGE_USERS, JSON.stringify([BOOTSTRAP_ADMIN]));
    }
  }, []);

  // Persistir cambios en usuarios
  useEffect(() => {
    if (allUsers.length > 0) {
      window.localStorage.setItem(STORAGE_USERS, JSON.stringify(allUsers));
    }
  }, [allUsers]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 400)); 

    const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!found) {
      setLoading(false);
      setError("Credenciales inválidas.");
      return null;
    }

    const sessionUser = { ...found };
    delete sessionUser.password;
    setUser(sessionUser);
    window.localStorage.setItem(STORAGE_SESSION, JSON.stringify(sessionUser));
    setLoading(false);
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_SESSION);
  };

  const createUser = (newUser: Omit<SessionUser, "uid">) => {
    const uid = `u-${Date.now()}`;
    setAllUsers(prev => [...prev, { ...newUser, uid }]);
  };

  const updateUser = (uid: string, data: Partial<SessionUser>) => {
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
    if (user?.uid === uid) {
      const updated = { ...user, ...data };
      setUser(updated as SessionUser);
      window.localStorage.setItem(STORAGE_SESSION, JSON.stringify(updated));
    }
  };

  const deleteUser = (uid: string) => {
    setAllUsers(prev => prev.filter(u => u.uid !== uid));
  };

  return (
    <SessionContext.Provider value={{ 
      user, role: user?.role || null, allUsers, loading, error, 
      login, logout, createUser, updateUser, deleteUser 
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession used outside provider");
  return ctx;
}