import {
  assert,
  canonicalItems,
  canonicalSlots,
  context,
  decode,
  digest,
  encode,
  encoder,
  exact,
  normalizeSlots,
  object,
  uuid,
  validateContext,
  validateItem,
  version,
} from './protocol';

export const MAX_BACKUP_BYTES = 48 * 1024 * 1024;
export function validateSnapshot(value: Vault.Snapshot): Vault.Snapshot {
  assert(value.initialized === true && value.status !== 'RESTORING');
  validateContext({
    ownerSubject: value.ownerSubject,
    vaultId: value.vaultId as string,
    keyEpoch: value.keyEpoch as number,
  });
  version(value.generation);
  version(value.metaRevision);
  version(value.collectionRevision);
  const keySlots = normalizeSlots(value.keySlots);
  assert(Array.isArray(value.items) && value.items.length <= 2000);
  const seen = new Set<string>();
  for (const item of value.items) {
    validateItem(item);
    assert(!(item as Vault.RotationItem).deleted);
    assert(item.keyEpoch === value.keyEpoch && !seen.has(item.itemId));
    seen.add(item.itemId);
  }
  return { ...value, keySlots };
}
export function parseBackup(text: string): Vault.Backup {
  assert(
    typeof text === 'string' &&
      text.length <= MAX_BACKUP_BYTES &&
      encoder.encode(text).length <= MAX_BACKUP_BYTES,
  );
  const value = object(JSON.parse(text));
  exact(value, [
    'formatVersion',
    'backupId',
    'backupSalt',
    'snapshot',
    'manifest',
    'authentication',
  ]);
  assert(value.formatVersion === 1);
  uuid(value.backupId);
  decode(value.backupSalt, 32).fill(0);
  decode(value.authentication, 32).fill(0);
  assert(typeof value.manifest === 'string' && value.manifest.length <= 400000);
  const snapshot = validateSnapshot(object(value.snapshot) as Vault.Snapshot);
  return { ...value, snapshot } as Vault.Backup;
}
export async function backupManifest(
  backup: Pick<Vault.Backup, 'backupId' | 'snapshot'>,
) {
  const { snapshot: s } = backup;
  const items = canonicalItems(s.items);
  const entries = await Promise.all(
    items.map(async (item) => [
      item[0],
      item[1],
      item[2],
      await digest(encoder.encode(JSON.stringify(item))),
    ]),
  );
  return JSON.stringify([
    'mini-erp-vault',
    1,
    'backup-manifest',
    backup.backupId,
    s.ownerSubject,
    s.vaultId,
    s.generation,
    s.keyEpoch,
    s.metaRevision,
    s.collectionRevision,
    items.length,
    await digest(
      encoder.encode(
        JSON.stringify(canonicalSlots(s.keySlots as Vault.Slot[])),
      ),
    ),
    entries,
  ]);
}
export async function backupAuth(
  root: CryptoKey,
  backup: Pick<
    Vault.Backup,
    'backupSalt' | 'backupId' | 'snapshot' | 'manifest'
  >,
) {
  const key = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: decode(backup.backupSalt, 32),
      info: context(
        'backup-auth',
        backup.snapshot.ownerSubject,
        backup.snapshot.vaultId,
        backup.backupId,
      ),
    },
    root,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify'],
  );
  return { key, bytes: encoder.encode(backup.manifest) };
}
export async function signBackup(root: CryptoKey, backup: Vault.Backup) {
  const { key, bytes } = await backupAuth(root, backup);
  return encode(new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes)));
}
export async function verifyBackupAuth(root: CryptoKey, backup: Vault.Backup) {
  assert(backup.manifest === (await backupManifest(backup)));
  const { key, bytes } = await backupAuth(root, backup);
  assert(
    await crypto.subtle.verify(
      'HMAC',
      key,
      decode(backup.authentication, 32),
      bytes,
    ),
  );
}
