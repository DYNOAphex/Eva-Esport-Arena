import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";

export type PlayerRole = "Coach" | "Manager" | "Capitaine" | "Joueur" | "Remplaçant";
export type PlayerStatus = "Disponible" | "Absent" | "En vacances";

export type RosterPlayer = {
  id: string;
  nickname: string;
  role: PlayerRole;
  status: PlayerStatus;
  rank?: string;
  createdAt: string;
};

type FirestoreValue = { stringValue: string };
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

const STORAGE_KEY = "dyno_roster_local_v1";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/roster`;
const LEGACY_SEEDED_IDS = new Set(["kroxx", "neazy", "zerox", "venom", "lyzen", "skyzz"]);
const listeners = new Set<(players: RosterPlayer[]) => void>();
let latestPlayers: RosterPlayer[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let syncInProgress = false;

function sortPlayers(players: RosterPlayer[]) {
  return [...players].sort((a, b) => a.nickname.localeCompare(b.nickname, "fr"));
}

function removeLegacySeeds(players: RosterPlayer[]) {
  return players.filter((player) => !LEGACY_SEEDED_IDS.has(player.id));
}

async function persist(players: RosterPlayer[]) {
  latestPlayers = sortPlayers(removeLegacySeeds(players));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latestPlayers));
  listeners.forEach((listener) => listener(latestPlayers));
  return latestPlayers;
}

async function readStoredPlayers() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const players = removeLegacySeeds(JSON.parse(raw) as RosterPlayer[]);
    if (!players.length) await AsyncStorage.removeItem(STORAGE_KEY);
    return sortPlayers(players);
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

async function requireUser() {
  const session = await getValidSession();
  if (!session) throw new Error("Tu dois être connecté pour modifier l'équipe.");
  return session;
}

function fields(player: RosterPlayer): Record<string, FirestoreValue> {
  return {
    nickname: { stringValue: player.nickname },
    role: { stringValue: player.role },
    status: { stringValue: player.status },
    rank: { stringValue: player.rank ?? "" },
    createdAt: { stringValue: player.createdAt },
  };
}

function readString(value?: FirestoreValue) {
  return value?.stringValue ?? "";
}

function documentToPlayer(document: FirestoreDocument): RosterPlayer {
  const data = document.fields ?? {};
  const role = readString(data.role);
  const status = readString(data.status);
  return {
    id: document.name.split("/").pop() ?? `${Date.now()}`,
    nickname: readString(data.nickname) || "Joueur DYNO",
    role: role === "Coach" || role === "Manager" || role === "Capitaine" || role === "Remplaçant" ? role : "Joueur",
    status: status === "Absent" || status === "En vacances" ? status : "Disponible",
    rank: readString(data.rank) || undefined,
    createdAt: readString(data.createdAt) || new Date().toISOString(),
  };
}

async function firestoreRequest(url: string, init: RequestInit = {}) {
  const session = await requireUser();
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function fetchCloudRoster() {
  const response = await firestoreRequest(`${FIRESTORE_BASE}?pageSize=100`);
  if (!response.ok) throw new Error("Synchronisation de l'équipe impossible.");
  const data = (await response.json()) as { documents?: FirestoreDocument[] };
  const players = (data.documents ?? []).map(documentToPlayer);
  const seeded = players.filter((player) => LEGACY_SEEDED_IDS.has(player.id));

  if (seeded.length) {
    await Promise.all(
      seeded.map((player) =>
        firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(player.id)}`, { method: "DELETE" }),
      ),
    );
  }

  return sortPlayers(removeLegacySeeds(players));
}

async function uploadPlayer(player: RosterPlayer) {
  const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(player.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: fields(player) }),
  });
  if (!response.ok) throw new Error("Enregistrement du joueur impossible.");
}

async function syncFromCloud() {
  if (syncInProgress) return latestPlayers;
  syncInProgress = true;
  try {
    return persist(await fetchCloudRoster());
  } catch {
    const local = await readStoredPlayers();
    latestPlayers = local;
    return local;
  } finally {
    syncInProgress = false;
  }
}

export async function getRoster() {
  const local = await readStoredPlayers();
  latestPlayers = local;
  void syncFromCloud();
  return local;
}

export async function addRosterPlayer(input: Pick<RosterPlayer, "nickname" | "role" | "status" | "rank">) {
  await requireUser();
  const nickname = input.nickname.trim();
  if (!nickname) throw new Error("Le pseudo est obligatoire.");
  const players = await readStoredPlayers();
  if (players.some((player) => player.nickname.toLowerCase() === nickname.toLowerCase())) {
    throw new Error("Ce joueur existe déjà dans l'équipe.");
  }
  const player: RosterPlayer = {
    ...input,
    nickname,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await uploadPlayer(player);
  await persist([...players, player]);
  return player;
}

export async function deleteRosterPlayer(playerId: string) {
  await requireUser();
  const players = await readStoredPlayers();
  const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(playerId)}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new Error("Suppression du joueur impossible.");
  await persist(players.filter((player) => player.id !== playerId));
}

export function subscribeToRoster(listener: (players: RosterPlayer[]) => void) {
  listeners.add(listener);
  listener(latestPlayers);
  void syncFromCloud();
  if (!pollTimer) pollTimer = setInterval(() => void syncFromCloud(), 5000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}
