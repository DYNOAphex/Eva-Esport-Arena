import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";
import { canCreateScrim, canManageScrims } from "./accessControl";
import { getValidSession } from "./authService";
import { getRosterPlayerForAccount } from "./rosterStore";

export type MatchType = "Scrim" | "Division";
export type MatchArena = "Arène 1" | "Arène 2";
export type MatchStatus = "En attente" | "Confirmé" | "Annulé";
export type Availability = "Disponible" | "Indisponible" | "En attente";

export type PlayerResponse = { uid?: string; player: string; status: Availability };
export type Match = {
  id: string; type: MatchType; opponent: string; date: string; arrivalTime: string; matchTime: string; arena: MatchArena; status: MatchStatus;
  notes?: string; responses: PlayerResponse[]; createdAt: string; createdBy?: string;
  discordNotificationPending?: boolean; discordNotifiedAt?: string; pushNotifiedAt?: string;
};
export type MatchInput = Omit<Match, "id" | "createdAt" | "responses" | "createdBy" | "discordNotificationPending" | "discordNotifiedAt" | "pushNotifiedAt">;

type FirestoreValue = { stringValue: string } | { booleanValue: boolean } | { arrayValue: { values?: FirestoreValue[] } } | { mapValue: { fields?: Record<string, FirestoreValue> } };
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

