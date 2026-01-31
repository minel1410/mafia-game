'use client';

import { useGame } from '@/lib/gameContext';
import JoinGame from './JoinGame';
import Lobby from './Lobby';
import NightPhase from './NightPhase';
import DayPhase from './DayPhase';
import VotingPhase from './VotingPhase';
import GameEnd from './GameEnd';

export default function Game() {
  const { session, isConnected } = useGame();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Povezivanje...</div>
      </div>
    );
  }

  if (!session) {
    return <JoinGame />;
  }

  switch (session.phase) {
    case 'lobby':
      return <Lobby />;
    case 'night':
      return <NightPhase />;
    case 'day':
      return <DayPhase />;
    case 'voting':
      return <VotingPhase />;
    case 'ended':
      return <GameEnd />;
    default:
      return <JoinGame />;
  }
}
