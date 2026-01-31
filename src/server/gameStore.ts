import { GameSession, Player, Role, RoleConfig, NightActions } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

const sessions: Map<string, GameSession> = new Map();
const playerToSession: Map<string, string> = new Map();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const defaultActionsCompleted = {
  mafia: false,
  doctor: false,
  detective: false,
  escort: false,
  witch: false,
};

export function createSession(hostUsername: string): { session: GameSession; playerId: string } {
  const sessionId = uuidv4();
  const playerId = uuidv4();
  const code = generateCode();

  const host: Player = {
    id: playerId,
    username: hostUsername,
    isAlive: true,
    isMuted: false,
    isHost: true,
  };

  const session: GameSession = {
    id: sessionId,
    code,
    hostId: playerId,
    players: [host],
    phase: 'lobby',
    roleConfig: {
      mafia: 1,
      godfather: 0,
      detective: 1,
      doctor: 1,
      escort: 0,
      jester: 0,
      witch: 0,
      mayor: 0,
    },
    nightActions: {
      mafiaVotes: {},
      actionsCompleted: { ...defaultActionsCompleted },
    },
    voting: {
      votes: {},
      isActive: false,
    },
    round: 0,
    escortBecameMafia: false,
  };

  sessions.set(sessionId, session);
  playerToSession.set(playerId, sessionId);

  return { session, playerId };
}

export function joinSession(code: string, username: string): { session: GameSession; playerId: string } | null {
  const session = Array.from(sessions.values()).find(s => s.code === code);

  if (!session || session.phase !== 'lobby') {
    return null;
  }

  if (session.players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }

  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    username,
    isAlive: true,
    isMuted: false,
    isHost: false,
  };

  session.players.push(player);
  playerToSession.set(playerId, session.id);

  return { session, playerId };
}

export function getSession(sessionId: string): GameSession | undefined {
  return sessions.get(sessionId);
}

export function getSessionByPlayerId(playerId: string): GameSession | undefined {
  const sessionId = playerToSession.get(playerId);
  if (!sessionId) return undefined;
  return sessions.get(sessionId);
}

export function getSessionByCode(code: string): GameSession | undefined {
  return Array.from(sessions.values()).find(s => s.code === code);
}

export function updateRoleConfig(sessionId: string, config: RoleConfig): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'lobby') return undefined;

  session.roleConfig = config;
  return session;
}

export function assignRoles(session: GameSession): void {
  const { roleConfig, players } = session;

  const roles: Role[] = [];

  for (let i = 0; i < roleConfig.mafia; i++) roles.push('mafia');
  for (let i = 0; i < roleConfig.godfather; i++) roles.push('godfather');
  for (let i = 0; i < roleConfig.detective; i++) roles.push('detective');
  for (let i = 0; i < roleConfig.doctor; i++) roles.push('doctor');
  for (let i = 0; i < roleConfig.escort; i++) roles.push('escort');
  for (let i = 0; i < roleConfig.jester; i++) roles.push('jester');
  for (let i = 0; i < roleConfig.witch; i++) roles.push('witch');
  for (let i = 0; i < roleConfig.mayor; i++) roles.push('mayor');

  while (roles.length < players.length) {
    roles.push('citizen');
  }

  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  players.forEach((player, index) => {
    player.role = roles[index];
  });
}

export function startGame(sessionId: string): GameSession | null {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'lobby') return null;

  const totalSpecialRoles =
    session.roleConfig.mafia +
    session.roleConfig.godfather +
    session.roleConfig.detective +
    session.roleConfig.doctor +
    session.roleConfig.escort +
    session.roleConfig.jester +
    session.roleConfig.witch +
    session.roleConfig.mayor;

  if (totalSpecialRoles > session.players.length) return null;
  if (session.roleConfig.mafia + session.roleConfig.godfather < 1) return null;

  assignRoles(session);
  session.phase = 'night';
  session.round = 1;
  session.nightActions = {
    mafiaVotes: {},
    actionsCompleted: { ...defaultActionsCompleted },
  };

  return session;
}