const STORAGE_KEY = "dyno_matches_local_v3";
const LEGACY_STORAGE_KEY = "dyno_matches_local_v2";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/matches`;
const DISCORD_WORKER_URL = "https://dyno-discord-notifier.thibaut-llorens.workers.dev/notify-match";
const listeners = new Set<(matches: Match[]) => void>();
let latestMatches: Match[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let syncInProgress = false;

function sortMatches(matches: Match[]) { return [...matches].sort((a, b) => `${a.date}T${a.matchTime}`.localeCompare(`${b.date}T${b.matchTime}`)); }
async function persist(matches: Match[]) { latestMatches = sortMatches(matches); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latestMatches)); listeners.forEach((listener) => listener(latestMatches)); return latestMatches; }
async function readStoredMatches(): Promise<Match[]> { const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY)); if (!raw) return []; try { return sortMatches(JSON.parse(raw) as Match[]); } catch { return []; } }
async function requireUser() { const session = await getValidSession(); if (!session) throw new Error("Tu dois être connecté pour modifier les matchs."); return session; }
async function requireCreatePermission() { if (!(await canCreateScrim())) throw new Error("Seul un administrateur peut créer un match."); }
async function requireManagePermission() { if (!(await canManageScrims())) throw new Error("Seul un administrateur peut modifier ou supprimer un match."); }
function playerNameFromEmail(email: string) { return email.split("@")[0] || "Joueur DYNO"; }
function stringValue(value: unknown): FirestoreValue { return { stringValue: String(value ?? "") }; }
function responseToFirestore(response: PlayerResponse): FirestoreValue { return { mapValue: { fields: { uid: stringValue(response.uid ?? ""), player: stringValue(response.player), status: stringValue(response.status) } } }; }
function matchToFields(match: Match): Record<string, FirestoreValue> {
  return {
    type: stringValue(match.type), opponent: stringValue(match.opponent), date: stringValue(match.date), arrivalTime: stringValue(match.arrivalTime), matchTime: stringValue(match.matchTime), arena: stringValue(match.arena), status: stringValue(match.status), notes: stringValue(match.notes ?? ""), createdAt: stringValue(match.createdAt), createdBy: stringValue(match.createdBy ?? ""),
    discordNotificationPending: { booleanValue: match.discordNotificationPending === true }, discordNotifiedAt: stringValue(match.discordNotifiedAt ?? ""), pushNotifiedAt: stringValue(match.pushNotifiedAt ?? ""),
    responses: { arrayValue: { values: match.responses.map(responseToFirestore) } },
  };
}
function readString(value?: FirestoreValue) { return value && "stringValue" in value ? value.stringValue : ""; }
function readBoolean(value?: FirestoreValue) { return Boolean(value && "booleanValue" in value && value.booleanValue); }
function documentToMatch(document: FirestoreDocument): Match {
  const fields = document.fields ?? {};
  const responseValues = fields.responses && "arrayValue" in fields.responses ? fields.responses.arrayValue.values ?? [] : [];
  const responses = responseValues.map((value): PlayerResponse => { const responseFields = "mapValue" in value ? value.mapValue.fields ?? {} : {}; const status = readString(responseFields.status); return { uid: readString(responseFields.uid) || undefined, player: readString(responseFields.player) || "Joueur DYNO", status: status === "Disponible" || status === "Indisponible" ? status : "En attente" }; });
  const type = readString(fields.type); const arena = readString(fields.arena); const status = readString(fields.status);
  return { id: document.name.split("/").pop() ?? `${Date.now()}`, type: type === "Division" ? "Division" : "Scrim", opponent: readString(fields.opponent) || "Adversaire", date: readString(fields.date), arrivalTime: readString(fields.arrivalTime) || "19:30", matchTime: readString(fields.matchTime) || "20:00", arena: arena === "Arène 2" ? "Arène 2" : "Arène 1", status: status === "Confirmé" || status === "Annulé" ? status : "En attente", notes: readString(fields.notes), createdAt: readString(fields.createdAt) || new Date().toISOString(), createdBy: readString(fields.createdBy) || undefined, discordNotificationPending: readBoolean(fields.discordNotificationPending), discordNotifiedAt: readString(fields.discordNotifiedAt) || undefined, pushNotifiedAt: readString(fields.pushNotifiedAt) || undefined, responses };
}
async function firestoreRequest(url: string, init: RequestInit = {}) { const session = await requireUser(); return fetch(url, { ...init, headers: { Authorization: `Bearer ${session.idToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) } }); }
async function fetchCloudMatches() { const response = await firestoreRequest(`${FIRESTORE_BASE}?pageSize=100`); if (!response.ok) throw new Error("Synchronisation Firebase impossible."); const data = (await response.json()) as { documents?: FirestoreDocument[] }; return sortMatches((data.documents ?? []).map(documentToMatch)); }
async function uploadMatch(match: Match) { const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(match.id)}`, { method: "PATCH", body: JSON.stringify({ fields: matchToFields(match) }) }); if (!response.ok) throw new Error("Enregistrement Firebase impossible."); }
async function notifyDiscordImmediately(match: Match, idToken: string) {
  const response = await fetch(DISCORD_WORKER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: match.type, opponent: match.opponent, date: match.date, arrivalTime: match.arrivalTime, matchTime: match.matchTime, arena: match.arena, notes: match.notes ?? "" }),
  });
  if (!response.ok) throw new Error(`Notification Discord immédiate impossible (${response.status}).`);
}
async function syncFromCloud() {
  if (syncInProgress) return latestMatches;
  syncInProgress = true;
  try { const cloud = await fetchCloudMatches(); return persist(cloud); }
  catch { const local = await readStoredMatches(); latestMatches = local; return local; }
  finally { syncInProgress = false; }
}

export async function getMatches() { const local = await readStoredMatches(); latestMatches = local; void syncFromCloud(); return local; }
export async function getMatch(matchId: string) { const matches = await fetchCloudMatches().catch(readStoredMatches); return matches.find((match) => match.id === matchId) ?? null; }
export async function createMatch(input: MatchInput) {
  await requireCreatePermission();
  const user = await requireUser();
  const matches = await readStoredMatches();
  let match: Match = { ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), createdBy: user.localId, discordNotificationPending: true, responses: [] };
  await uploadMatch(match);
  await persist([...matches, match]);
  try {
    await notifyDiscordImmediately(match, user.idToken);
    match = { ...match, discordNotificationPending: false, discordNotifiedAt: new Date().toISOString() };
    await uploadMatch(match);
    await persist([...matches, match]);
  } catch {
    // GitHub Actions will retry any match still marked as pending.
  }
  return match;
}
export async function updateMatch(matchId: string, patch: Partial<MatchInput>) { await requireManagePermission(); await requireUser(); const matches = await fetchCloudMatches().catch(readStoredMatches); const current = matches.find((match) => match.id === matchId); if (!current) throw new Error("Ce match n'existe plus."); const changed: Match = { ...current, ...patch, id: current.id, responses: current.responses, createdAt: current.createdAt, createdBy: current.createdBy, discordNotificationPending: current.discordNotificationPending, discordNotifiedAt: current.discordNotifiedAt, pushNotifiedAt: current.pushNotifiedAt }; await uploadMatch(changed); await persist(matches.map((match) => match.id === matchId ? changed : match)); return changed; }
export async function duplicateMatch(matchId: string) { await requireCreatePermission(); const original = await getMatch(matchId); if (!original) throw new Error("Ce match n'existe plus."); return createMatch({ type: original.type, opponent: original.opponent, date: original.date, arrivalTime: original.arrivalTime, matchTime: original.matchTime, arena: original.arena, status: "En attente", notes: original.notes }); }
export async function setMatchAvailability(matchId: string, availability: Exclude<Availability, "En attente">) {
  const user = await requireUser();
  const linkedPlayer = await getRosterPlayerForAccount(user.localId, user.email).catch(() => null);
  const player = linkedPlayer?.nickname ?? playerNameFromEmail(user.email);
  const matches = await fetchCloudMatches().catch(readStoredMatches);
  let changed: Match | undefined;
  const updated = matches.map((match) => {
    if (match.id !== matchId) return match;
    const responses = [...match.responses];
    const existingIndex = responses.findIndex((response) => response.uid === user.localId || (!response.uid && response.player.trim().toLowerCase() === player.trim().toLowerCase()));
    const response: PlayerResponse = { uid: user.localId, player, status: availability };
    if (existingIndex >= 0) responses[existingIndex] = response; else responses.push(response);
    changed = { ...match, responses }; return changed;
  });
  if (!changed) throw new Error("Ce match n'existe plus.");
  await uploadMatch(changed); await persist(updated);
}
export async function deleteMatch(matchId: string) { await requireManagePermission(); await requireUser(); const matches = await fetchCloudMatches().catch(readStoredMatches); const response = await firestoreRequest(`${FIRESTORE_BASE}/${encodeURIComponent(matchId)}`, { method: "DELETE" }); if (!response.ok && response.status !== 404) throw new Error("Suppression Firebase impossible."); await persist(matches.filter((match) => match.id !== matchId)); }
export function subscribeToMatches(listener: (matches: Match[]) => void) { listeners.add(listener); if (latestMatches.length) listener(latestMatches); void syncFromCloud(); if (!pollTimer) pollTimer = setInterval(() => void syncFromCloud(), 5000); return () => { listeners.delete(listener); if (!listeners.size && pollTimer) { clearInterval(pollTimer); pollTimer = null; } }; }
export function toMatchDate(match: Pick<Match, "date" | "matchTime">) { const value = new Date(`${match.date}T${match.matchTime}:00`); return Number.isNaN(value.getTime()) ? null : value; }
