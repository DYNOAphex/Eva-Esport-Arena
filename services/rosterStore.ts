import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";

export type PlayerRole = "Fondateur" | "Coach" | "Manager" | "Capitaine" | "Joueur" | "Remplaçant";
export type PlayerStatus = "Disponible" | "Absent" | "En vacances";

export type RosterPlayer = {
  id: string;
  nickname: string;
  email: string;
  role: PlayerRole;
  status: PlayerStatus;
  rank?: string;
  createdAt: string;
};

type FirestoreValue = { stringValue: string };
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

const STORAGE_KEY = "dyno_roster_local_v2";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/roster`;
const listeners = new Set<(players: RosterPlayer[]) => void>();
let latestPlayers: RosterPlayer[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let syncInProgress = false;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isRosterAdmin(role?: PlayerRole) {
  return role === "Fondateur" || role === "Coach" || role === "Manager";
}

function nicknameFromEmail(email: string) {
  return email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Fondateur DYNO";
}

function sortPlayers(players: RosterPlayer[]) {
  return [...players].sort((a, b) => a.nickname.localeCompare(b.nickname, "fr"));
}

async function persist(players: RosterPlayer[]) {
  latestPlayers = sortPlayers(players);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latestPlayers));
  listeners.forEach((listener) => listener(latestPlayers));
  return latestPlayers;
}

async function readStoredPlayers() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return sortPlayers(JSON.parse(raw) as RosterPlayer[]);
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

async function requireUser() {
  const session = await getValidSession();
  if (!session) throw new Error("Tu dois être connecté pour accéder à l'équipe.");
  return session;
}

function fields(player: RosterPlayer): Record<string, FirestoreValue> {
  return {
    nickname: { stringValue: player.nickname },
    email: { stringValue: normalizeEmail(player.email) },
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
    nickname: readString(data.nickname) || "Membre DYNO",
    email: normalizeEmail(readString(data.email)),
    role:
      role === "Fondateur" || role === "Coach" || role === "Manager" || role === "Capitaine" || role === "Remplaçant"
        ? role
        : "Joueur",
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
  return sortPlayers((data.documents ?? []).map(documentToPlayer));
}

async function uploadPlayer(player: RosterPlayer) {
  const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(player.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: fields(player) }),
  });
  if (!response.ok) throw new Error("Enregistrement du membre impossible.");
}

async function ensureFounder(players: RosterPlayer[]) {
  if (players.length) return players;
  const session = await requireUser();
  const founder: RosterPlayer = {
    id: session.localId,
    nickname: nicknameFromEmail(session.email),
    email: normalizeEmail(session.email),
    role: "Fondateur",
    status: "Disponible",
    createdAt: new Date().toISOString(),
  };
  await uploadPlayer(founder);
  return [founder];
}

async function requireRosterAdmin() {
  const session = await requireUser();
  let players = await fetchCloudRoster().catch(readStoredPlayers);
  players = await ensureFounder(players);
  const member = players.find((player) => normalizeEmail(player.email) === normalizeEmail(session.email));
  if (!member || !isRosterAdmin(member.role)) {
    throw new Error("Cette action est réservée au Fondateur, Coach ou Manager.");
  }
  return { session, member, players };
}

async function syncFromCloud() {
  if (syncInProgress) return latestPlayers;
  syncInProgress = true;
  try {
    const cloud = await fetchCloudRoster();
    return persist(await ensureFounder(cloud));
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

export async function getCurrentRosterMember() {
  const session = await requireUser();
  let players = await fetchCloudRoster().catch(readStoredPlayers);
  players = await ensureFounder(players);
  await persist(players);
  return players.find((player) => normalizeEmail(player.email) === normalizeEmail(session.email)) ?? null;
}

export async function addRosterPlayer(
  input: Pick<RosterPlayer, "nickname" | "email" | "role" | "status" | "rank">,
) {
  const { member, players } = await requireRosterAdmin();
  const nickname = input.nickname.trim();
  const email = normalizeEmail(input.email);
  if (!nickname) throw new Error("Le pseudo est obligatoire.");
  if (!email || !email.includes("@")) throw new Error("Une adresse e-mail valide est obligatoire.");
  if (input.role === "Fondateur" && member.role !== "Fondateur") {
    throw new Error("Seul le Fondateur peut nommer un autre Fondateur.");
  }
  if (players.some((player) => normalizeEmail(player.email) === email)) {
    throw new Error("Cette adresse e-mail appartient déjà à un membre.");
  }
  const player: RosterPlayer = {
    ...input,
    nickname,
    email,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await uploadPlayer(player);
  await persist([...players, player]);
  return player;
}

export async function deleteRosterPlayer(playerId: string) {
  const { session, players } = await requireRosterAdmin();
  const target = players.find((player) => player.id === playerId);
  if (!target) return;
  if (normalizeEmail(target.email) === normalizeEmail(session.email)) {
    throw new Error("Tu ne peux pas retirer ton propre compte.");
  }
  if (target.role === "Fondateur" && players.filter((player) => player.role === "Fondateur").length <= 1) {
    throw new Error("Le dernier Fondateur ne peut pas être retiré.");
  }
  const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(playerId)}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new Error("Suppression du membre impossible.");
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
