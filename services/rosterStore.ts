import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";

export type RosterPlayer = {
  id: string;
  nickname: string;
  createdAt: string;
  accountUid?: string;
  accountEmail?: string;
};

type FirestoreValue = { stringValue: string };
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

const STORAGE_KEY = "dyno_roster_local_v2";
const LEGACY_STORAGE_KEY = "dyno_roster_local_v1";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/roster`;
const LEGACY_SEEDED_IDS = new Set(["kroxx", "neazy", "zerox", "venom", "lyzen", "skyzz"]);
const listeners = new Set<(players: RosterPlayer[]) => void>();
let latestPlayers: RosterPlayer[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let syncInProgress = false;

function sortPlayers(players: RosterPlayer[]) { return [...players].sort((a, b) => a.nickname.localeCompare(b.nickname, "fr")); }
function removeLegacySeeds(players: RosterPlayer[]) { return players.filter((player) => !LEGACY_SEEDED_IDS.has(player.id)); }
async function persist(players: RosterPlayer[]) { latestPlayers = sortPlayers(removeLegacySeeds(players)); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latestPlayers)); listeners.forEach((listener) => listener(latestPlayers)); return latestPlayers; }
async function readStoredPlayers() {
  const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
  if (!raw) return [];
  try {
    const stored = JSON.parse(raw) as Array<RosterPlayer & Record<string, unknown>>;
    return sortPlayers(removeLegacySeeds(stored.map((player) => ({ id: player.id, nickname: player.nickname, createdAt: player.createdAt, accountUid: typeof player.accountUid === "string" && player.accountUid ? player.accountUid : undefined, accountEmail: typeof player.accountEmail === "string" && player.accountEmail ? player.accountEmail : undefined }))));
  } catch { await AsyncStorage.removeItem(STORAGE_KEY); return []; }
}
async function requireUser() { const session = await getValidSession(); if (!session) throw new Error("Tu dois être connecté pour modifier l'équipe."); return session; }
function fields(player: RosterPlayer): Record<string, FirestoreValue> { return { nickname: { stringValue: player.nickname }, createdAt: { stringValue: player.createdAt }, accountUid: { stringValue: player.accountUid ?? "" }, accountEmail: { stringValue: player.accountEmail ?? "" } }; }
function readString(value?: FirestoreValue) { return value?.stringValue ?? ""; }
function documentToPlayer(document: FirestoreDocument): RosterPlayer { const data = document.fields ?? {}; return { id: document.name.split("/").pop() ?? `${Date.now()}`, nickname: readString(data.nickname) || "Joueur DYNO", createdAt: readString(data.createdAt) || new Date().toISOString(), accountUid: readString(data.accountUid) || undefined, accountEmail: readString(data.accountEmail) || undefined }; }
async function firestoreRequest(url: string, init: RequestInit = {}) { const session = await requireUser(); return fetch(url, { ...init, headers: { Authorization: `Bearer ${session.idToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) } }); }
async function fetchCloudRoster() { const response = await firestoreRequest(`${FIRESTORE_BASE}?pageSize=100`); if (!response.ok) throw new Error("Synchronisation de l'équipe impossible."); const data = (await response.json()) as { documents?: FirestoreDocument[] }; const players = (data.documents ?? []).map(documentToPlayer); const seeded = players.filter((player) => LEGACY_SEEDED_IDS.has(player.id)); if (seeded.length) await Promise.all(seeded.map((player) => firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(player.id)}`, { method: "DELETE" }))); return sortPlayers(removeLegacySeeds(players)); }
async function uploadPlayer(player: RosterPlayer) { const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(player.id)}`, { method: "PATCH", body: JSON.stringify({ fields: fields(player) }) }); if (!response.ok) throw new Error("Enregistrement du joueur impossible."); }
async function syncFromCloud() { if (syncInProgress) return latestPlayers; syncInProgress = true; try { return persist(await fetchCloudRoster()); } catch { const local = await readStoredPlayers(); latestPlayers = local; return local; } finally { syncInProgress = false; } }

