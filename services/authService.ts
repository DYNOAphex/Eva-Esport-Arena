import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";

const SESSION_KEY = "dyno.auth.session";

export type AuthSession = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  expiresIn: string;
};

type FirebaseAuthResponse = AuthSession;

type FirebaseErrorResponse = {
  error?: {
    message?: string;
  };
};

function getFriendlyError(code?: string) {
  switch (code) {
    case "EMAIL_EXISTS":
      return "Cette adresse e-mail est déjà utilisée.";
    case "INVALID_EMAIL":
      return "L'adresse e-mail n'est pas valide.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
    case "WEAK_PASSWORD":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "USER_DISABLED":
      return "Ce compte a été désactivé.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Adresse e-mail ou mot de passe incorrect.";
    default:
      return "Une erreur Firebase est survenue.";
  }
}

async function authenticate(endpoint: "signInWithPassword" | "signUp", email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true,
      }),
    },
  );

  const data = (await response.json()) as FirebaseAuthResponse | FirebaseErrorResponse;

  if (!response.ok) {
    const code = "error" in data ? data.error?.message : undefined;
    throw new Error(getFriendlyError(code));
  }

  const session = data as FirebaseAuthResponse;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function registerWithEmail(email: string, password: string) {
  return authenticate("signUp", email, password);
}

export function loginWithEmail(email: string, password: string) {
  return authenticate("signInWithPassword", email, password);
}

export async function getStoredSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function logout() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
