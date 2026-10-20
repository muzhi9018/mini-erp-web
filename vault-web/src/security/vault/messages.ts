export type Operations = {
  prepare: {
    input: { ownerSubject: string; password: string; vaultId?: string };
    output: Vault.PreparedSetup;
  };
  verifyFiles: {
    input: { account: string; recovery: string };
    output: boolean;
  };
  setupPayload: {
    input: Record<string, never>;
    output: { vaultId: string; keySlots: Vault.Slot[] };
  };
  finishSetup: {
    input: { meta: Vault.Meta; ownerSubject: string };
    output: boolean;
  };
  unlock: {
    input: {
      ownerSubject: string;
      meta: Vault.Meta;
      account: string;
      password: string;
    };
    output: boolean;
  };
  unlockRecovery: {
    input: { ownerSubject: string; meta: Vault.Meta; recovery: string };
    output: boolean;
  };
  code: { input: { itemId: string }; output: Vault.TotpCode };
  notes: { input: { itemId: string }; output: string };
  draftCode: { input: { config: Vault.Totp }; output: Vault.TotpCode };
  exportTotp: {
    input: { itemId: string; session: Vault.Session; checkedAt: number };
    output: string;
  };
  changeMaster: {
    input: {
      meta: Vault.Meta;
      account: string;
      oldPassword: string;
      newPassword: string;
    };
    output: {
      expectedMetaRevision: number;
      normalSlot: Vault.Slot;
      idempotencyKey: string;
    };
  };
  exportBackup: { input: { snapshot: Vault.Snapshot }; output: string };
  verifyBackup: {
    input: { backup: string; file: string; password?: string };
    output: number;
  };
  prepareTransition: {
    input: {
      ownerSubject: string;
      meta: Vault.Meta;
      password: string;
      restore: boolean;
    };
    output: Vault.PreparedSetup;
  };
  verifyTransitionFiles: {
    input: { account: string; recovery: string };
    output: boolean;
  };
  transitionPayload: {
    input: Record<string, never>;
    output: { vaultId: string; keySlots: Vault.Slot[]; itemIds: string[] };
  };
  bindTransition: { input: { task: Vault.Rotation }; output: boolean };
  transitionBatch: { input: { itemIds: string[] }; output: Vault.Item[] };
  verifyStaged: { input: { items: Vault.Item[] }; output: string };
  resumeTransition: {
    input: {
      ownerSubject: string;
      meta: Vault.Meta;
      task: Vault.Rotation;
      account: string;
      password: string;
      recovery: string;
    };
    output: boolean;
  };
  resetIndex: { input: Record<string, never>; output: boolean };
  ingest: { input: { items: Vault.Item[] }; output: boolean };
  completeIndex: {
    input: { meta: Vault.Meta; count: number };
    output: boolean;
  };
  groups: { input: Record<string, never>; output: Vault.GroupSummary[] };
  batch: {
    input: { changes: Vault.RecordChange[]; collectionRevision: number };
    output: Vault.ItemBatch;
  };
  deleteBatch: {
    input: { itemId: string; collectionRevision: number };
    output: { batch: Vault.ItemBatch; final: boolean };
  };
  search: { input: { query: string }; output: Vault.Summary[] };
  reveal: { input: { itemId: string }; output: Vault.PlainItem };
  encrypt: {
    input: { plain: Vault.PlainItem; itemId?: string; preserveTotp?: boolean };
    output: Vault.ItemWrite;
  };
  generate: { input: { length?: number; symbols?: boolean }; output: string };
};
export type WorkerRequest = {
  [K in keyof Operations]: {
    id: number;
    type: K;
    payload: Operations[K]['input'];
  };
}[keyof Operations];

export const WORKER_FAILURES = [
  'VAULT_INVALID_FORMAT',
  'VAULT_QR_TOO_LONG',
  'VAULT_DECRYPT_FAILED',
  'VAULT_LOCKED',
  'VAULT_WORKER_FAILED',
  'VAULT_CLIENT_UPGRADE_REQUIRED',
  'VAULT_BATCH_TOO_LARGE',
  'VAULT_GROUP_TOO_LARGE',
  'VAULT_RELATION_INVALID',
  'VAULT_INDEX_INCOMPLETE',
] as const;
