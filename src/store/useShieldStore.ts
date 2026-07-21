import { create } from 'zustand';
import browser from 'webextension-polyfill';

export interface DomainRule {
  domain: string;
  lifetime: boolean;
  unlockDuration: number;
}

export interface BypassSession {
  domain: string;
  expiresAt: number;
}

export interface LogEntry {
  category: 'SECURITY' | 'USER' | 'SYSTEM' | 'TAMPER';
  event: string;
  detail: string;
  severity: 'INFO' | 'WARN' | 'ALERT';
  timestamp: number;
}

interface ShieldState {
  passkeyHash: string;
  domains: DomainRule[];
  bypassSessions: BypassSession[];
  lockMode: 'always' | 'session' | '24h' | 'inactivity';
  inactivityMins: number;
  failedAttempts: number;
  lockdownUntil: number;

  loadAll: () => Promise<void>;
  setPasskeyHash: (hash: string) => Promise<void>;
  setLockMode: (mode: 'always' | 'session' | '24h' | 'inactivity') => Promise<void>;
  addDomain: (domain: string, lifetime: boolean, duration: number) => Promise<{ success: boolean; reason?: string }>;
  removeDomain: (domain: string) => Promise<void>;
  recordFailedAttempt: () => Promise<void>;
  clearFailedAttempts: () => Promise<void>;
}

export const useShieldStore = create<ShieldState>((set, get) => {
  if (typeof window !== 'undefined' && browser.storage) {
    browser.storage.onChanged.addListener((changes: Record<string, browser.Storage.StorageChange>) => {
      if (changes['domains']) set({ domains: (changes['domains'].newValue as DomainRule[]) ?? [] });
      if (changes['bypassSessions']) set({ bypassSessions: (changes['bypassSessions'].newValue as BypassSession[]) ?? [] });
      if (changes['lockdownUntil']) set({ lockdownUntil: (changes['lockdownUntil'].newValue as number) ?? 0 });
      if (changes['failedAttempts']) set({ failedAttempts: (changes['failedAttempts'].newValue as number) ?? 0 });
    });
  }

  return {
    passkeyHash: '',
    domains: [],
    bypassSessions: [],
    lockMode: 'always',
    inactivityMins: 15,
    failedAttempts: 0,
    lockdownUntil: 0,

    loadAll: async () => {
      const syncData = await browser.storage.sync.get({ passkeyHash: '', domains: [], lockMode: 'always', inactivityMins: 15 });
      const localData = await browser.storage.local.get({ bypassSessions: [], failedAttempts: 0, lockdownUntil: 0, systemTampered: false });
      
      set({
        passkeyHash: (syncData.passkeyHash as string) ?? '',
        domains: (syncData.domains as DomainRule[]) ?? [],
        lockMode: (syncData.lockMode as 'always' | 'session' | '24h' | 'inactivity') ?? 'always',
        inactivityMins: (syncData.inactivityMins as number) ?? 15,
        bypassSessions: (localData.bypassSessions as BypassSession[]) ?? [],
        failedAttempts: (localData.failedAttempts as number) ?? 0,
        lockdownUntil: (localData.lockdownUntil as number) ?? 0
      });
    },

    setPasskeyHash: async (hash: string) => {
      await browser.storage.sync.set({ passkeyHash: hash });
      set({ passkeyHash: hash });
    },
    setLockMode: async (mode) => {
      await browser.storage.sync.set({ lockMode: mode });
      set({ lockMode: mode });
    },
    addDomain: async (domain: string, lifetime: boolean, duration: number) => {
      return browser.runtime.sendMessage({ action: 'addDomain', domain, lifetime, unlockDuration: duration });
    },
    removeDomain: async (domain: string) => {
      await browser.runtime.sendMessage({ action: 'removeDomain', domain });
    },
    recordFailedAttempt: async () => {
      const { failedAttempts } = get();
      const next = failedAttempts + 1;
      let lockdown = 0;
      if (next >= 5) {
        lockdown = Date.now() + 60000;
        await browser.storage.local.set({ failedAttempts: 0, lockdownUntil: lockdown });
        set({ failedAttempts: 0, lockdownUntil: lockdown });
      } else {
        await browser.storage.local.set({ failedAttempts: next });
        set({ failedAttempts: next });
      }
    },
    clearFailedAttempts: async () => {
      await browser.storage.local.set({ failedAttempts: 0, lockdownUntil: 0 });
      set({ failedAttempts: 0, lockdownUntil: 0 });
    }
  };
});