export async function getRoster() { const local = await readStoredPlayers(); latestPlayers = local; void syncFromCloud(); return local; }
export async function addRosterPlayer(input: Pick<RosterPlayer, "nickname">) {
  await requireUser();
  const nickname = input.nickname.trim();
  if (!nickname) throw new Error("Le pseudo est obligatoire.");
  const players = await fetchCloudRoster().catch(readStoredPlayers);
  if (players.some((player) => player.nickname.toLowerCase() === nickname.toLowerCase())) throw new Error("Ce joueur existe déjà dans l'équipe.");
  const player: RosterPlayer = { nickname, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() };
  await uploadPlayer(player); await persist([...players, player]); return player;
}
export async function ensureCurrentAccountRosterPlayer(nicknameInput: string) {
  const session = await requireUser();
  const nickname = nicknameInput.trim();
  if (!nickname) throw new Error("Le pseudo est obligatoire.");
  const players = await fetchCloudRoster().catch(readStoredPlayers);
  const linked = players.find((player) => player.accountUid === session.localId || player.accountEmail?.toLowerCase() === session.email.toLowerCase());
  if (linked) return linked;
  const sameNickname = players.find((player) => player.nickname.toLowerCase() === nickname.toLowerCase());
  if (sameNickname?.accountUid && sameNickname.accountUid !== session.localId) throw new Error("Ce pseudo est déjà utilisé par un autre compte.");
  const player: RosterPlayer = sameNickname
    ? { ...sameNickname, accountUid: session.localId, accountEmail: session.email.toLowerCase() }
    : { id: session.localId, nickname, createdAt: new Date().toISOString(), accountUid: session.localId, accountEmail: session.email.toLowerCase() };
  await uploadPlayer(player);
  await persist(sameNickname ? players.map((item) => item.id === sameNickname.id ? player : item) : [...players, player]);
  return player;
}
export async function linkCurrentAccountToPlayer(playerId: string) {
  const session = await requireUser();
  const players = await fetchCloudRoster().catch(readStoredPlayers);
  const target = players.find((player) => player.id === playerId);
  if (!target) throw new Error("Ce joueur n'existe plus.");
  const alreadyLinked = players.find((player) => player.accountUid === session.localId && player.id !== playerId);
  if (alreadyLinked) throw new Error(`Ton compte est déjà associé à ${alreadyLinked.nickname}.`);
  if (target.accountUid && target.accountUid !== session.localId) throw new Error("Ce pseudo est déjà associé à un autre compte.");
  const changed = { ...target, accountUid: session.localId, accountEmail: session.email.toLowerCase() };
  await uploadPlayer(changed); await persist(players.map((player) => player.id === playerId ? changed : player)); return changed;
}
export async function unlinkPlayerAccount(playerId: string) { const players = await fetchCloudRoster().catch(readStoredPlayers); const target = players.find((player) => player.id === playerId); if (!target) throw new Error("Ce joueur n'existe plus."); const changed = { ...target, accountUid: undefined, accountEmail: undefined }; await uploadPlayer(changed); await persist(players.map((player) => player.id === playerId ? changed : player)); }
export async function getRosterPlayerForAccount(uid: string, email?: string) { const players = await fetchCloudRoster().catch(readStoredPlayers); const normalizedEmail = email?.trim().toLowerCase(); return players.find((player) => player.accountUid === uid) ?? players.find((player) => normalizedEmail && player.accountEmail?.toLowerCase() === normalizedEmail) ?? null; }
export async function deleteRosterPlayer(playerId: string) { await requireUser(); const players = await readStoredPlayers(); const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(playerId)}`, { method: "DELETE" }); if (!response.ok && response.status !== 404) throw new Error("Suppression du joueur impossible."); await persist(players.filter((player) => player.id !== playerId)); }
export function subscribeToRoster(listener: (players: RosterPlayer[]) => void) { listeners.add(listener); listener(latestPlayers); void syncFromCloud(); if (!pollTimer) pollTimer = setInterval(() => void syncFromCloud(), 5000); return () => { listeners.delete(listener); if (!listeners.size && pollTimer) { clearInterval(pollTimer); pollTimer = null; } }; }
