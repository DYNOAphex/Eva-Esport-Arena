import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";

const OWNER_EMAILS = new Set([
  "thibaut.llorens@hotmail.com",
  "thibaut.llorens13090@gmail.com",
]);

const ACCESS_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/appAccess`;

export type ScrimPermissions = {
  canCreate: boolean;
  canManage: boolean;
};

export async function getScrimPermissions(): Promise<ScrimPermissions> {
  const session = await getValidSession();
  if (!session) return { canCreate: false, canManage: false };
  if (OWNER_EMAILS.has(session.email.toLowerCase())) return { canCreate: true, canManage: true };

  try {
    const response = await fetch(`${ACCESS_BASE}/${encodeURIComponent(session.localId)}`, {
      headers: { Authorization: `Bearer ${session.idToken}` },
    });
    if (!response.ok) return { canCreate: false, canManage: false };
    const document = (await response.json()) as {
      fields?: {
        canCreateScrim?: { booleanValue?: boolean };
        canManageScrims?: { booleanValue?: boolean };
      };
    };
    const canCreate = document.fields?.canCreateScrim?.booleanValue === true;
    const canManage = document.fields?.canManageScrims?.booleanValue === true || canCreate;
    return { canCreate, canManage };
  } catch {
    return { canCreate: false, canManage: false };
  }
}

export async function canCreateScrim() {
  return (await getScrimPermissions()).canCreate;
}

export async function canManageScrims() {
  return (await getScrimPermissions()).canManage;
}