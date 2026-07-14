import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { getStoredSession } from "./authService";

export type MatchType = "Scrim" | "Division";
export type MatchArena = "Arène 1" | "Arène 2";
export type MatchStatus = "En attente" | "Confirmé" | "Annulé";
export type Availability = "Disponible" | "Indisponible" | "En attente";

export type PlayerResponse = {
  uid?: string;
  player: string;
  status: Availability;
};

export type Match = {
  id: string;
  type: MatchType;
  opponent: string;
  date: string;
  arrivalTime: string;
  matchTime: string;
  arena: MatchArena;
  status: MatchStatus;
  notes?: string;
  responses: PlayerResponse[];
  createdAt: string;
  createdBy?: string;
};

const CACHE_KEY = "dyno_matches_firestore_cache_v1";
const matchesCollection = collection(db, "matches");
const listeners = new Set<(matches: Match[]) => void>();
let latestMatches: Match[] = [];
let unsubscribeSnapshot: (() => void) | null = null;

async function requireUser() {
  const session = await getStoredSession();
  if (!session) throw new Error("Tu dois être connecté pour modifier les matchs.");
  return session;
}

function playerNameFromEmail(email: string) {
  return email.split("@")[0] || "Joueur DYNO";
}

function normalizeMatch(id: string, data: any): Match {
  return {
    id,
    type: data.type === "Division" ? "Division" : "Scrim",
    opponent: String(data.opponent ?? "Adversaire"),
    date: String(data.date ?? ""),
    arrivalTime: String(data.arrivalTime ?? "19:30"),
    matchTime: String(data.matchTime ?? data.time ?? "20:00"),
    arena: data.arena === "Arène 2" ? "Arène 2" : "Arène 1",
    status: data.status === "Confirmé" || data.status === "Annulé" ? data.status : "En attente",
    notes: String(data.notes ?? ""),
    responses: Array.isArray(data.responses) ? data.responses : [],
    createdAt: data.createdAt?.toDate?.().toISOString?.() ?? String(data.createdAt ?? new Date().toISOString()),
    createdBy: data.createdBy,
  };
}

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => `${a.date}T${a.matchTime}`.localeCompare(`${b.date}T${b.matchTime}`));
}

async function cacheAndEmit(matches: Match[]) {
  latestMatches = sortMatches(matches);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(latestMatches));
  listeners.forEach((listener) => listener(latestMatches));
  return latestMatches;
}

async function readCache() {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (!cached) return [];
  try {
    return sortMatches(JSON.parse(cached) as Match[]);
  } catch {
    return [];
  }
}

export async function getMatches(): Promise<Match[]> {
  try {
    const snapshot = await getDocs(query(matchesCollection, orderBy("date", "asc")));
    return cacheAndEmit(snapshot.docs.map((item) => normalizeMatch(item.id, item.data())));
  } catch {
    const cached = await readCache();
    latestMatches = cached;
    return cached;
  }
}

export async function createMatch(input: Omit<Match, "id" | "createdAt" | "responses" | "createdBy">) {
  const user = await requireUser();
  const payload = {
    ...input,
    responses: [] as PlayerResponse[],
    createdBy: user.localId,
    createdAt: serverTimestamp(),
  };
  const reference = await addDoc(matchesCollection, payload);
  return normalizeMatch(reference.id, { ...payload, createdAt: new Date().toISOString() });
}

export async function setMatchAvailability(matchId: string, availability: Exclude<Availability, "En attente">) {
  const user = await requireUser();
  const reference = doc(db, "matches", matchId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("Ce match n'existe plus.");

    const responses = Array.isArray(snapshot.data().responses) ? [...snapshot.data().responses] as PlayerResponse[] : [];
    const player = playerNameFromEmail(user.email);
    const existingIndex = responses.findIndex((response) => response.uid === user.localId);
    const response: PlayerResponse = { uid: user.localId, player, status: availability };

    if (existingIndex >= 0) responses[existingIndex] = response;
    else responses.push(response);

    transaction.update(reference, { responses });
  });
}

export async function deleteMatch(matchId: string) {
  await requireUser();
  await deleteDoc(doc(db, "matches", matchId));
}

export function subscribeToMatches(listener: (matches: Match[]) => void) {
  listeners.add(listener);
  if (latestMatches.length) listener(latestMatches);

  if (!unsubscribeSnapshot) {
    unsubscribeSnapshot = onSnapshot(
      query(matchesCollection, orderBy("date", "asc")),
      (snapshot) => {
        void cacheAndEmit(snapshot.docs.map((item) => normalizeMatch(item.id, item.data())));
      },
      () => {
        void readCache().then((cached) => {
          latestMatches = cached;
          listeners.forEach((currentListener) => currentListener(cached));
        });
      },
    );
  }

  return () => {
    listeners.delete(listener);
    if (!listeners.size && unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  };
}

export function toMatchDate(match: Pick<Match, "date" | "matchTime">) {
  const value = new Date(`${match.date}T${match.matchTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}
