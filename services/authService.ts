import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/auth";

function getFriendlyError(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Cette adresse e-mail est déjà utilisée.";
    case "auth/invalid-email":
      return "L'adresse e-mail n'est pas valide.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "auth/user-disabled":
      return "Ce compte a été désactivé.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Adresse e-mail ou mot de passe incorrect.";
    default:
      return "Une erreur Firebase est survenue.";
  }
}

function normalizeAuthError(error: unknown): never {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
  throw new Error(getFriendlyError(code));
}

export async function registerWithEmail(email: string, password: string) {
  try {
    return await createUserWithEmailAndPassword(auth, email.trim(), password);
  } catch (error) {
    normalizeAuthError(error);
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    return await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error) {
    normalizeAuthError(error);
  }
}

export async function logout() {
  await signOut(auth);
}
