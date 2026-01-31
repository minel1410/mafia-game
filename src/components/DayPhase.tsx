'use client';

import { useState } from 'react';
import { useGame } from '@/lib/gameContext';
import { ROLE_INFO } from '@/types/game';

export default function DayPhase() {
  const {
    session,
    playerId,
    myRole,
    roleExtras,
    nightResult,
    startVoting,
    startNextRound,
    clearNightResult,
  } = useGame();

  const [showRole, setShowRole] = useState(false);

  if (!session || !myRole) return null;

  const isHost = session.hostId === playerId;
  const me = session.players.find((p) => p.id === playerId);
  const isAlive = me?.isAlive ?? false;
  const isMuted = me?.isMuted ?? false;

  const alivePlayers = session.players.filter((p) => p.isAlive);
  const deadPlayers = session.players.filter((p) => !p.isAlive);
  const roleInfo = ROLE_INFO[myRole];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full mb-2">
              <span className="text-slate-500 text-xs">Runda</span>
              <span className="text-white font-medium">{session.round}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Dan</h1>
          </div>

          {/* Role reveal */}
          <div className="mb-6">
            <button
              onMouseDown={() => setShowRole(true)}
              onMouseUp={() => setShowRole(false)}
              onMouseLeave={() => setShowRole(false)}
              onTouchStart={() => setShowRole(true)}
              onTouchEnd={() => setShowRole(false)}
              className="w-full p-4 bg-slate-800 border border-slate-700 rounded-lg text-center transition active:scale-[0.98]"
            >
              {showRole ? (
                <div>
                  <span className={`font-bold ${
                    roleInfo.team === 'mafia' ? 'text-red-400' :
                    roleInfo.team === 'neutral' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {roleInfo.name}
                  </span>
                  {session.escortBecameMafia && myRole === 'escort' && (
                    <span className="text-red-500 text-xs ml-2">(Mafija)</span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400">Drži za prikaz uloge</span>
              )}
            </button>
          </div>

          {/* Status indicators */}
          {!isAlive && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <span className="text-red-400 text-sm">Eliminiran</span>
            </div>
          )}

          {isMuted && isAlive && (
            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
              <span className="text-purple-400 text-sm font-medium">Ućutkan si. Ne smiješ pričati.</span>
            </div>
          )}

          {/* Night Report Modal */}
          {nightResult && (
            <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-5">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-4">Noćni izvještaj</p>
              <div className="space-y-3">
                {nightResult.killed ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-white font-medium">{nightResult.killed}</p>
                    <p className="text-red-400 text-sm">
                      {nightResult.killedBy === 'mafia' ? 'Ubijen od mafije' :
                       nightResult.killedBy === 'witch' ? 'Otrovan' : 'Eliminiran'}
                    </p>
                  </div>
                ) : nightResult.saved ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-emerald-400">
                      {nightResult.savedBy === 'doctor' ? 'Doktor je spasio nekoga' :
                       nightResult.savedBy === 'witch' ? 'Vještica je zaštitila sve' :
                       'Neko je spašen'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                    <p className="text-slate-400">Mirna noć. Niko nije stradao.</p>
                  </div>
                )}

                {nightResult.poisonedPlayer && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-white font-medium">{nightResult.poisonedPlayer}</p>
                    <p className="text-purple-400 text-sm">Otrovan od vračare</p>
                  </div>
                )}

                {nightResult.mutedPlayer && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-white font-medium">{nightResult.mutedPlayer}</p>
                    <p className="text-purple-400 text-sm">Ućutkan</p>
                  </div>
                )}
              </div>
              <button
                onClick={clearNightResult}
                className="mt-4 w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg transition hover:bg-slate-700"
              >
                Nastavi
              </button>
            </div>
          )}

          {/* Alive Players - Dead players can see roles */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h2 className="text-slate-400 text-xs uppercase tracking-wide">
                Živi ({alivePlayers.length})
              </h2>
            </div>
            <div className="space-y-2">
              {alivePlayers.map((player) => {
                const playerRole = !isAlive ? roleExtras?.allPlayers?.find(p => p.id === player.id)?.role : undefined;
                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-lg flex items-center justify-between ${
                      player.id === playerId
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-medium">{player.username}</span>
                    <div className="flex items-center gap-2">
                      {playerRole && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          playerRole === 'mafia' || playerRole === 'godfather'
                            ? 'bg-red-500/20 text-red-400'
                            : playerRole === 'jester'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ROLE_INFO[playerRole]?.name || playerRole}
                        </span>
                      )}
                      {player.isHost && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          player.id === playerId ? 'bg-slate-200' : 'bg-slate-700'
                        }`}>
                          Host
                        </span>
                      )}
                      {player.isMuted && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                          Ućutkan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dead Players */}
          {deadPlayers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <h2 className="text-slate-500 text-xs uppercase tracking-wide">
                  Mrtvi ({deadPlayers.length})
                </h2>
              </div>
              <div className="space-y-2">
                {deadPlayers.map((player) => {
                  const playerRole = !isAlive ? roleExtras?.allPlayers?.find(p => p.id === player.id)?.role : undefined;
                  return (
                    <div
                      key={player.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center"
                    >
                      <span className="text-slate-600 line-through">{player.username}</span>
                      {playerRole && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          playerRole === 'mafia' || playerRole === 'godfather'
                            ? 'bg-red-500/20 text-red-400'
                            : playerRole === 'jester'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ROLE_INFO[playerRole]?.name || playerRole}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-host waiting */}
          {!isHost && (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm">Čekanje na hostovu odluku...</p>
            </div>
          )}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-sm mx-auto space-y-3">
            <button
              onClick={startVoting}
              className="w-full py-4 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 active:scale-[0.98]"
            >
              Pokreni glasanje
            </button>
            <button
              onClick={startNextRound}
              className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-400 font-medium rounded-lg transition hover:bg-slate-700"
            >
              Preskoči u noć
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