function isMafiaRole(role: Role | undefined, session: GameSession): boolean {
  if (!role) return false;
  return role === 'mafia' || role === 'godfather' || (role === 'escort' && session.escortBecameMafia);
}

export function submitMafiaVote(sessionId: string, mafiaId: string, targetId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const mafia = session.players.find(p => p.id === mafiaId);
  if (!mafia || !isMafiaRole(mafia.role, session) || !mafia.isAlive) return undefined;

  session.nightActions.mafiaVotes[mafiaId] = targetId;
  session.nightActions.actionsCompleted.mafia = true;
  return session;
}

export function submitDoctorHeal(sessionId: string, doctorId: string, targetId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const doctor = session.players.find(p => p.id === doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.isAlive) return undefined;

  if (session.nightActions.doctorLastTarget === targetId) return undefined;

  session.nightActions.doctorTarget = targetId;
  session.nightActions.actionsCompleted.doctor = true;
  return session;
}

export function submitDetectiveInvestigation(sessionId: string, detectiveId: string, targetId: string): { session: GameSession; isMafia: boolean } | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const detective = session.players.find(p => p.id === detectiveId);
  if (!detective || detective.role !== 'detective' || !detective.isAlive) return undefined;

  const target = session.players.find(p => p.id === targetId);
  if (!target) return undefined;

  session.nightActions.detectiveTarget = targetId;

  // Godfather appears innocent
  const isMafia = target.role === 'mafia' || (target.role === 'escort' && session.escortBecameMafia);
  session.nightActions.detectiveResult = isMafia;
  session.nightActions.actionsCompleted.detective = true;

  return { session, isMafia };
}

export function submitEscortMute(sessionId: string, escortId: string, targetId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const escort = session.players.find(p => p.id === escortId);
  if (!escort || escort.role !== 'escort' || !escort.isAlive) return undefined;

  if (session.escortBecameMafia) return undefined;

  session.nightActions.escortTarget = targetId;
  session.nightActions.actionsCompleted.escort = true;
  return session;
}

export function submitWitchAction(sessionId: string, witchId: string, action: 'protect' | 'poison' | 'none', targetId?: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const witch = session.players.find(p => p.id === witchId);
  if (!witch || witch.role !== 'witch' || !witch.isAlive) return undefined;

  session.nightActions.witchAction = action;
  session.nightActions.witchTarget = targetId;
  session.nightActions.actionsCompleted.witch = true;
  return session;
}

export function skipNightAction(sessionId: string, playerId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const player = session.players.find(p => p.id === playerId);
  if (!player || !player.isAlive) return undefined;

  const role = player.role;
  if (role === 'doctor') session.nightActions.actionsCompleted.doctor = true;
  if (role === 'detective') session.nightActions.actionsCompleted.detective = true;
  if (role === 'escort' && !session.escortBecameMafia) session.nightActions.actionsCompleted.escort = true;
  if (role === 'witch') session.nightActions.actionsCompleted.witch = true;

  return session;
}

export function canEndNight(session: GameSession): { canEnd: boolean; missingActions: string[] } {
  const missingActions: string[] = [];
  const { players, nightActions, roleConfig, escortBecameMafia } = session;

  // Check mafia
  const aliveMafia = players.filter(p => isMafiaRole(p.role, session) && p.isAlive);
  if (aliveMafia.length > 0 && !nightActions.actionsCompleted.mafia) {
    missingActions.push('Mafija');
  }

  // Check other roles
  const aliveDoctor = players.find(p => p.role === 'doctor' && p.isAlive);
  if (aliveDoctor && !nightActions.actionsCompleted.doctor) {
    missingActions.push('Doktor');
  }

  const aliveDetective = players.find(p => p.role === 'detective' && p.isAlive);
  if (aliveDetective && !nightActions.actionsCompleted.detective) {
    missingActions.push('Detektiv');
  }

  const aliveEscort = players.find(p => p.role === 'escort' && p.isAlive && !escortBecameMafia);
  if (aliveEscort && !nightActions.actionsCompleted.escort) {
    missingActions.push('Zavodnica');
  }

  return { canEnd: missingActions.length === 0, missingActions };
}

