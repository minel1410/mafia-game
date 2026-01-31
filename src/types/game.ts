export type Role =
  | 'citizen'
  | 'mafia'
  | 'godfather'
  | 'detective'
  | 'doctor'
  | 'escort'
  | 'jester'
  | 'witch'
  | 'mayor';

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting' | 'ended';

export interface Player {
  id: string;
  username: string;
  role?: Role;
  isAlive: boolean;
  isMuted: boolean;
  isHost: boolean;
  isProtectedByWitch?: boolean;
  isPoisoned?: boolean;
  mayorPowerUsed?: boolean;
}

export interface RoleConfig {
  mafia: number;
  godfather: number;
  detective: number;
  doctor: number;
  escort: number;
  jester: number;
  witch: number;
  mayor: number;
}

export interface NightActions {
  mafiaVotes: Record<string, string>;
  mafiaTarget?: string;
  doctorTarget?: string;
  doctorLastTarget?: string;
  detectiveTarget?: string;
  detectiveResult?: boolean;
  escortTarget?: string;
  witchAction?: 'protect' | 'poison' | 'none';
  witchTarget?: string;
  actionsCompleted: {
    mafia: boolean;
    doctor: boolean;
    detective: boolean;
    escort: boolean;
    witch: boolean;
  };
}

export interface VotingState {
  votes: Record<string, string>;
  isActive: boolean;
  mayorOverride?: { playerId: string; newTarget: string };
}

export interface GameSession {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  roleConfig: RoleConfig;
  nightActions: NightActions;
  voting: VotingState;
  round: number;
  lastKilled?: string;
  lastKilledBy?: 'mafia' | 'witch';
  winner?: 'town' | 'mafia' | 'jester';
  escortBecameMafia: boolean;
}

// Socket events
export interface ServerToClientEvents {
  sessionUpdate: (session: GameSession) => void;
  roleReveal: (role: Role, extras?: RoleExtras) => void;
  nightResult: (result: NightResult) => void;
  detectiveResult: (isMafia: boolean, targetUsername: string) => void;
  mafiaVoteUpdate: (votes: Record<string, string>, playerNames: Record<string, string>) => void;
  gameEnd: (winner: 'town' | 'mafia' | 'jester', roles: Record<string, Role>) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createSession: (username: string, callback: (response: { success: boolean; session?: GameSession; playerId?: string; error?: string }) => void) => void;
  joinSession: (code: string, username: string, callback: (response: { success: boolean; session?: GameSession; playerId?: string; error?: string }) => void) => void;
  updateRoleConfig: (config: RoleConfig) => void;
  startGame: () => void;
  mafiaVote: (targetId: string) => void;
  doctorHeal: (targetId: string) => void;
  detectiveInvestigate: (targetId: string) => void;
  escortMute: (targetId: string) => void;
  witchAction: (action: 'protect' | 'poison' | 'none', targetId?: string) => void;
  skipNightAction: () => void;
  startVoting: () => void;
  vote: (targetId: string) => void;
  mayorOverride: (playerId: string, newTarget: string) => void;
  endVoting: () => void;
  startNextRound: () => void;
  restartGame: () => void;
}

export interface RoleExtras {
  otherMafia?: { id: string; username: string }[];
  allPlayers?: { id: string; username: string; isAlive: boolean; role?: Role }[];
}

export interface NightResult {
  killed?: string;
  killedBy?: 'mafia' | 'witch';
  saved: boolean;
  savedBy?: 'doctor' | 'witch';
  mutedPlayer?: string;
  poisonedPlayer?: string;
}

export interface RoleInfo {
  id: Role;
  name: string;
  team: 'town' | 'mafia' | 'neutral';
  description: string;
  ability: string;
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  citizen: {
    id: 'citizen',
    name: 'Mještanin',
    team: 'town',
    description: 'Običan stanovnik grada bez posebnih sposobnosti.',
    ability: 'Nema noćnu akciju. Koristi logiku i intuiciju tokom dana.',
  },
  mafia: {
    id: 'mafia',
    name: 'Mafija',
    team: 'mafia',
    description: 'Član kriminalne organizacije koja želi preuzeti grad.',
    ability: 'Svake noći zajedno s ostalim članovima bira žrtvu.',
  },
  godfather: {
    id: 'godfather',
    name: 'Kum',
    team: 'mafia',
    description: 'Vođa mafije. Iskusni kriminalac koji zna kako sakriti tragove.',
    ability: 'Djeluje kao mafija, ali detektiv ga vidi kao nevinog.',
  },
  detective: {
    id: 'detective',
    name: 'Detektiv',
    team: 'town',
    description: 'Istraživač koji radi na razotkrivanju kriminalaca.',
    ability: 'Svake noći ispituje jednog igrača i saznaje je li u mafiji.',
  },
  doctor: {
    id: 'doctor',
    name: 'Doktor',
    team: 'town',
    description: 'Medicinski stručnjak koji može spasiti živote.',
    ability: 'Svake noći štiti jednog igrača od napada. Ne može istog dvaput zaredom.',
  },
  escort: {
    id: 'escort',
    name: 'Dama',
    team: 'town',
    description: 'Koristi šarm da odvrati pažnju i onemogući druge.',
    ability: 'Ućutkuje igrača - ne smije govoriti tokom dana. Ako mafija bude eliminirana, prelazi na njihovu stranu.',
  },
  jester: {
    id: 'jester',
    name: 'Joker',
    team: 'neutral',
    description: 'Nestabilna osoba koja želi biti primijećena po svaku cijenu.',
    ability: 'Pobjeđuje ako ga grad eliminira glasanjem.',
  },
  witch: {
    id: 'witch',
    name: 'Vještica',
    team: 'town',
    description: 'Mistična osoba s moći zaštite i prokletstva.',
    ability: 'Može zaštititi sve od napada, otrovati nekoga, ili ne uraditi ništa.',
  },
  mayor: {
    id: 'mayor',
    name: 'Gradonačelnik',
    team: 'town',
    description: 'Izabrani vođa grada s velikim uticajem.',
    ability: 'Jednom u igri može promijeniti nečiji glas tokom glasanja.',
  },
};
