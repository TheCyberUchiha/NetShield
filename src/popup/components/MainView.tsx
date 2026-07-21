import React, { useState } from 'react';
import { useShieldStore } from '../../store/useShieldStore';

export const MainView: React.FC = () => {
  const store = useShieldStore();
  const [domain, setDomain] = useState('');
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    const res = await store.addDomain(domain, false, 0); // basic defaults
    if (res.success) {
      setSuccess(`Added ${domain}`);
      setDomain('');
      setTimeout(() => { setSuccess(''); }, 2000);
    } else {
      setErr(res.reason || 'Failed to add domain');
      setTimeout(() => { setErr(''); }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="font-bold text-lg">Dashboard</h1>
        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Active</span>
      </header>

      <div className="p-4 flex-1 overflow-y-auto">
        <form onSubmit={handleAdd} className="mb-6 space-y-2">
          <label className="text-sm font-semibold text-slate-300">Lock New Domain</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => { setDomain(e.target.value); }}
              placeholder="e.g. twitter.com"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm transition-colors">
              Lock
            </button>
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
          {success && <div className="text-xs text-green-400">{success}</div>}
        </form>

        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Active Rules ({store.domains.length})</h2>
          {store.domains.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No domains locked.</p>
          ) : (
            <ul className="space-y-2">
              {store.domains.map(d => (
                <li key={d.domain} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                  <span className="font-mono text-sm">{d.domain}</span>
                  <button 
                    onClick={() => store.removeDomain(d.domain)}
                    className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
