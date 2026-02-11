import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, getSecondaryAuth } from "../firebase/firebase";

// Importamos los tipos centrales
import type { SessionUser, Role } from "../types";

// Re-exportamos
export type { SessionUser, Role };

// --- CORRECCIÓN 1: Definimos un tipo especial para cuando CREAMOS usuario ---
// Esto permite que 'data' tenga password solo en ese momento.
type CreateUserData = SessionUser & { password?: string };

type SessionContextValue = {
  user: SessionUser | null;
  role: Role | null;
  booting: boolean;
  allUsers: SessionUser[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<SessionUser | null>;
  logout: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<void>; // Usamos el tipo extendido aquí
  updateUser: (uid: string, data: Partial<SessionUser>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [booting, setBooting] = useState(true);
  
  const [allUsers, setAllUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. ESCUCHA DE SESIÓN (AUTH + FIRESTORE)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setBooting(false);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const finalUser = { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email!, 
            ...userData 
          } as SessionUser;

          setUser(finalUser);
          setRole(finalUser.role);
        } else {
          console.error("Usuario autenticado sin perfil en Firestore");
          setUser(null);
          setRole(null);
        }
        setBooting(false);
      }, (err) => {
        console.error("Error leyendo perfil:", err);
        setBooting(false);
      });

      return () => unsubscribeFirestore();
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. CARGA DE TODOS LOS USUARIOS (Para Admin y Dirección)
  useEffect(() => {
    // 👇 CAMBIO AQUÍ: Permitimos a "admin" y a "direccion" descargar la lista 👇
    if (role !== "admin" && role !== "direccion") {
      setAllUsers([]);
      return;
    }

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((d) => ({ 
        uid: d.id, 
        ...d.data() 
      })) as SessionUser[];
      setAllUsers(users);
    });
    return () => unsub();
  }, [role]);

  // --- ACCIONES ---

  const toMessage = (e: any, defaultMsg: string) => {
    const code = e?.code || "";
    if (code === "auth/wrong-password") return "Contraseña incorrecta.";
    if (code === "auth/user-not-found") return "Usuario no encontrado.";
    if (code === "auth/invalid-credential") return "Credenciales inválidas.";
    return defaultMsg;
  };

  const login: SessionContextValue["login"] = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { uid: cred.user.uid, email: cred.user.email!, role: 'solicitud', organo: '', titular: '' } as SessionUser; 
    } catch (e) {
      setError(toMessage(e, "Error al iniciar sesión. Verifica tus datos."));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setAllUsers([]);
    } catch (e) { console.error(e); }
  };

  const changePassword = async (newPass: string) => {
     setLoading(true);
     setError(null);
     try {
        if (auth.currentUser) {
            await updatePassword(auth.currentUser, newPass);
        } else {
            throw new Error("No hay sesión activa");
        }
     } catch(e) {
        setError(toMessage(e, "Error al actualizar contraseña."));
        throw e;
     } finally {
        setLoading(false);
     }
  };

  // --- ADMINISTRACIÓN DE USUARIOS ---

  // CORRECCIÓN 2: Usamos CreateUserData para permitir el campo 'password'
  const createUser: SessionContextValue["createUser"] = async (data: CreateUserData) => {
    if (user?.role !== "admin") throw new Error("No autorizado");
    setLoading(true);
    setError(null);
    try {
      if (!data.password) throw new Error("Falta contraseña");
      
      const secondaryAuth = getSecondaryAuth();
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const newUid = userCred.user.uid;

      // Desestructuramos para separar password del resto de datos
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = data; 
      
      await setDoc(doc(db, "users", newUid), {
        ...rest,
        uid: newUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        disabled: false
      });
      
      await signOut(secondaryAuth);

    } catch (e) {
      setError(toMessage(e, "Error al crear usuario."));
    } finally {
      setLoading(false);
    }
  };

  const updateUser: SessionContextValue["updateUser"] = async (uid, data) => {
    if (user?.role !== "admin") throw new Error("No autorizado");
    setLoading(true);
    setError(null);
    try {
      // CORRECCIÓN 3: Ya no intentamos sacar 'password' de data, 
      // porque Partial<SessionUser> ya no lo tiene. Solo sacamos uid si viene.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uid: _x, ...safe } = data;
      
      await updateDoc(doc(db, "users", uid), { ...safe, updatedAt: serverTimestamp() });
    } catch (e) {
      setError(toMessage(e, "Error al actualizar."));
    } finally {
      setLoading(false);
    }
  };

  const deleteUser: SessionContextValue["deleteUser"] = async (uid) => {
    if (user?.role !== "admin") throw new Error("No autorizado");
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (e) {
      setError(toMessage(e, "Error al eliminar."));
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      role,
      booting,
      allUsers,
      loading,
      error,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      changePassword,
    }),
    [user, role, booting, allUsers, loading, error]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession debe usarse dentro de SessionProvider");
  return context;
}