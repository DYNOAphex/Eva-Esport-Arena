import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";

const OWNER_EMAILS = new Set([
  "thibaut.llorens@hotmail.com",
  "thibaut.llorens13090@gmail.com",
]);

const ACCESS_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/appAccess`;

export async function canCreateScrim() {
  const session = await getValidSession();
  if (!session) return false;
  if (OWNER_EMAILS.has(session.email.toLowerCase())) return true;

  try {
    const response = await fetch(`${ACCESS_BASE}/${encodeURIComponent(session.localId)}`, {
      headers: { Authorization: `Bearer ${session.idToken}` },
    });
    if (!response.ok) return false;
    const document = (await response.json()) as {
      fields?: { canCreateScrim?: { booleanValue?: boolean } };
    };
    return document.fields?.canCreateScrim?.booleanValue === true;
  } catch {
    return false;
  }
}
