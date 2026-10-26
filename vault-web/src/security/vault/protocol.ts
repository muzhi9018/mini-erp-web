import { normalizeTotp } from './totp';

export const PROFILE = 'ARGON2ID_V19_M65536_T3_P4_L32';
export const ITEM_SCHEMA_VERSION = 1;
export const LIFECYCLE_PROTOCOL_VERSION = 1;
export const encoder = new TextEncoder();
export const decoder = new TextDecoder('utf-8', { fatal: true });
export const context = (...fields: unknown[]) =>
  encoder.encode(JSON.stringify(['mini-erp-vault', 1, ...fields]));

export function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error('VAULT_INVALID_FORMAT');
}

export function object(value: unknown): Record<string, unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}

export function exact(value: Record<string, unknown>, keys: string[]) {
  assert(
    Object.keys(value).length === keys.length &&
      keys.every((key) => Object.hasOwn(value, key)),
  );
}

export function uuid(value: unknown): asserts value is string {
  assert(
    typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        value,
      ),
  );
}

export function version(value: unknown): asserts value is number {
  assert(typeof value === 'number' && Number.isSafeInteger(value) && value > 0);
}

export function encode(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export function decode(
  value: unknown,
  min: number,
  max = min,
): Uint8Array<ArrayBuffer> {
  assert(
    typeof value === 'string' &&
      value.length <= Math.ceil((max * 4) / 3) &&
      /^[A-Za-z0-9_-]+$/.test(value),
  );
  const binary = atob(
    value.replaceAll('-', '+').replaceAll('_', '/') +
      '='.repeat((4 - (value.length % 4)) % 4),
  );
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  assert(bytes.length >= min && bytes.length <= max && encode(bytes) === value);
  return bytes;
}

export function validateContext(value: Vault.Context) {
  assert(
    typeof value.ownerSubject === 'string' &&
      value.ownerSubject.length > 0 &&
      value.ownerSubject.length <= 128,
  );
  uuid(value.vaultId);
  version(value.keyEpoch);
}

export function validateBox(
  value: unknown,
  item = false,
): asserts value is Vault.Box {
  const box = object(value);
  exact(box, ['formatVersion', 'algorithm', 'iv', 'ciphertext']);
  assert(box.formatVersion === 1 && box.algorithm === 'A256GCM');
  decode(box.iv, 12);
  decode(box.ciphertext, item ? 17 : 48, item ? 16400 : 48);
}

export function validateSlots(value: unknown): asserts value is Vault.Slot[] {
  assert(Array.isArray(value) && value.length === 2);
  const types = new Set<string>();
  const ids = new Set<string>();
  for (const raw of value) {
    const slot = object(raw);
    exact(slot, [
      'slotId',
      'slotType',
      'keyId',
      'kdfProfile',
      'kdfSalt',
      'wrapSalt',
      'recoverySalt',
      'wrappedVmk',
    ]);
    uuid(slot.slotId);
    uuid(slot.keyId);
    validateBox(slot.wrappedVmk);
    assert(slot.slotType === 'NORMAL' || slot.slotType === 'RECOVERY');
    types.add(slot.slotType);
    ids.add(slot.slotId);
    if (slot.slotType === 'NORMAL') {
      assert(slot.kdfProfile === PROFILE && slot.recoverySalt === null);
      decode(slot.kdfSalt, 16);
      decode(slot.wrapSalt, 32);
    } else {
      assert(
        slot.kdfProfile === null &&
          slot.kdfSalt === null &&
          slot.wrapSalt === null,
      );
      decode(slot.recoverySalt, 32);
    }
  }
  assert(types.size === 2 && ids.size === 2);
}

export function canonicalSlots(slots: Vault.Slot[]) {
  return [...slots]
    .sort((a, b) => (a.slotType < b.slotType ? -1 : 1))
    .map((slot) => [
      slot.slotType,
      slot.slotId,
      slot.keyId,
      slot.wrappedVmk.formatVersion,
      slot.wrappedVmk.algorithm,
      slot.wrappedVmk.iv,
      slot.wrappedVmk.ciphertext,
      slot.kdfProfile,
      slot.kdfSalt,
      slot.wrapSalt,
      slot.recoverySalt,
    ]);
}

export function validateItem(value: unknown): asserts value is Vault.Item {
  const item = object(value);
  uuid(item.itemId);
  version(item.contentVersion);
  version(item.rowVersion);
  version(item.keyEpoch);
  validateBox(item.wrappedDek);
  validateBox(item.encryptedItem, true);
}

export function parsePlain(value: unknown): Vault.PlainRecord {
  const item = object(value);
  if (item.itemSchemaVersion !== ITEM_SCHEMA_VERSION)
    throw new Error('VAULT_CLIENT_UPGRADE_REQUIRED');
  if (item.itemType !== 'LOGIN' && item.itemType !== 'ACCOUNT_GROUP')
    throw new Error('VAULT_CLIENT_UPGRADE_REQUIRED');
  assert(encoder.encode(JSON.stringify(item)).length <= 16384);
  if (item.itemType === 'ACCOUNT_GROUP') {
    exact(item, [
      'itemSchemaVersion',
      'itemType',
      'name',
      'memberItemIds',
      ...(Object.hasOwn(item, 'defaultBoundEmail')
        ? ['defaultBoundEmail']
        : []),
    ]);
    assert(typeof item.name === 'string' && item.name.trim().length > 0);
    assert(
      item.defaultBoundEmail === undefined ||
        item.defaultBoundEmail === null ||
        typeof item.defaultBoundEmail === 'string',
    );
    assert(Array.isArray(item.memberItemIds));
    item.memberItemIds.forEach(uuid);
    assert(new Set(item.memberItemIds).size === item.memberItemIds.length);
    return item as Vault.PlainGroup;
  }
  const fields = ['title', 'website', 'username', 'password', 'notes', 'tags'];
  exact(item, [
    ...fields,
    'itemSchemaVersion',
    'itemType',
    'totp',
    'platform',
    'boundEmail',
    'emailItemId',
  ]);
  for (const key of fields.slice(0, 5)) assert(typeof item[key] === 'string');
  assert((item.title as string).trim().length > 0);
  assert(
    Array.isArray(item.tags) &&
      item.tags.length <= 20 &&
      item.tags.every((tag) => typeof tag === 'string'),
  );
  if (item.website) {
    const url = new URL(item.website as string);
    assert(
      ['https:', 'http:'].includes(url.protocol) &&
        !url.username &&
        !url.password,
    );
  }
  const normalized = {
    ...item,
    totp: item.totp === null ? null : normalizeTotp(item.totp),
  } as Vault.PlainItem;
  for (const field of ['platform', 'boundEmail', 'emailItemId'] as const)
    assert(normalized[field] === null || typeof normalized[field] === 'string');
  if (normalized.emailItemId !== null) {
    uuid(normalized.emailItemId);
  }
  assert(encoder.encode(JSON.stringify(normalized)).length <= 16384);
  return normalized;
}
export function validatePlain(
  value: unknown,
): asserts value is Vault.PlainRecord {
  parsePlain(value);
}
export function normalizeSlots(value: unknown): Vault.Slot[] {
  assert(Array.isArray(value));
  const slots = value.map((slot) => ({
    kdfProfile: null,
    kdfSalt: null,
    wrapSalt: null,
    recoverySalt: null,
    ...object(slot),
  }));
  validateSlots(slots);
  return slots;
}
export const canonicalItems = (items: Vault.Item[]) =>
  [...items]
    .sort((a, b) => (a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0))
    .map((item) => [
      item.itemId,
      item.contentVersion,
      item.keyEpoch,
      item.wrappedDek.formatVersion,
      item.wrappedDek.algorithm,
      item.wrappedDek.iv,
      item.wrappedDek.ciphertext,
      item.encryptedItem.formatVersion,
      item.encryptedItem.algorithm,
      item.encryptedItem.iv,
      item.encryptedItem.ciphertext,
    ]);
export async function digest(bytes: Uint8Array<ArrayBuffer>) {
  return encode(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

export function validatePassword(value: string) {
  assert(
    typeof value === 'string' &&
      Array.from(value).length >= 8 &&
      encoder.encode(value).length <= 1024,
  );
}

export function parseAccountFile(text: string): Vault.AccountFile {
  assert(encoder.encode(text).length <= 8192);
  const file = object(JSON.parse(text));
  exact(file, [
    'formatVersion',
    'vaultId',
    'ownerSubject',
    'accountKeyId',
    'accountKey',
  ]);
  assert(file.formatVersion === 1);
  uuid(file.vaultId);
  uuid(file.accountKeyId);
  assert(
    typeof file.ownerSubject === 'string' &&
      file.ownerSubject.length > 0 &&
      file.ownerSubject.length <= 128,
  );
  decode(file.accountKey, 32).fill(0);
  return file as Vault.AccountFile;
}

export function parseRecoveryFile(text: string): Vault.RecoveryFile {
  assert(encoder.encode(text).length <= 8192);
  const file = object(JSON.parse(text));
  exact(file, [
    'formatVersion',
    'vaultId',
    'ownerSubject',
    'recoveryKeyId',
    'recoveryKey',
  ]);
  assert(file.formatVersion === 1);
  uuid(file.vaultId);
  uuid(file.recoveryKeyId);
  assert(
    typeof file.ownerSubject === 'string' &&
      file.ownerSubject.length > 0 &&
      file.ownerSubject.length <= 128,
  );
  decode(file.recoveryKey, 32).fill(0);
  return file as Vault.RecoveryFile;
}

export function random(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generatePassword(length = 24, symbols = true) {
  assert(Number.isInteger(length) && length >= 16 && length <= 128);
  assert(typeof symbols === 'boolean');
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' +
    (symbols ? '!@#$%&*+-=?' : '');
  const threshold = 256 - (256 % alphabet.length);
  let result = '';
  while (result.length < length) {
    const bytes = random(64);
    for (const byte of bytes) {
      if (byte < threshold && result.length < length)
        result += alphabet[byte % alphabet.length];
    }
    bytes.fill(0);
  }
  return result;
}
