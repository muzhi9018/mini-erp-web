import {
  aesKey,
  itemAAD,
  makeSlots,
  normalKey,
  open,
  seal,
  slotAAD,
} from './crypto';
import {
  assert,
  canonicalSlots,
  decode,
  decoder,
  encode,
  encoder,
  generatePassword,
  parseAccountFile,
  parseRecoveryFile,
  random,
  validateContext,
  validateItem,
  validatePlain,
  validateSlots,
  version,
} from './protocol';

/** Only instantiated inside the dedicated worker (and isolated crypto tests). */
export class VaultEngine {
  private ctx?: Vault.Context;
  private vmk?: CryptoKey;
  private generation?: number;
  private draft?: Vault.PreparedSetup;
  private verified = false;
  private index = new Map<
    string,
    { summary: Vault.Summary; cipher: Vault.Item }
  >();

  clear() {
    this.ctx = undefined;
    this.vmk = undefined;
    this.generation = undefined;
    this.draft = undefined;
    this.verified = false;
    this.index.clear();
  }

  async prepare(
    ownerSubject: string,
    password: string,
    existingVaultId?: string,
  ): Promise<Vault.PreparedSetup> {
    this.clear();
    const vaultId = existingVaultId || crypto.randomUUID();
    const ctx = { ownerSubject, vaultId, keyEpoch: 1 };
    validateContext(ctx);
    const account: Vault.AccountFile = {
      formatVersion: 1,
      ownerSubject,
      vaultId,
      accountKeyId: crypto.randomUUID(),
      accountKey: encode(random(32)),
    };
    const recovery: Vault.RecoveryFile = {
      formatVersion: 1,
      ownerSubject,
      vaultId,
      recoveryKeyId: crypto.randomUUID(),
      recoveryKey: encode(random(32)),
    };
    const raw = random(32);
    try {
      const keySlots = await makeSlots(ctx, password, account, recovery, raw);
      this.vmk = await aesKey(raw);
      this.ctx = ctx;
      this.generation = 1;
      this.draft = {
        vaultId,
        keySlots,
        accountFile: JSON.stringify(account),
        recoveryFile: JSON.stringify(recovery),
      };
      return this.draft;
    } finally {
      raw.fill(0);
    }
  }

  verifyFiles(accountText: string, recoveryText: string) {
    this.verified = false;
    assert(this.draft);
    const account = parseAccountFile(accountText);
    const recovery = parseRecoveryFile(recoveryText);
    const expectedAccount = parseAccountFile(this.draft.accountFile);
    const expectedRecovery = parseRecoveryFile(this.draft.recoveryFile);
    for (const key of Object.keys(
      expectedAccount,
    ) as (keyof Vault.AccountFile)[])
      assert(account[key] === expectedAccount[key]);
    for (const key of Object.keys(
      expectedRecovery,
    ) as (keyof Vault.RecoveryFile)[])
      assert(recovery[key] === expectedRecovery[key]);
    this.verified = true;
    return true;
  }

  setupPayload() {
    assert(this.draft && this.verified);
    return { vaultId: this.draft.vaultId, keySlots: this.draft.keySlots };
  }

  finishSetup(meta: Vault.Meta, ownerSubject: string) {
    assert(
      this.draft &&
        this.ctx &&
        this.verified &&
        ownerSubject === this.ctx.ownerSubject,
    );
    assert(
      meta.initialized &&
        meta.vaultId === this.ctx.vaultId &&
        meta.keyEpoch === 1,
    );
    version(meta.generation);
    validateSlots(meta.keySlots);
    assert(
      JSON.stringify(canonicalSlots(meta.keySlots)) ===
        JSON.stringify(canonicalSlots(this.draft.keySlots)),
    );
    this.draft = undefined;
    this.verified = false;
    this.generation = meta.generation;
    return true;
  }

