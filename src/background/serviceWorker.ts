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

const MAX_DOMAIN_LENGTH = 253; // RFC 1035
const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function isValidDomain(d: string): boolean {
  return typeof d === 'string' && d.length > 0 && d.length <= MAX_DOMAIN_LENGTH && DOMAIN_RE.test(d);
}

// LOGGING
export async function logEvent(category: LogEntry['category'], event: string, detail: string, severity: LogEntry['severity'] = 'INFO') {
  const data = await browser.storage.local.get({ eventLog: [] });
  const logs = (data['eventLog'] as LogEntry[]) || [];
  logs.unshift({ category, event, detail, severity, timestamp: Date.now() });
  if (logs.length > 500) logs.length = 500;
  await browser.storage.local.set({ eventLog: logs });
}

// DECLARATIVE NET REQUEST UPDATER
async function updateRules() {
  const syncData = await browser.storage.sync.get({ domains: [] });
  const localData = await browser.storage.local.get({ bypassSessions: [] });
  
  const domains = (syncData['domains'] as DomainRule[]) || [];
  const bypassSessions = (localData['bypassSessions'] as BypassSession[]) || [];
  
  const now = Date.now();
  const activeBypasses = bypassSessions.filter(b => b.expiresAt > now);
  const bypassMap = new Set(activeBypasses.map(b => b.domain));

  const addRules: chrome.declarativeNetRequest.Rule[] = [];
  let ruleId = 1;

  for (const d of domains) {
    if (bypassMap.has(d.domain)) continue;
    addRules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: `/block.html?domain=${encodeURIComponent(d.domain)}` } },
      condition: { urlFilter: `||${d.domain}^`, resourceTypes: ['main_frame', 'sub_frame'] }
    });
  }

  // Clear existing rules and add new ones
  // We use chrome API directly since webextension-polyfill typings for DNR can be tricky
  if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.updateDynamicRules) {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(r => r.id);
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  }
}

// ALARM LISTENER (for expiring bypasses)
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('bypass-expire-')) {
    await updateRules();
  }
});

// STORAGE LISTENER
browser.storage.onChanged.addListener((changes, area) => {
  if ((area === 'sync' && changes['domains']) || (area === 'local' && changes['bypassSessions'])) {
    updateRules().catch(console.error);
  }
});

// MESSAGE HANDLER
browser.runtime.onMessage.addListener((msg: unknown, sender: browser.Runtime.MessageSender) => {
  if (sender.id !== chrome.runtime.id) return;
  
  const message = msg as Record<string, unknown>;

  if (message['action'] === 'addDomain') {
    return (async () => {
      const domain = String(message['domain'] || '');
      if (!isValidDomain(domain)) return { success: false, reason: 'invalid_domain' };

      const data = await browser.storage.sync.get({ domains: [] });
      const domains = (data['domains'] as DomainRule[]) || [];
      if (domains.find(d => d.domain === domain)) {
        return { success: false, reason: 'already_exists' };
      }

      domains.push({
        domain,
        lifetime: Boolean(message['lifetime']),
        unlockDuration: Number(message['unlockDuration'] || 0)
      });
      await browser.storage.sync.set({ domains });
      await logEvent('USER', 'RULE_ADDED', `Enforcement rule added for ${domain}`, 'INFO');
      return { success: true };
    })();
  }

  if (message['action'] === 'removeDomain') {
    return (async () => {
      const domain = String(message['domain'] || '');
      if (!isValidDomain(domain)) return { success: false, error: 'invalid_domain' };
      const data = await browser.storage.sync.get({ domains: [] });
      const domains = ((data['domains'] as DomainRule[]) || []).filter(d => d.domain !== domain);
      await browser.storage.sync.set({ domains });
      await logEvent('USER', 'RULE_REMOVED', `Enforcement rule removed for ${domain}`, 'WARN');
      return { success: true };
    })();
  }

  if (message['action'] === 'addBypass') {
    return (async () => {
      const domain = String(message['domain'] || '');
      if (!isValidDomain(domain)) return { success: false, error: 'invalid_domain' };
      const durationMins = Math.min(Math.max(1, Number(message['durationMins']) || 15), 480);
      
      const data = await browser.storage.local.get({ bypassSessions: [] });
      const bypasses = (data['bypassSessions'] as BypassSession[]) || [];
      
      const expiresAt = Date.now() + durationMins * 60000;
      const filtered = bypasses.filter(b => b.domain !== domain && b.expiresAt > Date.now());
      filtered.push({ domain, expiresAt });
      
      await browser.storage.local.set({ bypassSessions: filtered });
      browser.alarms.create(`bypass-expire-${domain}-${Date.now()}`, { when: expiresAt });
      await logEvent('USER', 'BYPASS_GRANTED', `Bypass granted for ${domain} (${durationMins}m)`, 'INFO');
      
      return { success: true };
    })();
  }

  return Promise.resolve({ success: false, error: 'unknown_action' });
});

// INIT
browser.runtime.onInstalled.addListener(() => {
  updateRules().catch(console.error);
});
