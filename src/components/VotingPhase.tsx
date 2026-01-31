'use client';

import { useState } from 'react';
import { useGame } from '@/lib/gameContext';
import { ROLE_INFO } from '@/types/game';

export default function VotingPhase() {
  const { session, playerId, roleExtras, vote, endVoting } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  if (!session) return null;

  const isHost = session.hostId === playerId;
  const me = session.players.find((p) => p.id === playerId);
  const isAlive = me?.isAlive ?? false;

  const alivePlayers = session.players.filter((p) => p.isAlive && p.id !== playerId);

  // Count votes per player
  const voteCounts: Record<string, number> = {};
  Object.values(session.voting.votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const totalVotes = Object.keys(session.voting.votes).length;
  const aliveCount = session.players.filter((p) => p.isAlive).length;

  const handleVote = () => {
    if (!selectedTarget) return;
    vote(selectedTarget);
    setHasVoted(true);
  };

  // Get sorted players by vote count
  const sortedPlayers = session.players
    .filter((p) => p.isAlive && voteCounts[p.id] > 0)
    .sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-3">Glasanje</h1>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-full">
              <span className="text-slate-500 text-sm">Glasova</span>
              <span className="text-white font-semibold">{totalVotes}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{aliveCount}</span>
            </div>
          </div>

          {/* Voting Area */}
          {!isAlive ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Uloge igrača</p>
              <div className="space-y-2">
                {roleExtras?.allPlayers?.map((player) => (
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
                      <span className={`text-xs px-2 py-0.5 rounded ${
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
          ) : hasVoted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-400 font-medium">Glasao si</p>
              <p className="text-slate-500 text-sm mt-1">Čekaj ostale...</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-4">Glasaj za izbacivanje</p>
              <div className="space-y-2 mb-4">
                {alivePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    className={`w-full p-3.5 rounded-lg text-left transition flex justify-between items-center ${
                      selectedTarget === player.id
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-medium">{player.username}</span>
                    {voteCounts[player.id] > 0 && (
                      <span className={`px-2.5 py-1 rounded text-sm font-medium ${
                        selectedTarget === player.id
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {voteCounts[player.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleVote}
                disabled={!selectedTarget}
                className="w-full py-3.5 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Potvrdi glas
              </button>
            </div>
          )}

          {/* Current Votes Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-4">Trenutni rezultat</p>
            {sortedPlayers.length === 0 ? (
              <p className="text-slate-600 text-center py-4">Nema glasova</p>
            ) : (
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <div key={player.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-medium ${index === 0 ? 'text-white' : 'text-slate-400'}`}>
                        {player.username}
                      </span>
                      <span className={`font-semibold ${index === 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {voteCounts[player.id]}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all ${index === 0 ? 'bg-red-500' : 'bg-slate-600'}`}
                        style={{ width: `${(voteCounts[player.id] / aliveCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-sm mx-auto">
            <button
              onClick={endVoting}
              className="w-full py-4 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 active:scale-[0.98]"
            >
              Završi glasanje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
