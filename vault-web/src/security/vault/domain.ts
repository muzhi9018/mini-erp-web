// Legacy entries can contain full HTTP URLs; site identity uses only the hostname.
export function normalizeDomain(value: string): string {
  const input = value.trim();
  if (
    !input ||
    /[\s\\]/.test(input) ||
    Array.from(input).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return '';
  const hasProtocol = /^https?:\/\//i.test(input);
  if (!hasProtocol && /[/:?#@]/.test(input)) return '';
  try {
    const url = new URL(hasProtocol ? input : `https://${input}`);
    if (url.username || url.password) return '';
    const domain = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      domain.length > 253 ||
      !domain.includes('.') ||
      /^[\d.]+$/.test(domain) ||
      !domain
        .split('.')
        .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    )
      return '';
    return domain;
  } catch {
    return '';
  }
}

export function isDomain(value: string): boolean {
  const input = value.trim().replace(/^https?:\/\//i, '');
  return !value.trim() || (!/[/:?#@]/.test(input) && !!normalizeDomain(value));
}
