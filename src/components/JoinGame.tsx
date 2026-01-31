'use client';

import { useState } from 'react';
import { useGame } from '@/lib/gameContext';
import { Role, ROLE_INFO } from '@/types/game';
import RoleCard from './RoleCard';

const ALL_ROLES: Role[] = [
  'citizen',
  'mafia',
  'godfather',
  'detective',
  'doctor',
  'escort',
  'witch',
  'mayor',
  'jester',
];

export default function JoinGame() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'roles'>('select');
  const [loading, setLoading] = useState(false);

  const { createSession, joinSession, error, clearError } = useGame();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    await createSession(username.trim());
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !code.trim()) return;
    setLoading(true);
    await joinSession(code.trim().toUpperCase(), username.trim());
    setLoading(false);
  };

  if (mode === 'roles') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-sm mx-auto">
            <button
              onClick={() => setMode('select')}
              className="text-slate-500 hover:text-white mb-6 text-sm transition"
            >
              ← Nazad
            </button>

            <h1 className="text-2xl font-bold text-white mb-6">Uloge</h1>

            <div className="space-y-3">
              {ALL_ROLES.map((role) => (
                <RoleCard key={role} role={role} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
              MAFIA
            </h1>
            <p className="text-slate-500 text-sm tracking-widest uppercase">Društvena igra</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 active:scale-[0.98]"
            >
              Nova sesija
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-slate-800 text-white font-semibold rounded-lg border border-slate-700 transition hover:bg-slate-700 active:scale-[0.98]"
            >
              Pridruži se
            </button>
            <button
              onClick={() => setMode('roles')}
              className="w-full py-4 bg-slate-900 text-slate-400 font-medium rounded-lg border border-slate-800 transition hover:bg-slate-800 hover:text-white active:scale-[0.98]"
            >
              Pogledaj uloge
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        <button
          onClick={() => { setMode('select'); clearError(); }}
          className="text-slate-500 hover:text-white mb-8 text-sm self-start transition"
        >
          ← Nazad
        </button>

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === 'create' ? 'Kreiraj sesiju' : 'Pridruži se'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'create'
              ? 'Pokreni novu igru i pozovi prijatelje'
              : 'Unesi kod koji ti je dao domaćin'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wide mb-2">Ime</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kako te zovu?"
                className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:border-slate-600 placeholder-slate-600 transition"
                maxLength={20}
                autoComplete="off"
                autoFocus
                required
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-2">Kod sesije</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:border-slate-600 placeholder-slate-600 uppercase tracking-widest text-center font-mono text-lg transition"
                  maxLength={6}
                  autoComplete="off"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-slate-900 font-semibold rounded-lg transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-8"
          >
            {loading ? 'Učitavam...' : (mode === 'create' ? 'Kreiraj' : 'Pridruži se')}
          </button>
        </form>
      </div>
    </div>
  );
}