  async unlock(
    ownerSubject: string,
    meta: Vault.Meta,
    accountText: string,
    password: string,
  ) {
    this.clear();
    assert(meta.initialized && meta.vaultId && meta.keyEpoch);
    version(meta.generation);
    const ctx = {
      ownerSubject,
      vaultId: meta.vaultId,
      keyEpoch: meta.keyEpoch,
    };
    validateContext(ctx);
    validateSlots(meta.keySlots);
    const file = parseAccountFile(accountText);
    const slot = meta.keySlots.find((entry) => entry.slotType === 'NORMAL');
    assert(
      slot &&
        file.ownerSubject === ownerSubject &&
        file.vaultId === ctx.vaultId &&
        file.accountKeyId === slot.keyId,
    );
    const ak = decode(file.accountKey, 32);
    try {
      const kek = await normalKey(ctx, slot, password, ak);
      const raw = await open(kek, slot.wrappedVmk, slotAAD(ctx, slot));
      try {
        this.vmk = await aesKey(raw);
      } finally {
        raw.fill(0);
      }
      this.ctx = ctx;
      this.generation = meta.generation;
      return true;
    } finally {
      ak.fill(0);
    }
  }

  resetIndex() {
    this.index.clear();
    return true;
  }

  private async decrypt(item: Vault.Item): Promise<Vault.PlainItem> {
    assert(this.ctx && this.vmk);
    validateItem(item);
    assert(item.keyEpoch === this.ctx.keyEpoch);
    const raw = await open(
      this.vmk,
      item.wrappedDek,
      itemAAD(this.ctx, item, 'item-key'),
    );
    try {
      const key = await aesKey(raw);
      const plain = await open(
        key,
        item.encryptedItem,
        itemAAD(this.ctx, item, 'item-data'),
        true,
      );
      try {
        const value: unknown = JSON.parse(decoder.decode(plain));
        validatePlain(value);
        return value;
      } finally {
        plain.fill(0);
      }
    } finally {
      raw.fill(0);
    }
  }

  async ingest(items: Vault.Item[]) {
    assert(
      this.vmk &&
        Array.isArray(items) &&
        items.length <= 100 &&
        this.index.size + items.length <= 2000,
    );
    try {
      for (const item of items) {
        assert(!this.index.has(item.itemId));
        const plain = await this.decrypt(item);
        const summary: Vault.Summary = {
          itemId: item.itemId,
          contentVersion: item.contentVersion,
          rowVersion: item.rowVersion,
          title: plain.title,
          username: plain.username,
          website: plain.website,
          tags: plain.tags,
        };
        this.index.set(item.itemId, { summary, cipher: item });
      }
      return true;
    } catch {
      this.index.clear();
      throw new Error('VAULT_DECRYPT_FAILED');
    }
  }

  search(query: string): Vault.Summary[] {
    assert(this.vmk && typeof query === 'string' && query.length <= 1024);
    const needle = query.toLocaleLowerCase();
    return Array.from(this.index.values(), ({ summary }) => summary).filter(
      (item) =>
        [item.title, item.username, item.website, ...item.tags].some((text) =>
          text.toLocaleLowerCase().includes(needle),
        ),
    );
  }

  async reveal(itemId: string) {
    const entry = this.index.get(itemId);
    assert(entry && this.vmk);
    return this.decrypt(entry.cipher);
  }

  async encrypt(
    plain: Vault.PlainItem,
    itemId?: string,
  ): Promise<Vault.ItemWrite> {
    assert(this.ctx && this.vmk && this.generation);
    validatePlain(plain);
    const previous = itemId ? this.index.get(itemId) : undefined;
    assert(itemId ? previous : this.index.size < 2000);
    const identity = {
      itemId: itemId || crypto.randomUUID(),
      contentVersion: previous ? previous.cipher.contentVersion + 1 : 1,
    };
    version(identity.contentVersion);
    const raw = random(32);
    const bytes = encoder.encode(JSON.stringify(plain));
    try {
      const dek = await aesKey(raw);
      return {
        ...identity,
        keyEpoch: this.ctx.keyEpoch,
        generation: this.generation,
        expectedRowVersion: previous?.cipher.rowVersion,
        idempotencyKey: crypto.randomUUID(),
        wrappedDek: await seal(
          this.vmk,
          raw,
          itemAAD(this.ctx, identity, 'item-key'),
        ),
        encryptedItem: await seal(
          dek,
          bytes,
          itemAAD(this.ctx, identity, 'item-data'),
        ),
      };
    } finally {
      raw.fill(0);
      bytes.fill(0);
    }
  }

  generate() {
    assert(this.vmk);
    return generatePassword();
  }
}
