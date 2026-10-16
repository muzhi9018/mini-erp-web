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
  resetIndex: { input: Record<string, never>; output: boolean };
  ingest: { input: { items: Vault.Item[] }; output: boolean };
  search: { input: { query: string }; output: Vault.Summary[] };
  reveal: { input: { itemId: string }; output: Vault.PlainItem };
  encrypt: {
    input: { plain: Vault.PlainItem; itemId?: string };
    output: Vault.ItemWrite;
  };
  generate: { input: Record<string, never>; output: string };
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
  'VAULT_DECRYPT_FAILED',
  'VAULT_LOCKED',
  'VAULT_WORKER_FAILED',
] as const;
