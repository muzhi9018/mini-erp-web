import {
  backupManifest,
  parseBackup,
  signBackup,
  validateSnapshot,
  verifyBackupAuth,
} from './backup';
import {
  aesKey,
  itemAAD,
  makeSlots,
  normalKey,
  open,
  seal,
  slotAAD,
  unlockMaterial,
} from './crypto';
import {
  assert,
  canonicalItems,
  canonicalSlots,
  context,
  decode,
  decoder,
  digest,
  encode,
  encoder,
  generatePassword,
  normalizeSlots,
  PROFILE,
  parseAccountFile,
  parsePlain,
  parseRecoveryFile,
  random,
  uuid,
  validateContext,
  validateItem,
  validateSlots,
  version,
} from './protocol';
import {
  encodeTotpURI,
  normalizeTotp,
  totpCode,
  totpTransferLabels,
} from './totp';

/** Only instantiated inside the dedicated worker (and isolated crypto tests). */
export class VaultEngine {
  private ctx?: Vault.Context;
  private vmk?: CryptoKey;
  private generation?: number;
  private backupRoot?: CryptoKey;
  private sourceSnapshot?: Vault.Snapshot;
  private transition?: {
    target: VaultEngine;
    restore: boolean;
    task?: Vault.Rotation;
    encrypted: Map<string, Vault.Item>;
  };

  private draft?: Vault.PreparedSetup;
  private verified = false;
  private index = new Map<
    string,
    { summary: Vault.Summary | Vault.GroupSummary; cipher: Vault.Item }
  >();

  private collectionRevision?: number;

  clear() {
    this.transition?.target.clear();
    this.transition = undefined;
    this.sourceSnapshot = undefined;
    this.backupRoot = undefined;
    this.ctx = undefined;
    this.vmk = undefined;
    this.generation = undefined;
    this.draft = undefined;
    this.verified = false;
    this.index.clear();
    this.collectionRevision = undefined;
  }

  async prepare(
    ownerSubject: string,
    password: string,
    existingVaultId?: string,
    keyEpoch = 1,
  ): Promise<Vault.PreparedSetup> {
    this.clear();
    const vaultId = existingVaultId || crypto.randomUUID();
    const ctx = { ownerSubject, vaultId, keyEpoch };
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
      await this.material(raw);
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
    const raw = await unlockMaterial(ctx, meta.keySlots, accountText, password);
    try {
      await this.material(raw);
    } finally {
      raw.fill(0);
    }
    this.ctx = ctx;
    this.generation = meta.generation;
    return true;
  }

  private async material(raw: Uint8Array<ArrayBuffer>) {
    this.vmk = await aesKey(raw);
    this.backupRoot = await crypto.subtle.importKey('raw', raw, 'HKDF', false, [
      'deriveKey',
    ]);
  }
  async unlockRecovery(
    ownerSubject: string,
    meta: Vault.Meta,
    recovery: string,
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
    const raw = await unlockMaterial(
      ctx,
      normalizeSlots(meta.keySlots),
      recovery,
    );
    try {
      await this.material(raw);
    } finally {
      raw.fill(0);
    }
    this.ctx = ctx;
    this.generation = meta.generation;
    return true;
  }

  resetIndex() {
    this.index.clear();
    this.collectionRevision = undefined;
    return true;
  }

