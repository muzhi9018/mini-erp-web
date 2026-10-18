import { assert, exact, object } from './protocol';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export class TotpImportError extends Error {
  constructor(public readonly reason: 'uri' | 'issuer' | 'parameters') {
    super('VAULT_INVALID_FORMAT');
  }
}
export function base32(value: string): Uint8Array<ArrayBuffer> {
  assert(typeof value === 'string' && value.length <= 256);
  const normalized = value.replaceAll(' ', '').toUpperCase();
  assert(/^[A-Z2-7]+={0,6}$/.test(normalized));
  const bare = normalized.replace(/=+$/, '');
  const padding = (8 - (bare.length % 8)) % 8;
  assert([0, 2, 4, 5, 7].includes(bare.length % 8));
  assert(normalized === bare || normalized === bare + '='.repeat(padding));
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];
  for (const char of bare) {
    buffer = (buffer << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
      buffer &= (1 << bits) - 1;
    }
  }
  assert(buffer === 0 && bytes.length >= 16 && bytes.length <= 128);
  return Uint8Array.from(bytes);
}
export function normalizeTotp(value: unknown): Vault.Totp {
  const input = object(value);
  exact(input, [
    'secretBase32',
    'issuer',
    'accountName',
    'algorithm',
    'digits',
    'period',
  ]);
  assert(typeof input.secretBase32 === 'string');
  base32(input.secretBase32).fill(0);
  assert(typeof input.issuer === 'string' && input.issuer.length <= 256);
  assert(
    typeof input.accountName === 'string' && input.accountName.length <= 256,
  );
  assert(['SHA1', 'SHA256', 'SHA512'].includes(input.algorithm as string));
  assert(input.digits === 6 || input.digits === 8);
  assert(input.period === 30 || input.period === 60);
  return {
    ...input,
    secretBase32: input.secretBase32
      .replaceAll(' ', '')
      .replace(/=+$/, '')
      .toUpperCase(),
  } as Vault.Totp;
}
export function parseTotpURI(text: string): Vault.Totp {
  assert(
    typeof text === 'string' && text.length <= 4096 && !text.includes('#'),
  );
  if (!/^otpauth:\/\/totp\//.test(text)) throw new TotpImportError('uri');
  assert(!/%(?![0-9a-f]{2})/i.test(text) && !/[\r\n\t]/.test(text));
  const uri = new URL(text);
  assert(
    uri.protocol === 'otpauth:' &&
      uri.hostname === 'totp' &&
      !uri.port &&
      !uri.username &&
      !uri.password,
  );
  decodeURIComponent(uri.search);
  const allowed = ['secret', 'issuer', 'algorithm', 'digits', 'period'];
  for (const key of uri.searchParams.keys()) {
    if (!allowed.includes(key)) throw new TotpImportError('parameters');
    assert(uri.searchParams.getAll(key).length === 1);
  }
  const label = decodeURIComponent(uri.pathname.slice(1));
  assert(label.length > 0 && !label.includes('/') && !label.includes('?'));
  const parts = label.split(':');
  assert(parts.length <= 2 && parts.every((part) => part.trim().length > 0));
  const labelIssuer = parts.length === 2 ? parts[0].trim() : '';
  const issuer = uri.searchParams.get('issuer') ?? labelIssuer;
  if (labelIssuer && labelIssuer !== issuer)
    throw new TotpImportError('issuer');
  const digits = uri.searchParams.get('digits') ?? '6';
  const period = uri.searchParams.get('period') ?? '30';
  if (
    !['6', '8'].includes(digits) ||
    !['30', '60'].includes(period) ||
    !['SHA1', 'SHA256', 'SHA512'].includes(
      uri.searchParams.get('algorithm') ?? 'SHA1',
    )
  )
    throw new TotpImportError('parameters');
  return normalizeTotp({
    secretBase32: uri.searchParams.get('secret'),
    issuer,
    accountName: parts.at(-1)?.trim(),
    algorithm: uri.searchParams.get('algorithm') ?? 'SHA1',
    digits: Number(digits),
    period: Number(period),
  });
}
/** Sensitive: called only by the explicit, recently authenticated export command. */
export function encodeTotpURI(value: Vault.Totp): string {
  const config = normalizeTotp(value);
  assert(config.accountName.trim().length > 0);
  assert(
    ![config.issuer, config.accountName].some(
      (part) =>
        /[:/?]/.test(part) ||
        Array.from(part).some((char) => char.charCodeAt(0) < 32),
    ),
  );
  const label = config.issuer
    ? `${encodeURIComponent(config.issuer)}:${encodeURIComponent(config.accountName)}`
    : encodeURIComponent(config.accountName);
  const query = new URLSearchParams({
    secret: config.secretBase32,
    ...(config.issuer ? { issuer: config.issuer } : {}),
    algorithm: config.algorithm,
    digits: String(config.digits),
    period: String(config.period),
  });
  const uri = `otpauth://totp/${label}?${query}`;
  if (uri.length > 2000) throw new Error('VAULT_QR_TOO_LONG');
  return uri;
}
export async function totpCode(
  config: Vault.Totp,
  now = Date.now(),
): Promise<Vault.TotpCode> {
  const normalized = normalizeTotp(config);
  assert(Number.isSafeInteger(now) && now >= 0);
  const step = normalized.period * 1000;
  const counter = Math.floor(now / step);
  const bytes = base32(normalized.secretBase32);
  const time = new Uint8Array(8);
  new DataView(time.buffer).setBigUint64(0, BigInt(counter));
  try {
    const hash = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' }[
      normalized.algorithm
    ];
    const key = await crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'HMAC', hash },
      false,
      ['sign'],
    );
    const signature = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, time),
    );
    try {
      const offset = signature[signature.length - 1] & 15;
      const binary =
        new DataView(signature.buffer).getUint32(offset) & 0x7fffffff;
      return {
        code: String(binary % 10 ** normalized.digits).padStart(
          normalized.digits,
          '0',
        ),
        validFrom: counter * step,
        validUntil: (counter + 1) * step,
      };
    } finally {
      signature.fill(0);
    }
  } finally {
    bytes.fill(0);
    time.fill(0);
  }
}
