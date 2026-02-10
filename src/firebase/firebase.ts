// src/firebase/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  // CAMBIO AQUÍ: Usamos Session en lugar de Local
  browserSessionPersistence, // <--- ANTES ERA browserLocalPersistence
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function requireEnv(name: string): string {
  const v = (import.meta as any).env?.[name] as string | undefined;
  if (!v) throw new Error(`Falta variable de entorno ${name}. Revisa tu archivo .env`);
  return v;
}

export const firebaseConfig = {
  apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv("VITE_FIREBASE_APP_ID"),
};

export function getPrimaryApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const app: FirebaseApp = getPrimaryApp();

/**
 * Auth primario (sesión normal del usuario).
 * Importante: inicializamos con persistencia DE SESIÓN para seguridad.
 */
export const auth: Auth = (() => {
  try {
    // Intenta inicializar con persistencia de SESIÓN (se borra al cerrar navegador)
    return initializeAuth(app, { persistence: browserSessionPersistence });
  } catch (e) {
    // Fallback si ya existía la instancia
    const a = getAuth(app);
    // Forzamos el cambio de persistencia
    setPersistence(a, browserSessionPersistence).catch(() => {
      console.warn("No se pudo establecer persistencia de sesión");
    });
    return a;
  }
})();

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// --------------------------------------------------
// App/Auth secundaria (solo para crear usuarios)
// --------------------------------------------------

const SECONDARY_APP_NAME = "secondary-admin";
let _secondaryAuth: Auth | null = null;

export function getSecondaryApp(name = SECONDARY_APP_NAME): FirebaseApp {
  const existing = getApps().find((a) => a.name === name);
  return existing ? getApp(name) : initializeApp(firebaseConfig, name);
}

export function getSecondaryAuth(): Auth {
  if (_secondaryAuth) return _secondaryAuth;

  const secondaryApp = getSecondaryApp(SECONDARY_APP_NAME);
  try {
    _secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });
  } catch {
    _secondaryAuth = getAuth(secondaryApp);
    setPersistence(_secondaryAuth, inMemoryPersistence).catch(() => {});
  }

  return _secondaryAuth;
}