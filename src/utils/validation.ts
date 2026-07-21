import browser from 'webextension-polyfill';
const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Returns a cleaned root domain string from any URL/domain input,
 * or null if the input is invalid / a restricted scheme.
 */
export function parseRootDomain(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();

  // Reject clearly dangerous schemes
  const lower = s.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:')       ||
    lower.startsWith('vbscript:')   ||
    lower.startsWith('chrome://')   ||
    lower.startsWith('chrome-extension://')
  ) return null;

  try {
    const url = new URL(s.startsWith('http') ? s : 'https://' + s);
    // NOTE: Redirect-param unwrapping (e.g. google.com/url?q=...) was removed.
    // It acted as an open-redirect helper: any query value that was a URL would
    // be returned as the "parsed" domain, allowing attacker-controlled redirects.
    const hostname = url.hostname.replace(/^www\./, '');
    return DOMAIN_RE.test(hostname) ? hostname : null;
  } catch (_) {
    // Try treating the raw string as a bare domain
    const parts = s.replace(/^www\./, '').split('/');
    const firstPart = parts[0] ?? '';
    const bare = firstPart.split('?')[0] ?? '';
    return DOMAIN_RE.test(bare) ? bare : null;
  }
}

/**
 * Returns true if the given string is a safe, blocked domain we manage.
 */
export async function isDomainManaged(domain: string): Promise<boolean> {
  try {
    const res = await browser.storage.sync.get({ domains: [] });
    const domains = (res.domains || []) as { domain: string }[];
    return domains.some(d => d.domain === domain);
  } catch (_) {
    return false;
  }
}
