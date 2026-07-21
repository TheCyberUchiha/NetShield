import React, { useState } from 'react';
import { useShieldStore } from '../../store/useShieldStore';
import { hashPasskey, passkeyStrength } from '../../utils/crypto';

export const SetupView: React.FC = () => {
  const store = useShieldStore();
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (key.length < 8) {
      setErr('Passkey must be at least 8 characters.');
      return;
    }
    const hash = await hashPasskey(key);
    await store.setPasskeyHash(hash);
  };

  const { label, color } = passkeyStrength(key);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-white bg-slate-900">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">NetShield Setup</h1>
      <p className="mb-6 text-sm text-center text-slate-400">
        Create a master passkey. This secures your block rules and cannot be recovered if lost.
      </p>
      <form onSubmit={handleSetup} className="w-full space-y-4">
        <div>
          <input
            type="password"
            autoFocus
            value={key}
            onChange={(e) => { setKey(e.target.value); setErr(''); }}
            className="w-full px-4 py-3 text-lg font-mono bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500"
            placeholder="Min 8 characters..."
          />
          {key.length > 0 && (
            <div className="mt-2 text-xs font-semibold" style={{ color }}>
              Strength: {label}
            </div>
          )}
        </div>
        {err && <div className="text-sm font-semibold text-red-500">{err}</div>}
        <button
          type="submit"
          className="w-full py-3 font-bold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500"
        >
          Initialize NetShield
        </button>
      </form>
    </div>
  );
};
