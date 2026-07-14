import AsyncStorage from "@react-native-async-storage/async-storage";

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

const STORAGE_KEY = "dyno_matches_local_v2";
const listeners = new Set<(matches: Match[]) => void>();
let latestMatches: Match[] = [];

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => `${a.date}T${a.matchTime}`.localeCompare(`${b.date}T${b.matchTime}`));
}

async function persist(matches: Match[]) {
  latestMatches = sortMatches(matches);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latestMatches));
  listeners.forEach((listener) => listener(latestMatches));
  return latestMatches;
}

async function readStoredMatches(): Promise<Match[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return sortMatches(JSON.parse(raw) as Match[]);
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

async function requireUser() {
  const session = await getStoredSession();
  if (!session) throw new Error("Tu dois être connecté pour modifier les matchs.");
  return session;
}

function playerNameFromEmail(email: string) {
  return email.split("@")[0] || "Joueur DYNO";
}

export async function getMatches(): Promise<Match[]> {
  const matches = await readStoredMatches();
  latestMatches = matches;
  return matches;
}

export async function createMatch(input: Omit<Match, "id" | "createdAt" | "responses" | "createdBy">) {
  const user = await requireUser();
  const matches = await readStoredMatches();
  const match: Match = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    createdBy: user.localId,
    responses: [],
  };

  await persist([...matches, match]);
  return match;
}

export async function setMatchAvailability(matchId: string, availability: Exclude<Availability, "En attente">) {
  const user = await requireUser();
  const matches = await readStoredMatches();
  const player = playerNameFromEmail(user.email);

  const updated = matches.map((match) => {
    if (match.id !== matchId) return match;

    const responses = [...match.responses];
    const existingIndex = responses.findIndex((response) => response.uid === user.localId);
    const response: PlayerResponse = { uid: user.localId, player, status: availability };

    if (existingIndex >= 0) responses[existingIndex] = response;
    else responses.push(response);

    return { ...match, responses };
  });

  await persist(updated);
}

export async function deleteMatch(matchId: string) {
  await requireUser();
  const matches = await readStoredMatches();
  await persist(matches.filter((match) => match.id !== matchId));
}

export function subscribeToMatches(listener: (matches: Match[]) => void) {
  listeners.add(listener);
  if (latestMatches.length) listener(latestMatches);

  return () => {
    listeners.delete(listener);
  };
}

export function toMatchDate(match: Pick<Match, "date" | "matchTime">) {
  const value = new Date(`${match.date}T${match.matchTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}
