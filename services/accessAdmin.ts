import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";
import type { RosterPlayer } from "./rosterStore";

const OWNER_EMAIL = "thibaut.llorens@hotmail.com";
const ACCESS_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/appAccess`;

async function requireOwner() {
  const session = await getValidSession();
  if (!session || session.email.toLowerCase() !== OWNER_EMAIL) {
    throw new Error("Action réservée au propriétaire de DYNO.");
  }
  return session;
}

export async function getPlayerScrimAccess(player: RosterPlayer) {
  if (!player.accountUid) return false;
  const session = await requireOwner();
  const response = await fetch(`${ACCESS_BASE}/${encodeURIComponent(player.accountUid)}`, {
    headers: { Authorization: `Bearer ${session.idToken}` },
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error("Lecture des droits impossible.");
  const document = await response.json() as { fields?: { canCreateScrim?: { booleanValue?: boolean } } };
  return document.fields?.canCreateScrim?.booleanValue === true;
}

export async function setPlayerScrimAccess(player: RosterPlayer, enabled: boolean) {
  if (!player.accountUid) throw new Error("Ce joueur doit d’abord avoir un compte lié.");
  const session = await requireOwner();
  const response = await fetch(`${ACCESS_BASE}/${encodeURIComponent(player.accountUid)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        canCreateScrim: { booleanValue: enabled },
        canManageScrims: { booleanValue: false },
        nickname: { stringValue: player.nickname },
      },
    }),
  });
  if (!response.ok) throw new Error("Modification des droits impossible.");
  return enabled;
}
