import AsyncStorage from "@react-native-async-storage/async-storage";

export type MatchType = "Scrim" | "Division";
export type MatchArena = "Arène 1" | "Arène 2";
export type MatchStatus = "En attente" | "Confirmé" | "Annulé";
export type Availability = "Disponible" | "Indisponible" | "En attente";

export type PlayerResponse = {
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
};

const STORAGE_KEY = "dyno_matches_v2";
const LEGACY_STORAGE_KEY = "dyno_matches_v1";
const CURRENT_PLAYER = "DYNOxAphex";
const roster = ["DYNOxAphex", "KroxX", "Neazy", "Zerox", "Venom", "Lyzen", "Skyzz"];
const listeners = new Set<(matches: Match[]) => void>();

const defaultResponses = (): PlayerResponse[] => roster.map((player) => ({ player, status: "En attente" }));

const seedMatches: Match[] = [
  {
    id: "seed-phoenix",
    type: "Scrim",
    opponent: "Team Phoenix",
    date: "2026-07-17",
    arrivalTime: "19:30",
    matchTime: "20:00",
    arena: "Arène 2",
    status: "Confirmé",
    notes: "",
    responses: [
      { player: "DYNOxAphex", status: "Disponible" },
      { player: "KroxX", status: "Disponible" },
      { player: "Neazy", status: "Disponible" },
      { player: "Zerox", status: "Indisponible" },
      { player: "Venom", status: "En attente" },
      { player: "Lyzen", status: "Disponible" },
      { player: "Skyzz", status: "En attente" },
    ],
    createdAt: new Date(2026, 6, 14).toISOString(),
  },
];

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => `${a.date}T${a.matchTime}`.localeCompare(`${b.date}T${b.matchTime}`));
}

function normalizeMatch(match: any): Match {
  const matchTime = match.matchTime ?? match.time ?? "20:00";
  const arrivalTime = match.arrivalTime ?? previousHalfHour(matchTime);
  const responses = Array.isArray(match.responses)
    ? match.responses
    : defaultResponses().map((response) =>
        response.player === CURRENT_PLAYER && match.availability
          ? { ...response, status: match.availability === "Disponible" ? "Disponible" : "Indisponible" }
          : response,
      );

  return {
    id: String(match.id),
    type: match.type === "Division" ? "Division" : "Scrim",
    opponent: String(match.opponent ?? "Adversaire"),
    date: String(match.date),
    arrivalTime,
    matchTime,
    arena: match.arena === "Arène 2" ? "Arène 2" : "Arène 1",
    status: ["Confirmé", "Annulé"].includes(match.status) ? match.status : "En attente",
    notes: match.notes ?? "",
    responses,
    createdAt: match.createdAt ?? new Date().toISOString(),
  };
}

function previousHalfHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours || 0, minutes || 0);
  date.setMinutes(date.getMinutes() - 30);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

async function persist(matches: Match[]) {
  const sorted = sortMatches(matches.map(normalizeMatch));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  listeners.forEach((listener) => listener(sorted));
  return sorted;
}

export async function getMatches(): Promise<Match[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return sortMatches((JSON.parse(stored) as Match[]).map(normalizeMatch));
    } catch {
      return persist(seedMatches);
    }
  }

  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      return persist((JSON.parse(legacy) as unknown[]).map(normalizeMatch));
    } catch {
      return persist(seedMatches);
    }
  }

  return persist(seedMatches);
}

export async function createMatch(input: Omit<Match, "id" | "createdAt" | "responses">) {
  const matches = await getMatches();
  const match: Match = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    responses: defaultResponses(),
    createdAt: new Date().toISOString(),
  };

  await persist([...matches, match]);
  return match;
}

export async function setMatchAvailability(matchId: string, availability: Exclude<Availability, "En attente">) {
  const matches = await getMatches();
  return persist(
    matches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            responses: match.responses.map((response) =>
              response.player === CURRENT_PLAYER ? { ...response, status: availability } : response,
            ),
          }
        : match,
    ),
  );
}

export async function deleteMatch(matchId: string) {
  const matches = await getMatches();
  return persist(matches.filter((match) => match.id !== matchId));
}

export function subscribeToMatches(listener: (matches: Match[]) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toMatchDate(match: Pick<Match, "date" | "matchTime">) {
  const value = new Date(`${match.date}T${match.matchTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}
