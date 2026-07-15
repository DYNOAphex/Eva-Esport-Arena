import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";
import type { RosterPlayer } from "./rosterStore";

const STORAGE_KEY = "dyno_roster_local_v2";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/roster`;

export async function updateCurrentRosterNickname(nicknameInput: string) {
  const session = await getValidSession();
  if (!session) throw new Error("Tu dois être connecté.");

  const nickname = nicknameInput.trim();
  if (nickname.length < 2) throw new Error("Le pseudo doit contenir au moins 2 caractères.");
  if (nickname.length > 24) throw new Error("Le pseudo ne peut pas dépasser 24 caractères.");

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const players = raw ? (JSON.parse(raw) as RosterPlayer[]) : [];
  const current = players.find((player) => player.accountUid === session.localId || player.accountEmail?.toLowerCase() === session.email.toLowerCase());
  if (!current) throw new Error("Ton membre d'équipe est introuvable.");

  const duplicate = players.some((player) => player.id !== current.id && player.nickname.trim().toLowerCase() === nickname.toLowerCase());
  if (duplicate) throw new Error("Ce pseudo est déjà utilisé dans l'équipe.");

  const changed: RosterPlayer = { ...current, nickname };
  const next = players.map((player) => player.id === current.id ? changed : player);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  const response = await fetch(`${FIRESTORE_BASE}/${encodeURIComponent(changed.id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        nickname: { stringValue: changed.nickname },
        createdAt: { stringValue: changed.createdAt },
        accountUid: { stringValue: changed.accountUid ?? "" },
        accountEmail: { stringValue: changed.accountEmail ?? "" },
      },
    }),
  }).catch(() => null);

  return { player: changed, cloudSynced: Boolean(response?.ok) };
}