export function resolveNight(sessionId: string): {
  session: GameSession;
  killed?: Player;
  killedBy?: 'mafia' | 'witch';
  saved: boolean;
  savedBy?: 'doctor' | 'witch';
  mutedPlayer?: Player;
  poisonedPlayer?: Player;
} | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'night') return undefined;

  const { nightActions, players } = session;

  // Resolve mafia votes
  const voteCount: Record<string, number> = {};
  Object.values(nightActions.mafiaVotes).forEach(targetId => {
    voteCount[targetId] = (voteCount[targetId] || 0) + 1;
  });

  let mafiaTarget: string | undefined;
  let maxVotes = 0;
  Object.entries(voteCount).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      mafiaTarget = targetId;
    }
  });

  nightActions.mafiaTarget = mafiaTarget;

  // Check protections
  let killed: Player | undefined;
  let killedBy: 'mafia' | 'witch' | undefined;
  let saved = false;
  let savedBy: 'doctor' | 'witch' | undefined;
  let poisonedPlayer: Player | undefined;

  // Witch protection (protects all)
  const witchProtectsAll = nightActions.witchAction === 'protect';

  // Process mafia kill
  if (mafiaTarget) {
    const target = players.find(p => p.id === mafiaTarget);
    if (target && target.isAlive) {
      // Check if protected
      if (witchProtectsAll) {
        saved = true;
        savedBy = 'witch';
      } else if (nightActions.doctorTarget === mafiaTarget) {
        saved = true;
        savedBy = 'doctor';
      } else {
        target.isAlive = false;
        killed = target;
        killedBy = 'mafia';
        session.lastKilled = target.username;
        session.lastKilledBy = 'mafia';
      }
    }
  }

  // Process witch poison
  if (nightActions.witchAction === 'poison' && nightActions.witchTarget) {
    const poisonTarget = players.find(p => p.id === nightActions.witchTarget);
    if (poisonTarget && poisonTarget.isAlive) {
      poisonTarget.isPoisoned = true;
      poisonedPlayer = poisonTarget;
    }
  }

  // Kill poisoned players from previous round
  players.forEach(p => {
    if (p.isPoisoned && p.isAlive && !killed) {
      p.isAlive = false;
      killed = p;
      killedBy = 'witch';
      session.lastKilled = p.username;
      session.lastKilledBy = 'witch';
    }
    p.isPoisoned = false;
  });

  // Apply mute
  let mutedPlayer: Player | undefined;
  if (nightActions.escortTarget) {
    const target = players.find(p => p.id === nightActions.escortTarget);
    if (target && target.isAlive) {
      target.isMuted = true;
      mutedPlayer = target;
    }
  }

  // Save doctor's last target
  if (nightActions.doctorTarget) {
    nightActions.doctorLastTarget = nightActions.doctorTarget;
  }

  session.phase = 'day';
  checkWinConditions(session);

  return { session, killed, killedBy, saved, savedBy, mutedPlayer, poisonedPlayer };
}

export function startVoting(sessionId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'day') return undefined;

  session.voting = {
    votes: {},
    isActive: true,
  };
  session.phase = 'voting';

  return session;
}

export function submitVote(sessionId: string, voterId: string, targetId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'voting' || !session.voting.isActive) return undefined;

  const voter = session.players.find(p => p.id === voterId);
  if (!voter || !voter.isAlive) return undefined;

  const target = session.players.find(p => p.id === targetId);
  if (!target || !target.isAlive) return undefined;

  session.voting.votes[voterId] = targetId;
  return session;
}

