'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSocket } from './socket';
import { GameSession, Role, RoleExtras, NightResult, RoleConfig } from '@/types/game';
import { Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/types/game';

interface GameContextType {
  session: GameSession | null;
  playerId: string | null;
  myRole: Role | null;
  roleExtras: RoleExtras | null;
  detectiveResult: { isMafia: boolean; username: string } | null;
  mafiaVotes: Record<string, string>;
  mafiaPlayerNames: Record<string, string>;
  nightResult: NightResult | null;
  gameEndInfo: { winner: 'town' | 'mafia' | 'jester'; roles: Record<string, Role> } | null;
  error: string | null;
  isConnected: boolean;
  createSession: (username: string) => Promise<boolean>;
  joinSession: (code: string, username: string) => Promise<boolean>;
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
  endVoting: () => void;
  startNextRound: () => void;
  restartGame: () => void;
  clearError: () => void;
  clearDetectiveResult: () => void;
  clearNightResult: () => void;
  clearGameEnd: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [roleExtras, setRoleExtras] = useState<RoleExtras | null>(null);
  const [detectiveResult, setDetectiveResult] = useState<{ isMafia: boolean; username: string } | null>(null);
  const [mafiaVotes, setMafiaVotes] = useState<Record<string, string>>({});
  const [mafiaPlayerNames, setMafiaPlayerNames] = useState<Record<string, string>>({});
  const [nightResult, setNightResult] = useState<NightResult | null>(null);
  const [gameEndInfo, setGameEndInfo] = useState<{ winner: 'town' | 'mafia' | 'jester'; roles: Record<string, Role> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    s.on('sessionUpdate', (updatedSession) => {
      setSession(updatedSession);
    });

    s.on('roleReveal', (role, extras) => {
      setMyRole(role);
      setRoleExtras(extras || null);
      setMafiaVotes({});
    });

    s.on('detectiveResult', (isMafia, targetUsername) => {
      setDetectiveResult({ isMafia, username: targetUsername });
    });

    s.on('mafiaVoteUpdate', (votes, playerNames) => {
      setMafiaVotes(votes);
      setMafiaPlayerNames(playerNames);
    });

    s.on('nightResult', (result) => {
      setNightResult(result);
    });

    s.on('gameEnd', (winner, roles) => {
      setGameEndInfo({ winner, roles });
    });

    s.on('error', (message) => {
      setError(message);
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('sessionUpdate');
      s.off('roleReveal');
      s.off('detectiveResult');
      s.off('mafiaVoteUpdate');
      s.off('nightResult');
      s.off('gameEnd');
      s.off('error');
    };
  }, []);

  const createSession = useCallback(async (username: string): Promise<boolean> => {
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit('createSession', username, (response) => {
        if (response.success && response.session && response.playerId) {
          setSession(response.session);
          setPlayerId(response.playerId);
          resolve(true);
        } else {
          setError(response.error || 'Greška pri kreiranju sesije');
          resolve(false);
        }
      });
    });
  }, [socket]);

  const joinSession = useCallback(async (code: string, username: string): Promise<boolean> => {
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit('joinSession', code, username, (response) => {
        if (response.success && response.session && response.playerId) {
          setSession(response.session);
          setPlayerId(response.playerId);
          resolve(true);
        } else {
          setError(response.error || 'Greška pri pridruživanju');
          resolve(false);
        }
      });
    });
  }, [socket]);

  const updateRoleConfig = useCallback((config: RoleConfig) => {
    socket?.emit('updateRoleConfig', config);
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('startGame');
  }, [socket]);

  const mafiaVote = useCallback((targetId: string) => {
    socket?.emit('mafiaVote', targetId);
  }, [socket]);

  const doctorHeal = useCallback((targetId: string) => {
    socket?.emit('doctorHeal', targetId);
  }, [socket]);

  const detectiveInvestigate = useCallback((targetId: string) => {
    socket?.emit('detectiveInvestigate', targetId);
  }, [socket]);

  const escortMute = useCallback((targetId: string) => {
    socket?.emit('escortMute', targetId);
  }, [socket]);

  const witchAction = useCallback((action: 'protect' | 'poison' | 'none', targetId?: string) => {
    socket?.emit('witchAction', action, targetId);
  }, [socket]);

  const skipNightAction = useCallback(() => {
    socket?.emit('skipNightAction');
  }, [socket]);

  const startVoting = useCallback(() => {
    socket?.emit('startVoting');
  }, [socket]);

  const vote = useCallback((targetId: string) => {
    socket?.emit('vote', targetId);
  }, [socket]);

  const endVoting = useCallback(() => {
    socket?.emit('endVoting');
  }, [socket]);

  const startNextRound = useCallback(() => {
    socket?.emit('startNextRound');
    setNightResult(null);
    setDetectiveResult(null);
  }, [socket]);

  const restartGame = useCallback(() => {
    socket?.emit('restartGame');
    setMyRole(null);
    setRoleExtras(null);
    setDetectiveResult(null);
    setMafiaVotes({});
    setNightResult(null);
    setGameEndInfo(null);
  }, [socket]);

  const clearError = useCallback(() => setError(null), []);
  const clearDetectiveResult = useCallback(() => setDetectiveResult(null), []);
  const clearNightResult = useCallback(() => setNightResult(null), []);
  const clearGameEnd = useCallback(() => setGameEndInfo(null), []);

  return (
    <GameContext.Provider
      value={{
        session,
        playerId,
        myRole,
        roleExtras,
        detectiveResult,
        mafiaVotes,
        mafiaPlayerNames,
        nightResult,
        gameEndInfo,
        error,
        isConnected,
        createSession,
        joinSession,
        updateRoleConfig,
        startGame,
        mafiaVote,
        doctorHeal,
        detectiveInvestigate,
        escortMute,
        witchAction,
        skipNightAction,
        startVoting,
        vote,
        endVoting,
        startNextRound,
        restartGame,
        clearError,
        clearDetectiveResult,
        clearNightResult,
        clearGameEnd,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
