import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  RoleExtras,
  GameSession,
} from '@/types/game';
import * as store from './gameStore';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

const playerSockets: Map<string, string> = new Map();
const socketPlayers: Map<string, string> = new Map();
const nightTimers: Map<string, NodeJS.Timeout> = new Map();

const NIGHT_DURATION = 30000; // 30 seconds

export function setupSocketHandlers(io: GameServer) {
  io.on('connection', (socket: GameSocket) => {
    console.log('Client connected:', socket.id);

    socket.on('createSession', (username, callback) => {
      try {
        const { session, playerId } = store.createSession(username);
        playerSockets.set(playerId, socket.id);
        socketPlayers.set(socket.id, playerId);
        socket.join(session.id);
        callback({ success: true, session: sanitizeSession(session), playerId });
      } catch (error) {
        callback({ success: false, error: 'Greška pri kreiranju sesije' });
      }
    });

    socket.on('joinSession', (code, username, callback) => {
      try {
        const result = store.joinSession(code, username);
        if (!result) {
          callback({ success: false, error: 'Pogrešan kod ili ime već zauzeto' });
          return;
        }

        const { session, playerId } = result;
        playerSockets.set(playerId, socket.id);
        socketPlayers.set(socket.id, playerId);
        socket.join(session.id);

        io.to(session.id).emit('sessionUpdate', sanitizeSession(session));
        callback({ success: true, session: sanitizeSession(session), playerId });
      } catch (error) {
        callback({ success: false, error: 'Greška pri pridruživanju' });
      }
    });

    socket.on('updateRoleConfig', (config) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session || session.hostId !== playerId) return;

      const updated = store.updateRoleConfig(session.id, config);
      if (updated) {
        io.to(session.id).emit('sessionUpdate', sanitizeSession(updated));
      }
    });

    socket.on('startGame', () => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session || session.hostId !== playerId) {
        socket.emit('error', 'Samo domaćin može pokrenuti igru');
        return;
      }

      const started = store.startGame(session.id);
      if (!started) {
        socket.emit('error', 'Provjeri broj igrača i raspodjelu uloga');
        return;
      }

      // Send role reveals to all players
      started.players.forEach(player => {
        const playerSocketId = playerSockets.get(player.id);
        if (playerSocketId && player.role) {
          const extras: RoleExtras = {
            allPlayers: started.players
              .filter(p => p.id !== player.id && p.isAlive)
              .map(p => ({ id: p.id, username: p.username, isAlive: p.isAlive })),
          };

          if (player.role === 'mafia' || player.role === 'godfather') {
            extras.otherMafia = started.players
              .filter(p => (p.role === 'mafia' || p.role === 'godfather') && p.id !== player.id)
              .map(p => ({ id: p.id, username: p.username }));
          }

          io.to(playerSocketId).emit('roleReveal', player.role, extras);
        }
      });

      io.to(session.id).emit('sessionUpdate', sanitizeSession(started));

      // Start night timer
      startNightTimer(io, session.id);
    });

    socket.on('mafiaVote', (targetId) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      const updated = store.submitMafiaVote(session.id, playerId, targetId);
      if (updated) {
        const mafiaPlayers = updated.players.filter(p =>
          (p.role === 'mafia' || p.role === 'godfather' || (p.role === 'escort' && updated.escortBecameMafia)) && p.isAlive
        );

        const playerNames: Record<string, string> = {};
        updated.players.forEach(p => {
          playerNames[p.id] = p.username;
        });

        mafiaPlayers.forEach(mafia => {
          const mafiaSocketId = playerSockets.get(mafia.id);
          if (mafiaSocketId) {
            io.to(mafiaSocketId).emit('mafiaVoteUpdate', updated.nightActions.mafiaVotes, playerNames);
          }
        });

        checkAndEndNight(io, session.id);
      }
    });

    socket.on('doctorHeal', (targetId) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      const updated = store.submitDoctorHeal(session.id, playerId, targetId);
      if (!updated) {
        socket.emit('error', 'Ne možeš zaštititi istog igrača dvaput zaredom');
      } else {
        checkAndEndNight(io, session.id);
      }
    });

    socket.on('detectiveInvestigate', (targetId) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      const result = store.submitDetectiveInvestigation(session.id, playerId, targetId);
      if (result) {
        const target = result.session.players.find(p => p.id === targetId);
        if (target) {
          socket.emit('detectiveResult', result.isMafia, target.username);
        }
        checkAndEndNight(io, session.id);
      }
    });

    socket.on('escortMute', (targetId) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      store.submitEscortMute(session.id, playerId, targetId);
      checkAndEndNight(io, session.id);
    });

    socket.on('witchAction', (action, targetId) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      store.submitWitchAction(session.id, playerId, action, targetId);
      checkAndEndNight(io, session.id);
    });

    socket.on('skipNightAction', () => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      store.skipNightAction(session.id, playerId);
      checkAndEndNight(io, session.id);
    });

    socket.on('startVoting', () => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session || session.hostId !== playerId) return;

      const updated = store.startVoting(session.id);
      if (updated) {
        io.to(session.id).emit('sessionUpdate', sanitizeSession(updated));
      }
    });

    socket.on('vote', (targetId) => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session) return;

      const updated = store.submitVote(session.id, playerId, targetId);
      if (updated) {
        io.to(session.id).emit('sessionUpdate', sanitizeSession(updated));
      }
    });

    socket.on('endVoting', () => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session || session.hostId !== playerId) return;

      const result = store.resolveVoting(session.id);
      if (result) {
        io.to(session.id).emit('sessionUpdate', sanitizeSession(result.session));

        if (result.session.phase === 'ended') {
          const roles = store.getAllRoles(result.session);
          io.to(session.id).emit('gameEnd', result.session.winner!, roles);
        } else if (result.session.phase === 'night') {
          // Voting ended, next night started automatically
          sendNightPhaseInfo(io, result.session);
          startNightTimer(io, session.id);
        }
      }
    });

    socket.on('startNextRound', () => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session || session.hostId !== playerId) return;

      if (session.phase === 'day') {
        const updated = store.startNextRound(session.id);
        if (updated) {
          sendNightPhaseInfo(io, updated);
          io.to(session.id).emit('sessionUpdate', sanitizeSession(updated));
          startNightTimer(io, session.id);
        }
      }
    });

    socket.on('restartGame', () => {
      const playerId = socketPlayers.get(socket.id);
      if (!playerId) return;

      const session = store.getSessionByPlayerId(playerId);
      if (!session || session.hostId !== playerId) return;

      clearNightTimer(session.id);

      const updated = store.restartGame(session.id);
      if (updated) {
        io.to(session.id).emit('sessionUpdate', sanitizeSession(updated));
      }
    });

    socket.on('disconnect', () => {
      const playerId = socketPlayers.get(socket.id);
      if (playerId) {
        const session = store.getSessionByPlayerId(playerId);
        if (session) {
          const updated = store.removePlayer(session.id, playerId);
          if (updated) {
            io.to(session.id).emit('sessionUpdate', sanitizeSession(updated));
          }
        }
        playerSockets.delete(playerId);
        socketPlayers.delete(socket.id);
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}

function startNightTimer(io: GameServer, sessionId: string) {
  clearNightTimer(sessionId);

  const timer = setTimeout(() => {
    endNight(io, sessionId);
  }, NIGHT_DURATION);

  nightTimers.set(sessionId, timer);
}

function clearNightTimer(sessionId: string) {
  const existing = nightTimers.get(sessionId);
  if (existing) {
    clearTimeout(existing);
    nightTimers.delete(sessionId);
  }
}

function checkAndEndNight(io: GameServer, sessionId: string) {
  const session = store.getSession(sessionId);
  if (!session || session.phase !== 'night') return;

  const { canEnd } = store.canEndNight(session);
  if (canEnd) {
    clearNightTimer(sessionId);
    endNight(io, sessionId);
  }
}

function endNight(io: GameServer, sessionId: string) {
  const result = store.resolveNight(sessionId);
  if (result) {
    io.to(sessionId).emit('nightResult', {
      killed: result.killed?.username,
      killedBy: result.killedBy,
      saved: result.saved,
      savedBy: result.savedBy,
      mutedPlayer: result.mutedPlayer?.username,
      poisonedPlayer: result.poisonedPlayer?.username,
    });
    io.to(sessionId).emit('sessionUpdate', sanitizeSession(result.session));

    if (result.session.phase === 'ended') {
      const roles = store.getAllRoles(result.session);
      io.to(sessionId).emit('gameEnd', result.session.winner!, roles);
    }
  }
}

function sendNightPhaseInfo(io: GameServer, session: GameSession) {
  session.players.forEach(player => {
    if (!player.role) return;

    const playerSocketId = playerSockets.get(player.id);
    if (!playerSocketId) return;

    // Dead players can see all roles
    if (!player.isAlive) {
      const extras: RoleExtras = {
        allPlayers: session.players
          .filter(p => p.id !== player.id)
          .map(p => ({ id: p.id, username: p.username, isAlive: p.isAlive, role: p.role })),
      };
      io.to(playerSocketId).emit('roleReveal', player.role, extras);
      return;
    }

    const extras: RoleExtras = {
      allPlayers: session.players
        .filter(p => p.id !== player.id && p.isAlive)
        .map(p => ({ id: p.id, username: p.username, isAlive: p.isAlive })),
    };

    if (player.role === 'mafia' || player.role === 'godfather' || (player.role === 'escort' && session.escortBecameMafia)) {
      extras.otherMafia = session.players
        .filter(p => (p.role === 'mafia' || p.role === 'godfather' || (p.role === 'escort' && session.escortBecameMafia)) && p.id !== player.id && p.isAlive)
        .map(p => ({ id: p.id, username: p.username }));
    }

    io.to(playerSocketId).emit('roleReveal', player.role, extras);
  });
}

function sanitizeSession(session: GameSession): GameSession {
  return {
    ...session,
    players: session.players.map(p => ({
      ...p,
      role: undefined,
    })),
    nightActions: {
      mafiaVotes: {},
      actionsCompleted: session.nightActions.actionsCompleted,
    },
  };
}
