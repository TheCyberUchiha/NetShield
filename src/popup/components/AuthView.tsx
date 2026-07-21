import React, { useState } from 'react';
import { useShieldStore } from '../../store/useShieldStore';
import { hashPasskey } from '../../utils/crypto';

export const AuthView: React.FC = () => {
  const store = useShieldStore();
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (store.lockdownUntil > Date.now()) {
      setErr('System is currently locked out.');
      return;
    }
    const hash = await hashPasskey(key);
    if (hash === store.passkeyHash) {
      await store.clearFailedAttempts();
      // Temporarily store a session flag in background if needed, or rely on UI state
      // For now, reload window to trigger state re-eval if we had a session token
      // Because we didn't implement checkSessionValid in store, we assume success sets a short-lived token
      // Let's implement an unlock action in the store or just dispatch a message
      chrome.runtime.sendMessage({ action: 'unlockSession' });
      window.location.reload();
    } else {
      await store.recordFailedAttempt();
      setErr('Invalid passkey.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-white bg-slate-900">
      <div className="mb-6 p-4 bg-slate-800 rounded-full">
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-bold">Authentication Required</h2>
      <form onSubmit={handleUnlock} className="w-full space-y-4">
        <input
          type="password"
          autoFocus
          value={key}
          onChange={(e) => { setKey(e.target.value); setErr(''); }}
          className="w-full px-4 py-3 text-lg font-mono text-center bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500"
          placeholder="••••••••"
        />
        {err && <div className="text-sm font-semibold text-center text-red-500">{err}</div>}
        <button
          type="submit"
          disabled={store.lockdownUntil > Date.now()}
          className="w-full py-3 font-bold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {store.lockdownUntil > Date.now() ? 'Locked Out' : 'Unlock Dashboard'}
        </button>
      </form>
    </div>
  );
};
