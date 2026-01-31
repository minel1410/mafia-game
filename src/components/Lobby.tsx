'use client';

import { useGame } from '@/lib/gameContext';
import { RoleConfig, Role, ROLE_INFO } from '@/types/game';
import RoleCard from './RoleCard';

const CONFIGURABLE_ROLES: Role[] = [
  'mafia',
  'godfather',
  'detective',
  'doctor',
  'escort',
  'witch',
  'mayor',
  'jester',
];

export default function Lobby() {
  const { session, playerId, updateRoleConfig, startGame, error } = useGame();

  if (!session) return null;

  const isHost = session.hostId === playerId;
  const playerCount = session.players.length;

  const totalSpecialRoles = Object.values(session.roleConfig).reduce((sum, count) => sum + (count || 0), 0);
  const mafiaCount = (session.roleConfig.mafia || 0) + (session.roleConfig.godfather || 0);

  const canStart = totalSpecialRoles <= playerCount && mafiaCount >= 1 && playerCount >= 1;

  const handleConfigChange = (role: keyof RoleConfig, value: number) => {
    const newConfig = {
      ...session.roleConfig,
      [role]: Math.max(0, value),
    };
    updateRoleConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-sm mx-auto">
          {/* Session Code */}
          <div className="text-center mb-8">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Kod sesije</p>
            <p className="text-4xl font-mono font-black text-white tracking-[0.3em]">
              {session.code}
            </p>
            <p className="text-slate-600 text-sm mt-2">Podijeli kod prijateljima</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Players */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h2 className="text-slate-400 text-xs uppercase tracking-wide">
                Igraci ({playerCount})
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.players.map((player) => (
                <div
                  key={player.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    player.id === playerId
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {player.username}
                  {player.isHost && (
                    <span className="ml-1.5 text-xs text-slate-500">Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Role Configuration - Host Only */}
          {isHost && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-400 text-xs uppercase tracking-wide">Uloge</h2>
                <div className="text-sm">
                  <span className={totalSpecialRoles > playerCount ? 'text-red-400' : 'text-slate-500'}>
                    {totalSpecialRoles}
                  </span>
                  <span className="text-slate-600"> / {playerCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                {CONFIGURABLE_ROLES.map((role) => (
                  <RoleCard
                    key={role}
                    role={role}
                    count={session.roleConfig[role as keyof RoleConfig]}
                    onCountChange={(count) => handleConfigChange(role as keyof RoleConfig, count)}
                    showControls={true}
                    min={0}
                    compact={true}
                  />
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Mafija ukupno</span>
                  <span className="text-red-400 font-medium">{mafiaCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Mještani</span>
                  <span className="text-emerald-400 font-medium">{Math.max(0, playerCount - totalSpecialRoles)}</span>
                </div>
              </div>

              {totalSpecialRoles > playerCount && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  Previše uloga. Smanji broj ili dodaj igrače.
                </div>
              )}

              {mafiaCount < 1 && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm text-center">
                  Treba bar jedan član mafije.
                </div>
              )}
            </div>
          )}

          {/* Waiting message for non-hosts */}
          {!isHost && (
            <div className="py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm">Čekanje na početak igre...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button - Host Only */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-sm mx-auto">
            <button
              onClick={startGame}
              disabled={!canStart}
              className="w-full py-4 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Započni igru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
