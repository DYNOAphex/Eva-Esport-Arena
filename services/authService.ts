import { firebaseConfig } from "../firebase/config";

type FirebaseAuthResponse = {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
};

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
    case "EMAIL_NOT_FOUND":
    case "INVALID_LOGIN_CREDENTIALS":
    case "INVALID_PASSWORD":
      return "Adresse e-mail ou mot de passe incorrect.";
    case "USER_DISABLED":
      return "Ce compte a été désactivé.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    default:
      return code ? `Erreur Firebase : ${code}` : "Une erreur est survenue.";
  }
}

async function callFirebaseAuth(
  endpoint: "signUp" | "signInWithPassword",
  email: string,
  password: string,
): Promise<FirebaseAuthResponse> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true,
      }),
    },
  );

  const data = (await response.json()) as FirebaseAuthResponse & FirebaseErrorResponse;

  if (!response.ok) {
    throw new Error(getFriendlyError(data.error?.message));
  }

  return data;
}

export function registerWithEmail(email: string, password: string) {
  return callFirebaseAuth("signUp", email, password);
}

export function loginWithEmail(email: string, password: string) {
  return callFirebaseAuth("signInWithPassword", email, password);
}

export async function logout() {
  return Promise.resolve();
}
