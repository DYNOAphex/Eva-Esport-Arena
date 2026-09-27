import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "../firebase/config";
import { getValidSession } from "./authService";
import { getRosterPlayerForAccount } from "./rosterStore";

export type DayAvailabilityStatus = "Disponible" | "Partiel" | "Indisponible";
export type DayAvailability = { uid: string; player: string; date: string; status: DayAvailabilityStatus; from?: string; to?: string; updatedAt: string };

type FirestoreValue = { stringValue: string };
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

const STORAGE_KEY = "dyno_player_availability_v1";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/playerAvailability`;
const listeners = new Set<(items: DayAvailability[]) => void>();
let latest: DayAvailability[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;

function key(uid: string, date: string) { return `${uid}_${date}`.replace(/[^a-zA-Z0-9_-]/g, "_"); }
function stringValue(value: unknown): FirestoreValue { return { stringValue: String(value ?? "") }; }
function readString(value?: FirestoreValue) { return value?.stringValue ?? ""; }
function playerNameFromEmail(email: string) { return email.split("@")[0] || "Joueur DYNO"; }
async function requireUser() { const session = await getValidSession(); if (!session) throw new Error("Tu dois être connecté pour renseigner tes disponibilités."); return session; }
async function persist(items: DayAvailability[]) { latest = items; await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)); listeners.forEach((listener) => listener(items)); return items; }
async function readLocal(): Promise<DayAvailability[]> { const raw = await AsyncStorage.getItem(STORAGE_KEY); if (!raw) return []; try { return JSON.parse(raw) as DayAvailability[]; } catch { return []; } }
async function request(url: string, init: RequestInit = {}) { const session = await requireUser(); return fetch(url, { ...init, headers: { Authorization: `Bearer ${session.idToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) } }); }
function fromDocument(document: FirestoreDocument): DayAvailability | null { const f = document.fields ?? {}; const status = readString(f.status); if (status !== "Disponible" && status !== "Partiel" && status !== "Indisponible") return null; return { uid: readString(f.uid), player: readString(f.player) || "Joueur DYNO", date: readString(f.date), status, from: readString(f.from) || undefined, to: readString(f.to) || undefined, updatedAt: readString(f.updatedAt) }; }
async function fetchCloud() { const response = await request(`${FIRESTORE_BASE}?pageSize=500`); if (!response.ok) throw new Error("Synchronisation des disponibilités impossible."); const data = await response.json() as { documents?: FirestoreDocument[] }; return (data.documents ?? []).map(fromDocument).filter((item): item is DayAvailability => Boolean(item?.uid && item.date)); }
async function sync() { try { return await persist(await fetchCloud()); } catch { const local = await readLocal(); latest = local; return local; } }

export async function getPlayerAvailabilities() { const local = await readLocal(); latest = local; void sync(); return local; }
export async function setMyDayAvailability(date: string, status: DayAvailabilityStatus, from?: string, to?: string) {
  const session = await requireUser();
  const linked = await getRosterPlayerForAccount(session.localId, session.email).catch(() => null);
  const item: DayAvailability = { uid: session.localId, player: linked?.nickname ?? playerNameFromEmail(session.email), date, status, from: status === "Partiel" ? from : undefined, to: status === "Partiel" ? to : undefined, updatedAt: new Date().toISOString() };
  const response = await request(`${FIRESTORE_BASE}/${encodeURIComponent(key(item.uid, date))}`, { method: "PATCH", body: JSON.stringify({ fields: { uid: stringValue(item.uid), player: stringValue(item.player), date: stringValue(item.date), status: stringValue(item.status), from: stringValue(item.from ?? ""), to: stringValue(item.to ?? ""), updatedAt: stringValue(item.updatedAt) } }) });
  if (!response.ok) throw new Error("La disponibilité n’a pas pu être enregistrée.");
  const current = latest.length ? latest : await readLocal();
  await persist([...current.filter((entry) => !(entry.uid === item.uid && entry.date === date)), item]);
  return item;
}
export function subscribeToPlayerAvailabilities(listener: (items: DayAvailability[]) => void) { listeners.add(listener); if (latest.length) listener(latest); void sync(); if (!pollTimer) pollTimer = setInterval(() => void sync(), 8000); return () => { listeners.delete(listener); if (!listeners.size && pollTimer) { clearInterval(pollTimer); pollTimer = null; } }; }
