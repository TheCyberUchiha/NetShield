/**
 * SHA-256 hash of a string, returned as a hex string.
 * CONTRACT: callers MUST enforce a minimum passkey length of 8 characters
 * before calling this function. 4-character passkeywords are brute-forceable
 * against the stored SHA-256 hash in milliseconds.
 */
export async function hashPasskey(passkey: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(passkey)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Returns strength score (0-4), label, and visual representation color.
 */
export function passkeyStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: 'Too short', color: '#ef4444' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e'];
  const label = labels[score] ?? 'Very Weak';
  const color = colors[score] ?? '#ef4444';
  return { score, label, color };
}