export function resolveVoting(sessionId: string): { session: GameSession; eliminated?: Player; tied: boolean } | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase !== 'voting') return undefined;

  const { voting, players } = session;

  // Count votes (mayor counts as 2)
  const voteCount: Record<string, number> = {};
  Object.entries(voting.votes).forEach(([voterId, targetId]) => {
    const voter = players.find(p => p.id === voterId);
    const voteValue = voter?.role === 'mayor' ? 2 : 1;
    voteCount[targetId] = (voteCount[targetId] || 0) + voteValue;
  });

  let maxVotes = 0;
  let topTargets: string[] = [];
  Object.entries(voteCount).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topTargets = [targetId];
    } else if (count === maxVotes) {
      topTargets.push(targetId);
    }
  });

  let eliminated: Player | undefined;
  const tied = topTargets.length > 1 || maxVotes === 0;

  if (!tied && topTargets.length === 1) {
    const target = players.find(p => p.id === topTargets[0]);
    if (target) {
      target.isAlive = false;
      eliminated = target;

      if (target.role === 'jester') {
        session.winner = 'jester';
        session.phase = 'ended';
        return { session, eliminated, tied };
      }

      if (isMafiaRole(target.role, session)) {
        const remainingMafia = players.filter(p => isMafiaRole(p.role, session) && p.isAlive);
        if (remainingMafia.length === 0 && !session.escortBecameMafia) {
          const escort = players.find(p => p.role === 'escort' && p.isAlive);
          if (escort) {
            session.escortBecameMafia = true;
          }
        }
      }
    }
  }

  voting.isActive = false;
  voting.votes = {};

  checkWinConditions(session);

  // If game didn't end, start next night
  if ((session.phase as string) !== 'ended') {
    session.players.forEach(p => p.isMuted = false);
    session.nightActions = {
      mafiaVotes: {},
      doctorLastTarget: session.nightActions.doctorLastTarget,
      actionsCompleted: { ...defaultActionsCompleted },
    };
    session.phase = 'night';
    session.round++;
  }

  return { session, eliminated, tied };
}

export function startNextRound(sessionId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session || session.phase === 'ended' || session.phase === 'lobby') return undefined;

  session.players.forEach(p => p.isMuted = false);

  session.nightActions = {
    mafiaVotes: {},
    doctorLastTarget: session.nightActions.doctorLastTarget,
    actionsCompleted: { ...defaultActionsCompleted },
  };

  session.phase = 'night';
  session.round++;
  session.lastKilled = undefined;
  session.lastKilledBy = undefined;

  return session;
}

function checkWinConditions(session: GameSession): void {
  const alivePlayers = session.players.filter(p => p.isAlive);
  const aliveMafia = alivePlayers.filter(p => isMafiaRole(p.role, session));
  const aliveNonMafia = alivePlayers.filter(p => !isMafiaRole(p.role, session) && p.role !== 'jester');

  if (aliveMafia.length >= aliveNonMafia.length && aliveMafia.length > 0) {
    session.winner = 'mafia';
    session.phase = 'ended';
    return;
  }

  if (aliveMafia.length === 0) {
    session.winner = 'town';
    session.phase = 'ended';
    return;
  }
}

export function getPlayerById(sessionId: string, playerId: string): Player | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  return session.players.find(p => p.id === playerId);
}

export function removePlayer(sessionId: string, playerId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.players = session.players.filter(p => p.id !== playerId);
  playerToSession.delete(playerId);

  if (session.hostId === playerId && session.players.length > 0) {
    session.hostId = session.players[0].id;
    session.players[0].isHost = true;
  }

  if (session.players.length === 0) {
    sessions.delete(sessionId);
    return undefined;
  }

  return session;
}

export function getAllRoles(session: GameSession): Record<string, Role> {
  const roles: Record<string, Role> = {};
  session.players.forEach(p => {
    if (p.role) {
      roles[p.username] = p.role;
    }
  });
  return roles;
}

export function restartGame(sessionId: string): GameSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.players.forEach(p => {
    p.isAlive = true;
    p.isMuted = false;
    p.role = undefined;
    p.isProtectedByWitch = false;
    p.isPoisoned = false;
  });

  session.phase = 'lobby';
  session.nightActions = {
    mafiaVotes: {},
    actionsCompleted: { ...defaultActionsCompleted },
  };
  session.voting = { votes: {}, isActive: false };
  session.round = 0;
  session.lastKilled = undefined;
  session.lastKilledBy = undefined;
  session.winner = undefined;
  session.escortBecameMafia = false;

  return session;
}
