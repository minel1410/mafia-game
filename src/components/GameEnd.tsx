'use client';

import { useGame } from '@/lib/gameContext';
import { Role, ROLE_INFO } from '@/types/game';

export default function GameEnd() {
  const { session, playerId, gameEndInfo, restartGame } = useGame();

  if (!session || !gameEndInfo) return null;

  const isHost = session.hostId === playerId;

  const winnerConfig = {
    town: {
      text: 'Grad pobjeđuje',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    mafia: {
      text: 'Mafija pobjeđuje',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    jester: {
      text: 'Luda pobjeđuje',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  };

  const winner = winnerConfig[gameEndInfo.winner];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-sm mx-auto">
          {/* Winner Banner */}
          <div className={`${winner.bg} border ${winner.border} rounded-lg p-8 text-center mb-8`}>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Kraj igre</p>
            <h1 className={`text-2xl font-bold ${winner.color}`}>
              {winner.text}
            </h1>
          </div>

          {/* All Roles */}
          <div className="mb-6">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-4">Sve uloge</p>
            <div className="space-y-2">
              {session.players.map((player) => {
                const role = gameEndInfo.roles[player.username] as Role | undefined;
                const roleInfo = role ? ROLE_INFO[role] : null;

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-lg flex items-center justify-between ${
                      player.isAlive
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {!player.isAlive && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                      <span className={player.isAlive ? 'text-white font-medium' : 'text-slate-500 line-through'}>
                        {player.username}
                      </span>
                    </div>
                    {roleInfo && (
                      <span className={`text-sm font-medium ${
                        roleInfo.team === 'mafia' ? 'text-red-400' :
                        roleInfo.team === 'neutral' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {roleInfo.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-host waiting */}
          {!isHost && (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm">Čekanje na novu igru...</p>
            </div>
          )}
        </div>
      </div>

      {/* Host Action */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-sm mx-auto">
            <button
              onClick={restartGame}
              className="w-full py-4 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 active:scale-[0.98]"
            >
              Nova igra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
