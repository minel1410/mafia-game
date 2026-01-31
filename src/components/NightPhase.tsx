'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/lib/gameContext';
import { Role, ROLE_INFO } from '@/types/game';

export default function NightPhase() {
  const {
    session,
    playerId,
    myRole,
    roleExtras,
    detectiveResult,
    mafiaVotes,
    mafiaPlayerNames,
    mafiaVote,
    doctorHeal,
    detectiveInvestigate,
    escortMute,
    witchAction,
    skipNightAction,
    clearDetectiveResult,
  } = useGame();

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [witchChoice, setWitchChoice] = useState<'protect' | 'poison' | 'none' | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    setActionDone(false);
    setSelectedTarget(null);
    setWitchChoice(null);
    setTimeLeft(30);
  }, [session?.round]);

  useEffect(() => {
    if (session?.phase !== 'night') return;
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, session?.phase]);

  if (!session || !myRole) return null;

  const me = session.players.find((p) => p.id === playerId);
  const isAlive = me?.isAlive ?? false;
  const isMafia = myRole === 'mafia' || myRole === 'godfather' || (myRole === 'escort' && session.escortBecameMafia);

  const alivePlayers = roleExtras?.allPlayers?.filter((p) => p.isAlive) || [];
  const roleInfo = ROLE_INFO[myRole];

  if (!roleInfo) return null;

  const hasNightAction = isMafia || ['detective', 'doctor', 'witch'].includes(myRole) || (myRole === 'escort' && !session.escortBecameMafia);

  const handleAction = () => {
    if (myRole === 'witch') {
      if (!witchChoice) return;
  
      const target =
        witchChoice !== 'none' && witchChoice !== 'protect'
          ? (selectedTarget ?? undefined)
          : undefined;
  
      witchAction(witchChoice, target);
      setActionDone(true);
      return;
    }
  
    if (!selectedTarget) return;
  
    if (isMafia) {
      mafiaVote(selectedTarget);
    } else if (myRole === 'doctor') {
      doctorHeal(selectedTarget);
    } else if (myRole === 'detective') {
      detectiveInvestigate(selectedTarget);
    } else if (myRole === 'escort' && !session.escortBecameMafia) {
      escortMute(selectedTarget);
    }
  
    setActionDone(true);
  };
  

  const handleSkip = () => {
    skipNightAction();
    setActionDone(true);
  };

  const getActionTitle = () => {
    if (isMafia) return 'Odaberi metu';
    if (myRole === 'doctor') return 'Koga štititi?';
    if (myRole === 'detective') return 'Koga istražiti?';
    if (myRole === 'escort' && !session.escortBecameMafia) return 'Koga ućutkati?';
    if (myRole === 'witch') return 'Tvoja moć';
    return '';
  };

  const renderMafiaVotes = () => {
    if (!isMafia) return null;
    const votes = Object.entries(mafiaVotes);
    if (votes.length === 0) return null;

    return (
      <div className="bg-slate-800 border border-red-500/20 rounded-lg p-3 mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Glasovi mafije</p>
        <div className="space-y-1">
          {votes.map(([voterId, targetId]) => (
            <div key={voterId} className="text-sm">
              <span className="text-slate-400">{mafiaPlayerNames[voterId]}</span>
              <span className="text-slate-600 mx-2">→</span>
              <span className="text-white font-medium">{mafiaPlayerNames[targetId]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWitchActions = () => {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setWitchChoice('protect')}
          className={`w-full p-4 rounded-lg text-left transition ${
            witchChoice === 'protect'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800 border border-slate-700 text-slate-300'
          }`}
        >
          <div className="font-medium">Zaštiti sve</div>
          <p className="text-sm text-slate-500 mt-0.5">Niko ne može umrijeti ove noći</p>
        </button>

        <button
          onClick={() => setWitchChoice('poison')}
          className={`w-full p-4 rounded-lg text-left transition ${
            witchChoice === 'poison'
              ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
              : 'bg-slate-800 border border-slate-700 text-slate-300'
          }`}
        >
          <div className="font-medium">Otruj nekoga</div>
          <p className="text-sm text-slate-500 mt-0.5">Meta umire sljedeće noći</p>
        </button>

        <button
          onClick={() => setWitchChoice('none')}
          className={`w-full p-4 rounded-lg text-left transition ${
            witchChoice === 'none'
              ? 'bg-slate-700 border border-slate-600 text-slate-300'
              : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}
        >
          <div className="font-medium">Ne radi ništa</div>
          <p className="text-sm text-slate-500 mt-0.5">Sačuvaj moć za drugu noć</p>
        </button>

        {witchChoice === 'poison' && (
          <div className="mt-4">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Odaberi metu</p>
            <div className="space-y-2">
              {alivePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    selectedTarget === player.id
                      ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {player.username}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRoleAction = () => {
    if (!isAlive) {
      // Dead players can see all roles
      const allPlayersWithRoles = roleExtras?.allPlayers || [];
      return (
        <div className="flex-1 flex flex-col">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Uloge igrača</p>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {allPlayersWithRoles.map((player) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg flex justify-between items-center ${
                  player.isAlive
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-slate-900 border border-slate-800'
                }`}
              >
                <span className={`font-medium ${player.isAlive ? 'text-white' : 'text-slate-500 line-through'}`}>
                  {player.username}
                </span>
                {player.role && (
                  <span className={`text-sm px-2 py-0.5 rounded ${
                    player.role === 'mafia' || player.role === 'godfather'
                      ? 'bg-red-500/20 text-red-400'
                      : player.role === 'jester'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {ROLE_INFO[player.role]?.name || player.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!hasNightAction) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500">Noć je. Čekaj zoru...</p>
          </div>
        </div>
      );
    }

    // Detective Result
    if (detectiveResult && myRole === 'detective') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-center p-8 rounded-lg border ${
            detectiveResult.isMafia
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <p className="text-white text-lg font-semibold mb-2">{detectiveResult.username}</p>
            <p className={`text-xl font-bold ${detectiveResult.isMafia ? 'text-red-400' : 'text-emerald-400'}`}>
              {detectiveResult.isMafia ? 'MAFIJA' : 'NIJE MAFIJA'}
            </p>
            <button
              onClick={clearDetectiveResult}
              className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              U redu
            </button>
          </div>
        </div>
      );
    }

    if (actionDone) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-medium">Akcija izvršena</p>
            <p className="text-slate-500 text-sm mt-1">Čekaj ostale...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">{getActionTitle()}</p>

        {renderMafiaVotes()}

        {/* Other Mafia indicator */}
        {isMafia && roleExtras?.otherMafia && roleExtras.otherMafia.length > 0 && (
          <div className="bg-slate-800 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Saveznici</p>
            <p className="text-red-400 font-medium">
              {roleExtras.otherMafia.map(m => m.username).join(', ')}
            </p>
          </div>
        )}

        {myRole === 'witch' ? (
          renderWitchActions()
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto">
            {alivePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className={`w-full p-3.5 rounded-lg text-left transition ${
                  selectedTarget === player.id
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-medium">{player.username}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <button
            onClick={handleAction}
            disabled={myRole === 'witch' ? !witchChoice || (witchChoice === 'poison' && !selectedTarget) : !selectedTarget}
            className="w-full py-3.5 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Potvrdi
          </button>

          {!isMafia && myRole !== 'detective' && (
            <button
              onClick={handleSkip}
              className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-400 font-medium rounded-lg transition hover:bg-slate-700"
            >
              Preskoči
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full">
              <span className="text-slate-500 text-xs">Runda</span>
              <span className="text-white font-medium">{session.round}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              timeLeft <= 5 ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${timeLeft <= 5 ? 'bg-red-400' : 'bg-blue-400'}`}></span>
              <span className={`font-medium text-sm ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>{timeLeft}s</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Noć</h1>
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
                <p className="text-slate-500 text-sm mt-1">{roleInfo.description}</p>
              </div>
            ) : (
              <span className="text-slate-400">Drži za prikaz uloge</span>
            )}
          </button>
        </div>

        {!isAlive && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <span className="text-red-400 text-sm">Eliminiran</span>
          </div>
        )}

        {/* Action Area */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-5">
          {renderRoleAction()}
        </div>
      </div>
    </div>
  );
}
