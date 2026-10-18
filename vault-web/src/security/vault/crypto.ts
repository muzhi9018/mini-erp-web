import { argon2id } from 'hash-wasm';
import {
  assert,
  context,
  decode,
  encode,
  encoder,
  PROFILE,
  parseAccountFile,
  parseRecoveryFile,
  random,
  validateBox,
  validatePassword,
  validateSlots,
} from './protocol';

export const aesKey = (raw: Uint8Array<ArrayBuffer>) =>
  crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function seal(
  key: CryptoKey,
  raw: Uint8Array<ArrayBuffer>,
  aad: Uint8Array<ArrayBuffer>,
): Promise<Vault.Box> {
  const iv = random(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
    key,
    raw,
  );
  return {
    formatVersion: 1,
    algorithm: 'A256GCM',
    iv: encode(iv),
    ciphertext: encode(new Uint8Array(ciphertext)),
  };
}

export async function open(
  key: CryptoKey,
  box: Vault.Box,
  aad: Uint8Array<ArrayBuffer>,
  item = false,
) {
  validateBox(box, item);
  return new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: decode(box.iv, 12),
        additionalData: aad,
        tagLength: 128,
      },
      key,
      decode(box.ciphertext, item ? 17 : 48, item ? 16400 : 48),
    ),
  );
}

export async function hkdf(
  raw: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
) {
  const key = await crypto.subtle.importKey('raw', raw, 'HKDF', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function derive(
  password: string,
  accountKey: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
) {
  validatePassword(password);
  assert(accountKey.length === 32 && salt.length === 16);
  const bytes = encoder.encode(password);
  try {
    return await argon2id({
      password: bytes,
      secret: accountKey,
      salt,
      parallelism: 4,
      iterations: 3,
      memorySize: 65536,
      hashLength: 32,
      outputType: 'binary',
    });
  } finally {
    bytes.fill(0);
  }
}

const identity = (ctx: Vault.Context) => [
  ctx.ownerSubject,
  ctx.vaultId,
  ctx.keyEpoch,
];
export function slotAAD(ctx: Vault.Context, slot: Vault.Slot) {
  return slot.slotType === 'NORMAL'
    ? context(
        'normal-vmk',
        ...identity(ctx),
        slot.slotId,
        slot.keyId,
        slot.kdfProfile,
        slot.kdfSalt,
        slot.wrapSalt,
      )
    : context(
        'recovery-vmk',
        ...identity(ctx),
        slot.slotId,
        slot.keyId,
        slot.recoverySalt,
      );
}

export async function normalKey(
  ctx: Vault.Context,
  slot: Vault.Slot,
  password: string,
  accountKey: Uint8Array<ArrayBuffer>,
) {
  assert(slot.kdfProfile === PROFILE);
  const p = await derive(password, accountKey, decode(slot.kdfSalt, 16));
  const material = new Uint8Array(p);
  try {
    return await hkdf(
      material,
      decode(slot.wrapSalt, 32),
      context('normal-wrap', ...identity(ctx)),
    );
  } finally {
    p.fill(0);
    material.fill(0);
  }
}

export async function makeSlots(
  ctx: Vault.Context,
  password: string,
  account: Vault.AccountFile,
  recovery: Vault.RecoveryFile,
  vmk: Uint8Array<ArrayBuffer>,
) {
  const normal: Vault.Slot = {
    slotId: crypto.randomUUID(),
    slotType: 'NORMAL',
    keyId: account.accountKeyId,
    kdfProfile: PROFILE,
    kdfSalt: encode(random(16)),
    wrapSalt: encode(random(32)),
    recoverySalt: null,
    wrappedVmk: {} as Vault.Box,
  };
  const rescue: Vault.Slot = {
    slotId: crypto.randomUUID(),
    slotType: 'RECOVERY',
    keyId: recovery.recoveryKeyId,
    kdfProfile: null,
    kdfSalt: null,
    wrapSalt: null,
    recoverySalt: encode(random(32)),
    wrappedVmk: {} as Vault.Box,
  };
  const ak = decode(account.accountKey, 32);
  const rk = decode(recovery.recoveryKey, 32);
  try {
    const kek = await normalKey(ctx, normal, password, ak);
    const rkek = await hkdf(
      rk,
      decode(rescue.recoverySalt, 32),
      context('recovery-wrap', ...identity(ctx)),
    );
    normal.wrappedVmk = await seal(kek, vmk, slotAAD(ctx, normal));
    rescue.wrappedVmk = await seal(rkek, vmk, slotAAD(ctx, rescue));
    for (const [key, slot] of [
      [kek, normal],
      [rkek, rescue],
    ] as const) {
      const test = await open(key, slot.wrappedVmk, slotAAD(ctx, slot));
      try {
        assert(test.every((byte, index) => byte === vmk[index]));
      } finally {
        test.fill(0);
      }
    }
    return [normal, rescue];
  } finally {
    ak.fill(0);
    rk.fill(0);
  }
}

export const itemAAD = (
  ctx: Vault.Context,
  item: Pick<Vault.Item, 'itemId' | 'contentVersion'>,
  purpose: 'item-key' | 'item-data',
) =>
  purpose === 'item-key'
    ? context(
        purpose,
        ctx.ownerSubject,
        ctx.vaultId,
        item.itemId,
        item.contentVersion,
        ctx.keyEpoch,
      )
    : context(
        purpose,
        ctx.ownerSubject,
        ctx.vaultId,
        item.itemId,
        item.contentVersion,
      );

export async function unlockMaterial(
  ctx: Vault.Context,
  slots: Vault.Slot[],
  fileText: string,
  password?: string,
): Promise<Uint8Array<ArrayBuffer>> {
  validateSlots(slots);
  const recovery = password === undefined;
  const file = recovery
    ? parseRecoveryFile(fileText)
    : parseAccountFile(fileText);
  const keyId = 'accountKeyId' in file ? file.accountKeyId : file.recoveryKeyId;
  const slot = slots.find(
    (entry) => entry.slotType === (recovery ? 'RECOVERY' : 'NORMAL'),
  );
  assert(
    slot &&
      file.ownerSubject === ctx.ownerSubject &&
      file.vaultId === ctx.vaultId &&
      keyId === slot.keyId,
  );
  const raw = decode(
    'accountKey' in file ? file.accountKey : file.recoveryKey,
    32,
  );
  try {
    const kek = recovery
      ? await hkdf(
          raw,
          decode(slot.recoverySalt, 32),
          context('recovery-wrap', ...identity(ctx)),
        )
      : await normalKey(ctx, slot, password as string, raw);
    return await open(kek, slot.wrappedVmk, slotAAD(ctx, slot));
  } finally {
    raw.fill(0);
  }
}
