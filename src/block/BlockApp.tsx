import React, { useEffect, useState } from 'react';
import { useShieldStore } from '../store/useShieldStore';
import { hashPasskey } from '../utils/crypto';

export default function BlockApp() {
  const store = useShieldStore();
  const [passkey, setPasskey] = useState('');
  const [err, setErr] = useState('');
  const [domain, setDomain] = useState('Unknown Domain');

  useEffect(() => {
    store.loadAll();
    const params = new URLSearchParams(window.location.search);
    setDomain(params.get('domain') || 'Unknown Domain');
  }, [store]);

  const handleBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (store.lockdownUntil > Date.now()) {
      setErr('System lockdown active.');
      return;
    }
    const hash = await hashPasskey(passkey);
    if (hash === store.passkeyHash) {
      await store.clearFailedAttempts();
      chrome.runtime.sendMessage({ action: 'addBypass', domain, durationMins: 15 }, (res) => {
        if (res?.success) {
          window.location.href = `https://${domain}`;
        } else {
          setErr('Failed to establish bypass session.');
        }
      });
    } else {
      await store.recordFailedAttempt();
      setErr('Invalid passkey.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans antialiased px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight">Access Blocked</h1>
        <p className="text-lg text-slate-400">
          Connection to <span className="font-mono text-red-400 font-bold">{domain}</span> has been intercepted by NetShield.
        </p>

        <form onSubmit={handleBypass} className="mt-8 space-y-4 max-w-sm mx-auto">
          <input
            type="password"
            autoFocus
            value={passkey}
            onChange={e => { setPasskey(e.target.value); setErr(''); }}
            className="w-full px-4 py-3 text-lg font-mono text-center bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-red-500 transition-colors"
            placeholder="Enter Master Passkey"
          />
          {err && <div className="text-sm font-semibold text-red-500">{err}</div>}
          
          <button
            type="submit"
            disabled={store.lockdownUntil > Date.now()}
            className="w-full py-3 font-bold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50"
          >
            {store.lockdownUntil > Date.now() ? 'System Lockdown Active' : 'Authorize Temporary Bypass'}
          </button>
        </form>

        <p className="text-xs text-slate-600 mt-8">
          Protected by NetShield Proxy Engine. All attempts are logged.
        </p>
      </div>
    </div>
  );
}
