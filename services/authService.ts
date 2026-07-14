import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";

const SESSION_KEY = "dyno.auth.session";

export type AuthSession = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  expiresIn: string;
  issuedAt: number;
};

type FirebaseAuthResponse = Omit<AuthSession, "issuedAt">;
type FirebaseErrorResponse = { error?: { message?: string } };
type RefreshResponse = {
  id_token: string;
  refresh_token: string;
  user_id: string;
  expires_in: string;
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

async function saveSession(session: AuthSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function authenticate(endpoint: "signInWithPassword" | "signUp", email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, returnSecureToken: true }),
    },
  );

  const data = (await response.json()) as FirebaseAuthResponse | FirebaseErrorResponse;
  if (!response.ok) {
    const code = "error" in data ? data.error?.message : undefined;
    throw new Error(getFriendlyError(code));
  }

  return saveSession({ ...(data as FirebaseAuthResponse), issuedAt: Date.now() });
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
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.idToken || !parsed.refreshToken || !parsed.localId || !parsed.email) return null;
    return {
      idToken: parsed.idToken,
      refreshToken: parsed.refreshToken,
      localId: parsed.localId,
      email: parsed.email,
      expiresIn: parsed.expiresIn ?? "3600",
      issuedAt: parsed.issuedAt ?? 0,
    };
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function getValidSession(): Promise<AuthSession | null> {
  const session = await getStoredSession();
  if (!session) return null;

  const expiresAt = session.issuedAt + Number(session.expiresIn || 3600) * 1000;
  if (Date.now() < expiresAt - 5 * 60 * 1000) return session;

  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`,
  });

  if (!response.ok) {
    await logout();
    return null;
  }

  const data = (await response.json()) as RefreshResponse;
  return saveSession({
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    localId: data.user_id,
    email: session.email,
    expiresIn: data.expires_in,
    issuedAt: Date.now(),
  });
}

export async function logout() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
