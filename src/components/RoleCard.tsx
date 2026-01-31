'use client';

import { useState } from 'react';
import { Role, ROLE_INFO } from '@/types/game';

interface RoleCardProps {
  role: Role;
  count?: number;
  onCountChange?: (count: number) => void;
  showControls?: boolean;
  min?: number;
  compact?: boolean;
}

const roleIcons: Record<Role, string> = {
  citizen: '👤',
  mafia: '🔫',
  godfather: '🎩',
  detective: '🔍',
  doctor: '💉',
  escort: '💋',
  jester: '🃏',
  witch: '🔮',
  mayor: '👔',
};

const teamColors = {
  town: {
    bg: 'bg-slate-800',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-400',
    text: 'text-emerald-400',
    icon: 'bg-emerald-500/20',
  },
  mafia: {
    bg: 'bg-slate-800',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-400',
    text: 'text-red-400',
    icon: 'bg-red-500/20',
  },
  neutral: {
    bg: 'bg-slate-800',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400',
    text: 'text-amber-400',
    icon: 'bg-amber-500/20',
  },
};

const teamNames = {
  town: 'Grad',
  mafia: 'Mafija',
  neutral: 'Neutralni',
};

export default function RoleCard({
  role,
  count,
  onCountChange,
  showControls = false,
  min = 0,
  compact = false,
}: RoleCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const info = ROLE_INFO[role];
  if (!info) return null;

  // Escort (Dama) shows as red even though she starts as town
  const colorTeam = role === 'escort' ? 'mafia' : info.team;
  const colors = teamColors[colorTeam];
  const icon = roleIcons[role];

  if (compact) {
    return (
      <>
        <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfo(true)}
                className={`w-9 h-9 ${colors.icon} rounded-lg flex items-center justify-center text-lg transition hover:scale-105 active:scale-95`}
              >
                {icon}
              </button>
              <div>
                <span className={`text-sm font-medium ${colors.text}`}>{info.name}</span>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${colors.badge}`}>
                  {teamNames[info.team]}
                </span>
              </div>
            </div>
            {showControls && onCountChange && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onCountChange(Math.max(min, (count || 0) - 1))}
                  disabled={(count || 0) <= min}
                  className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white text-sm rounded-lg transition"
                >
                  −
                </button>
                <span className="w-6 text-center text-white font-medium">{count || 0}</span>
                <button
                  onClick={() => onCountChange((count || 0) + 1)}
                  className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
            onClick={() => setShowInfo(false)}
          >
            <div
              className={`w-full max-w-sm ${colors.bg} border ${colors.border} rounded-xl p-6`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${colors.icon} rounded-xl flex items-center justify-center text-3xl`}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{info.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${colors.badge}`}>
                    {teamNames[info.team]}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-4">{info.description}</p>

              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Sposobnost</p>
                <p className="text-slate-300 text-sm">{info.ability}</p>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
              >
                Zatvori
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl overflow-hidden transition-all`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center text-2xl transition hover:scale-105 active:scale-95`}
            >
              {icon}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{info.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {teamNames[info.team]}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{info.description}</p>
            </div>
          </div>

          {showControls && onCountChange && (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onCountChange(Math.max(min, (count || 0) - 1))}
                disabled={(count || 0) <= min}
                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-medium rounded-lg transition"
              >
                −
              </button>
              <span className="w-8 text-center text-white font-semibold text-lg">{count || 0}</span>
              <button
                onClick={() => onCountChange((count || 0) + 1)}
                className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {showInfo && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700/50">
          <div className="mt-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sposobnost</p>
            <p className="text-slate-300 text-sm">{info.ability}</p>
          </div>
        </div>
      )}
    </div>
  );
}