  private async decryptRaw(item: Vault.Item): Promise<Uint8Array<ArrayBuffer>> {
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
      return await open(
        key,
        item.encryptedItem,
        itemAAD(this.ctx, item, 'item-data'),
        true,
      );
    } finally {
      raw.fill(0);
    }
  }

  private async decrypt(item: Vault.Item): Promise<Vault.PlainRecord> {
    const bytes = await this.decryptRaw(item);
    try {
      return parsePlain(JSON.parse(decoder.decode(bytes)));
    } finally {
      bytes.fill(0);
    }
  }

  async ingest(items: Vault.Item[]) {
    assert(
      this.vmk &&
        Array.isArray(items) &&
        items.length <= 100 &&
        this.index.size + items.length <= 2000,
    );
    this.collectionRevision = undefined;
    try {
      for (const item of items) {
        assert(!this.index.has(item.itemId));
        const plain = await this.decrypt(item);
        const summary: Vault.Summary | Vault.GroupSummary =
          plain.itemType === 'ACCOUNT_GROUP'
            ? {
                ...plain,
                itemId: item.itemId,
                contentVersion: item.contentVersion,
                rowVersion: item.rowVersion,
              }
            : {
                itemType: 'LOGIN',
                platform: plain.platform,
                boundEmail: plain.boundEmail,
                emailItemId: plain.emailItemId,
                itemId: item.itemId,
                contentVersion: item.contentVersion,
                rowVersion: item.rowVersion,
                title: plain.title,
                username: plain.username,
                website: plain.website,
                tags: plain.tags,
                hasTotp: plain.totp !== null,
                hasPassword: plain.password.length > 0,
                totpInfo: plain.totp
                  ? {
                      issuer: plain.totp.issuer,
                      accountName: plain.totp.accountName,
                      algorithm: plain.totp.algorithm,
                      digits: plain.totp.digits,
                      period: plain.totp.period,
                    }
                  : null,
              };
        this.index.set(item.itemId, { summary, cipher: item });
      }
      return true;
    } catch (error) {
      this.index.clear();
      this.collectionRevision = undefined;
      if (
        error instanceof Error &&
        error.message === 'VAULT_CLIENT_UPGRADE_REQUIRED'
      )
        throw error;
      throw new Error('VAULT_DECRYPT_FAILED');
    }
  }

  completeIndex(meta: Vault.Meta, count: number) {
    assert(
      meta.vaultId === this.ctx?.vaultId &&
        meta.generation === this.generation &&
        meta.keyEpoch === this.ctx?.keyEpoch,
    );
    assert(count === this.index.size && count <= 2000);
    version(meta.collectionRevision);
    this.collectionRevision = meta.collectionRevision;
    return true;
  }

  groups(): Vault.GroupSummary[] {
    assert(this.vmk);
    return Array.from(this.index.values(), ({ summary }) => summary).filter(
      (item): item is Vault.GroupSummary => item.itemType === 'ACCOUNT_GROUP',
    );
  }

  search(query: string): Vault.Summary[] {
    assert(this.vmk && typeof query === 'string' && query.length <= 1024);
    const needle = query.toLocaleLowerCase();
    const logins = Array.from(
      this.index.values(),
      ({ summary }) => summary,
    ).filter((item): item is Vault.Summary => item.itemType === 'LOGIN');
    const matched = new Set(
      logins
        .filter((item) =>
          [
            item.title,
            item.username,
            item.website,
            item.platform || '',
            ...item.tags,
          ].some((text) => text.toLocaleLowerCase().includes(needle)),
        )
        .map((item) => item.itemId),
    );
    for (const group of this.groups()) {
      if (
        group.name.toLocaleLowerCase().includes(needle) ||
        group.memberItemIds.some((id) => matched.has(id))
      ) {
        for (const id of group.memberItemIds) matched.add(id);
      }
    }
    return logins.filter((item) => matched.has(item.itemId));
  }

  private async login(item: Vault.Item): Promise<Vault.PlainItem> {
    const plain = await this.decrypt(item);
    assert(plain.itemType === 'LOGIN');
    return plain;
  }

  async reveal(itemId: string) {
    const entry = this.index.get(itemId);
    assert(entry && this.vmk);
    return { ...(await this.login(entry.cipher)), totp: null };
  }

  async encrypt(
    plain: Vault.PlainRecord,
    itemId?: string,
    preserveTotp = false,
    newItemId?: string,
  ): Promise<Vault.ItemWrite> {
    assert(this.ctx && this.vmk && this.generation);
    plain = parsePlain(plain);
    const previous = itemId ? this.index.get(itemId) : undefined;
    assert(itemId ? previous : this.index.size < 2000);
    if (preserveTotp) {
      assert(previous);
      assert(plain.itemType === 'LOGIN');
      plain.totp = (await this.login(previous.cipher)).totp;
    }
    plain = parsePlain(plain);
    const identity = {
      itemId: itemId || newItemId || crypto.randomUUID(),
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

  private batchEnvelope(
    changes: Vault.BatchChange[],
    collectionRevision: number,
  ): Vault.ItemBatch {
    if (
      this.collectionRevision === undefined ||
      this.collectionRevision !== collectionRevision
    )
      throw new Error('VAULT_INDEX_INCOMPLETE');
    assert(this.ctx && this.vmk && this.generation && changes.length <= 100);
    return {
      generation: this.generation,
      keyEpoch: this.ctx.keyEpoch,
      expectedCollectionRevision: collectionRevision,
      changes,
      idempotencyKey: crypto.randomUUID(),
    };
  }

  async batch(
    changes: Vault.RecordChange[],
    collectionRevision: number,
  ): Promise<Vault.ItemBatch> {
    if (
      this.collectionRevision === undefined ||
      this.collectionRevision !== collectionRevision
    )
      throw new Error('VAULT_INDEX_INCOMPLETE');
    if (!Array.isArray(changes) || !changes.length || changes.length > 100)
      throw new Error('VAULT_BATCH_TOO_LARGE');
    const normalized = changes.map((change) => {
      if (
        change.plain?.itemType === 'ACCOUNT_GROUP' &&
        encoder.encode(JSON.stringify(change.plain)).length > 16384
      )
        throw new Error('VAULT_GROUP_TOO_LARGE');
      return {
        ...change,
        itemId: change.itemId || crypto.randomUUID(),
        plain: parsePlain(change.plain),
      };
    });
    assert(
      new Set(normalized.map((change) => change.itemId)).size ===
        normalized.length,
    );
    assert(
      this.index.size +
        normalized.filter((change) => !this.index.has(change.itemId)).length <=
        2000,
    );
    const types = new Map(
      Array.from(this.index, ([id, entry]) => [id, entry.summary.itemType]),
    );
    for (const change of normalized) {
      uuid(change.itemId);
      const previous = types.get(change.itemId);
      assert(!previous || previous === change.plain.itemType);
      types.set(change.itemId, change.plain.itemType);
    }
    for (const change of normalized) {
      const plain = change.plain;
      if (plain.itemType !== 'ACCOUNT_GROUP') continue;
      const previous = this.index.get(change.itemId)?.summary;
      for (const id of plain.memberItemIds) {
        const retained =
          previous?.itemType === 'ACCOUNT_GROUP'
            ? previous.memberItemIds.includes(id)
            : false;
        if (
          id === change.itemId ||
          (types.get(id) !== 'LOGIN' && !(retained && !types.has(id)))
        )
          throw new Error('VAULT_RELATION_INVALID');
      }
    }
    const encrypted: Vault.BatchChange[] = [];
    for (const change of normalized) {
      const exists = this.index.has(change.itemId);
      const value = await this.encrypt(
        change.plain,
        exists ? change.itemId : undefined,
        change.preserveTotp,
        exists ? undefined : change.itemId,
      );
      encrypted.push({
        action: exists ? 'UPDATE' : 'CREATE',
        itemId: value.itemId,
        expectedRowVersion: value.expectedRowVersion ?? null,
        contentVersion: value.contentVersion,
        wrappedDek: value.wrappedDek,
        encryptedItem: value.encryptedItem,
      });
    }
    const batch = this.batchEnvelope(encrypted, collectionRevision);
    if (encoder.encode(JSON.stringify(batch)).length > 1024 * 1024)
      throw new Error('VAULT_BATCH_TOO_LARGE');
    return batch;
  }

  async deleteBatch(itemId: string, collectionRevision: number) {
    const target = this.index.get(itemId);
    assert(target);
    const repairs: Vault.RecordChange[] = [];
    if (target.summary.itemType === 'LOGIN') {
      for (const [id, entry] of this.index) {
        if (id === itemId) continue;
        const summary = entry.summary;
        if (
          summary.itemType === 'ACCOUNT_GROUP' &&
          summary.memberItemIds.includes(itemId)
        ) {
          repairs.push({
            itemId: id,
            plain: {
              itemSchemaVersion: 3,
              itemType: 'ACCOUNT_GROUP',
              name: summary.name,
              memberItemIds: summary.memberItemIds.filter(
                (member) => member !== itemId,
              ),
            },
          });
        }
      }
    }
    // Large fan-outs are unlinked in explicit batches; the target remains until the final transaction.
    const selected = repairs.slice(0, 99);
    let batch: Vault.ItemBatch;
    while (true) {
      try {
        batch = selected.length
          ? await this.batch(selected, collectionRevision)
          : this.batchEnvelope([], collectionRevision);
        break;
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.message !== 'VAULT_BATCH_TOO_LARGE' ||
          selected.length <= 1
        )
          throw error;
        selected.splice(Math.max(1, Math.floor(selected.length / 2)));
      }
    }
    let final = selected.length === repairs.length;
    if (final)
      batch.changes.push({
        action: 'DELETE',
        itemId,
        expectedRowVersion: target.cipher.rowVersion,
        contentVersion: null,
        wrappedDek: null,
        encryptedItem: null,
      });
    if (encoder.encode(JSON.stringify(batch)).length > 1024 * 1024) {
      batch.changes.pop();
      final = false;
    }
    assert(batch.changes.length > 0);
    return { batch, final };
  }

  async code(itemId: string, now = Date.now()) {
    const entry = this.index.get(itemId);
    assert(entry && this.vmk);
    const plain = await this.login(entry.cipher);
    assert(plain.totp);
    return totpCode(plain.totp, now);
  }

  async notes(itemId: string) {
    const entry = this.index.get(itemId);
    assert(entry && this.vmk);
    return (await this.login(entry.cipher)).notes;
  }

  async draftCode(config: Vault.Totp) {
    assert(this.ctx && this.vmk);
    return totpCode(normalizeTotp(config));
  }

  async exportTotp(itemId: string, session: Vault.Session, checkedAt: number) {
    const entry = this.index.get(itemId);
    const key = this.vmk;
    // The host supplies a fresh HTTPS session response. This gate is not an XSS boundary.
    const authorized = () =>
      this.ctx &&
      key &&
      this.vmk === key &&
      session.ownerSubject === this.ctx.ownerSubject &&
      session.stage === 'MFA' &&
      session.mfa === true &&
      session.recentAuthentication === true &&
      Number.isSafeInteger(checkedAt) &&
      Date.now() >= checkedAt &&
      Date.now() - checkedAt < 5000;
    assert(entry && authorized());
    const plain = await this.login(entry.cipher);
    assert(authorized() && plain.totp);
    return encodeTotpURI({
      ...plain.totp,
      ...totpTransferLabels(plain.totp, plain),
    });
  }

  async changeMaster(
    meta: Vault.Meta,
    account: string,
    oldPassword: string,
    newPassword: string,
  ) {
    assert(
      this.ctx &&
        this.vmk &&
        meta.vaultId === this.ctx.vaultId &&
        meta.keyEpoch === this.ctx.keyEpoch,
    );
    const slots = normalizeSlots(meta.keySlots);
    const old = slots.find((slot) => slot.slotType === 'NORMAL');
    assert(old);
    const file = parseAccountFile(account);
    const raw = await unlockMaterial(this.ctx, slots, account, oldPassword);
    const ak = decode(file.accountKey, 32);
    try {
      const slot: Vault.Slot = {
        ...old,
        slotId: crypto.randomUUID(),
        kdfProfile: PROFILE,
        kdfSalt: encode(random(16)),
        wrapSalt: encode(random(32)),
      };
      const key = await normalKey(this.ctx, slot, newPassword, ak);
      slot.wrappedVmk = await seal(key, raw, slotAAD(this.ctx, slot));
      const test = await open(key, slot.wrappedVmk, slotAAD(this.ctx, slot));
      try {
        assert(encode(test) === encode(raw));
      } finally {
        test.fill(0);
      }
      return {
        expectedMetaRevision: meta.metaRevision,
        normalSlot: slot,
        idempotencyKey: crypto.randomUUID(),
      };
    } finally {
      raw.fill(0);
      ak.fill(0);
    }
  }

  async exportBackup(snapshot: Vault.Snapshot) {
    const value = validateSnapshot(snapshot);
    assert(
      this.ctx &&
        this.backupRoot &&
        this.generation === value.generation &&
        value.ownerSubject === this.ctx.ownerSubject &&
        value.vaultId === this.ctx.vaultId &&
        value.keyEpoch === this.ctx.keyEpoch,
    );
    // Authenticate every ciphertext while retaining unknown content schemas intact.
    for (const item of value.items) (await this.decryptRaw(item)).fill(0);
    const backup: Vault.Backup = {
      formatVersion: 1,
      backupId: crypto.randomUUID(),
      backupSalt: encode(random(32)),
      snapshot: value,
      manifest: '',
      authentication: '',
    };
    backup.manifest = await backupManifest(backup);
    backup.authentication = await signBackup(this.backupRoot, backup);
    await verifyBackupAuth(this.backupRoot, backup);
    this.sourceSnapshot = value;
    return JSON.stringify(backup);
  }

  async verifyBackup(text: string, file: string, password?: string) {
    this.clear();
    const backup = parseBackup(text);
    const snapshot = backup.snapshot;
    if (password === undefined)
      await this.unlockRecovery(snapshot.ownerSubject, snapshot, file);
    else await this.unlock(snapshot.ownerSubject, snapshot, file, password);
    assert(this.backupRoot);
    try {
      await verifyBackupAuth(this.backupRoot, backup);
      for (const item of snapshot.items) (await this.decryptRaw(item)).fill(0);
      this.sourceSnapshot = snapshot;
      return snapshot.items.length;
    } catch (error) {
      this.clear();
      throw error;
    }
  }

  async prepareTransition(
    ownerSubject: string,
    meta: Vault.Meta,
    password: string,
    restore: boolean,
  ) {
    assert(this.ctx && this.vmk && this.sourceSnapshot);
    const source = this.sourceSnapshot;
    // Reject unknown structures before generating or uploading any replacement.
    for (const item of source.items) await this.decrypt(item);
    if (!restore)
      assert(
        source.ownerSubject === ownerSubject &&
          source.vaultId === meta.vaultId &&
          source.metaRevision === meta.metaRevision &&
          source.collectionRevision === meta.collectionRevision,
      );
    this.transition?.target.clear();
    const target = new VaultEngine();
    this.transition = { target, restore, encrypted: new Map() };
    return target.prepare(
      ownerSubject,
      password,
      meta.vaultId,
      meta.keyEpoch ? meta.keyEpoch + 1 : 1,
    );
  }
  verifyTransitionFiles(account: string, recovery: string) {
    assert(this.transition);
    return this.transition.target.verifyFiles(account, recovery);
  }
  transitionPayload() {
    assert(this.transition && this.sourceSnapshot);
    return {
      ...this.transition.target.setupPayload(),
      itemIds: this.sourceSnapshot.items.map((item) => item.itemId),
    };
  }
  bindTransition(task: Vault.Rotation) {
    const transition = this.transition;
    assert(transition && this.sourceSnapshot && transition.target.ctx);
    const target = transition.target;
    uuid(task.rotationId);
    version(task.generation);
    version(task.keyEpoch);
    assert(
      Array.isArray(task.expectedItems) &&
        task.expectedItems.length <= 2000 &&
        task.expectedItemCount === task.expectedItems.length,
    );
    assert(
      task.status === 'UPLOADING' &&
        task.mode === (transition.restore ? 'RESTORE' : 'ROTATION') &&
        task.keyEpoch === target.ctx?.keyEpoch,
    );
    assert(
      JSON.stringify(canonicalSlots(normalizeSlots(task.keySlots))) ===
        JSON.stringify(canonicalSlots(target.setupPayload().keySlots)),
    );
    const expected = [...task.expectedItems].sort((a, b) =>
      a.itemId < b.itemId ? -1 : 1,
    );
    const source = [...this.sourceSnapshot.items].sort((a, b) =>
      a.itemId < b.itemId ? -1 : 1,
    );
    assert(
      expected.length === source.length &&
        expected.every(
          (item, index) =>
            item.itemId === source[index].itemId &&
            item.contentVersion ===
              (transition.restore ? 1 : source[index].contentVersion),
        ),
    );
    target.generation = task.generation;
    transition.task = task;
    return true;
  }
  async transitionBatch(itemIds: string[]) {
    const transition = this.transition;
    assert(
      transition?.task &&
        this.sourceSnapshot &&
        itemIds.length > 0 &&
        itemIds.length <= 40,
    );
    const target = transition.target;
    assert(target.ctx && target.vmk);
    const result: Vault.Item[] = [];
    for (const itemId of itemIds) {
      let encrypted = transition.encrypted.get(itemId);
      if (!encrypted) {
        const source = this.sourceSnapshot.items.find(
          (item) => item.itemId === itemId,
        );
        assert(source);
        const plain = await this.decrypt(source);
        const identity = {
          itemId,
          contentVersion: transition.restore ? 1 : source.contentVersion,
        };
        const raw = random(32);
        const bytes = encoder.encode(JSON.stringify(plain));
        try {
          const key = await aesKey(raw);
          encrypted = {
            ...identity,
            rowVersion: 1,
            keyEpoch: target.ctx.keyEpoch,
            wrappedDek: await seal(
              target.vmk,
              raw,
              itemAAD(target.ctx, identity, 'item-key'),
            ),
            encryptedItem: await seal(
              key,
              bytes,
              itemAAD(target.ctx, identity, 'item-data'),
            ),
          };
          transition.encrypted.set(itemId, encrypted);
        } finally {
          raw.fill(0);
          bytes.fill(0);
        }
      }
      result.push(encrypted);
    }
    return result;
  }
  async verifyStaged(items: Vault.Item[]) {
    const transition = this.transition;
    assert(transition?.task && this.sourceSnapshot && transition.target.ctx);
    const task = transition.task;
    assert(
      items.length === task.expectedItemCount &&
        new Set(items.map((item) => item.itemId)).size === items.length,
    );
    for (const staged of items) {
      const source = this.sourceSnapshot.items.find(
        (item) => item.itemId === staged.itemId,
      );
      assert(
        source &&
          staged.contentVersion ===
            (transition.restore ? 1 : source.contentVersion),
      );
      const oldPlain = await this.decrypt(source);
      const newPlain = await transition.target.decrypt(staged);
      const canonical = (plain: Vault.PlainRecord) =>
        plain.itemType === 'ACCOUNT_GROUP'
          ? JSON.stringify([
              plain.itemType,
              plain.name,
              plain.defaultBoundEmail,
              plain.memberItemIds,
            ])
          : JSON.stringify([
              plain.itemType,
              plain.title,
              plain.website,
              plain.username,
              plain.password,
              plain.notes,
              plain.tags,
              plain.platform,
              plain.boundEmail,
              plain.emailItemId,
              plain.totp
                ? [
                    plain.totp.secretBase32,
                    plain.totp.issuer,
                    plain.totp.accountName,
                    plain.totp.algorithm,
                    plain.totp.digits,
                    plain.totp.period,
                  ]
                : null,
            ]);
      assert(canonical(oldPlain) === canonical(newPlain));
    }
    return digest(
      context(
        'staging-manifest',
        transition.target.ctx.ownerSubject,
        transition.target.ctx.vaultId,
        task.rotationId,
        task.generation,
        task.keyEpoch,
        canonicalSlots(task.keySlots),
        canonicalItems(items),
      ),
    );
  }
  async resumeTransition(
    ownerSubject: string,
    meta: Vault.Meta,
    task: Vault.Rotation,
    account: string,
    password: string,
    recovery: string,
  ) {
    assert(this.sourceSnapshot && this.ctx);
    const target = new VaultEngine();
    const targetMeta = {
      ...meta,
      initialized: true,
      vaultId: meta.vaultId,
      generation: task.generation,
      keyEpoch: task.keyEpoch,
      keySlots: task.keySlots,
    };
    await target.unlock(ownerSubject, targetMeta, account, password);
    const file = parseRecoveryFile(recovery);
    const raw = await unlockMaterial(
      target.ctx as Vault.Context,
      task.keySlots,
      recovery,
    );
    try {
      const slot = task.keySlots.find((value) => value.slotType === 'RECOVERY');
      assert(slot && file.recoveryKeyId === slot.keyId);
      // Both target files must open the identical VMK.
      const original = await unlockMaterial(
        target.ctx as Vault.Context,
        task.keySlots,
        account,
        password,
      );
      try {
        assert(encode(raw) === encode(original));
      } finally {
        original.fill(0);
      }
    } finally {
      raw.fill(0);
    }
    target.draft = {
      vaultId: meta.vaultId as string,
      keySlots: task.keySlots,
      accountFile: account,
      recoveryFile: recovery,
    };
    target.verified = true;
    this.transition?.target.clear();
    this.transition = {
      target,
      restore: task.mode === 'RESTORE',
      encrypted: new Map(),
    };
    return this.bindTransition(task);
  }

  generate(length?: number, symbols?: boolean) {
    assert(this.vmk);
    return generatePassword(length, symbols);
  }
}
