import AsyncStorage from "@react-native-async-storage/async-storage";

export type MatchType = "Scrim" | "Division";
export type MatchArena = "Arène 1" | "Arène 2";
export type MatchStatus = "En attente" | "Confirmé" | "Annulé";
export type Availability = "Disponible" | "Indisponible" | null;

export type Match = {
  id: string;
  type: MatchType;
  opponent: string;
  date: string;
  time: string;
  arena: MatchArena;
  status: MatchStatus;
  notes?: string;
  availability: Availability;
  createdAt: string;
};

const STORAGE_KEY = "dyno_matches_v1";
const listeners = new Set<(matches: Match[]) => void>();

const seedMatches: Match[] = [
  {
    id: "seed-phoenix",
    type: "Scrim",
    opponent: "Team Phoenix",
    date: "2026-07-17",
    time: "20:00",
    arena: "Arène 2",
    status: "Confirmé",
    notes: "",
    availability: null,
    createdAt: new Date(2026, 6, 14).toISOString(),
  },
  {
    id: "seed-nova",
    type: "Division",
    opponent: "Team Nova",
    date: "2026-07-20",
    time: "21:30",
    arena: "Arène 1",
    status: "En attente",
    notes: "",
    availability: null,
    createdAt: new Date(2026, 6, 14).toISOString(),
  },
];

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

async function persist(matches: Match[]) {
  const sorted = sortMatches(matches);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  listeners.forEach((listener) => listener(sorted));
  return sorted;
}

export async function getMatches(): Promise<Match[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return persist(seedMatches);
  }

  try {
    return sortMatches(JSON.parse(stored) as Match[]);
  } catch {
    return persist(seedMatches);
  }
}

export async function createMatch(input: Omit<Match, "id" | "createdAt" | "availability">) {
  const matches = await getMatches();
  const match: Match = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    availability: null,
    createdAt: new Date().toISOString(),
  };

  await persist([...matches, match]);
  return match;
}

export async function setMatchAvailability(matchId: string, availability: Availability) {
  const matches = await getMatches();
  return persist(matches.map((match) => (match.id === matchId ? { ...match, availability } : match)));
}

export async function deleteMatch(matchId: string) {
  const matches = await getMatches();
  return persist(matches.filter((match) => match.id !== matchId));
}

export function subscribeToMatches(listener: (matches: Match[]) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toMatchDate(match: Pick<Match, "date" | "time">) {
  const value = new Date(`${match.date}T${match.time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}
