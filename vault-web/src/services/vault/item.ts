import { assert, validateItem, version } from '@/security/vault/protocol';
import { doGet, doPost, VaultHttpError } from '@/services/httpClient';

export async function allItems(
  meta: Vault.Meta,
  signal?: AbortSignal,
): Promise<Vault.Item[]> {
  const items: Vault.Item[] = [];
  const cursors = new Set<string>();
  const ids = new Set<string>();
  let cursor: string | null = null;
  do {
    const page: Vault.ItemPage = await doGet(
      '/api/v1/vault/items',
      { ...(cursor ? { cursor } : {}), pageSize: 100 },
      signal,
    );
    version(page.collectionRevision);
    if (
      page.generation !== meta.generation ||
      page.collectionRevision !== meta.collectionRevision
    )
      throw new VaultHttpError(409, 'VAULT_VERSION_CONFLICT');
    assert(Array.isArray(page.items) && page.items.length <= 100);
    for (const item of page.items) {
      validateItem(item);
      assert(item.keyEpoch === meta.keyEpoch && !ids.has(item.itemId));
      ids.add(item.itemId);
      items.push(item);
    }
    assert(items.length <= 2000);
    cursor = page.nextCursor ?? null;
    assert(
      cursor === null ||
        (typeof cursor === 'string' &&
          cursor.length > 0 &&
          cursor.length <= 342 &&
          !cursors.has(cursor)),
    );
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return items;
}
export const createItem = (value: Vault.ItemWrite) =>
  doPost<Vault.WriteReceipt>('/api/v1/vault/items/create', value);
export const updateItem = (value: Vault.ItemWrite) =>
  doPost<Vault.WriteReceipt>('/api/v1/vault/items/update', value);
export const deleteItem = (value: {
  itemId: string;
  generation: number;
  expectedRowVersion: number;
  idempotencyKey: string;
}) =>
  doPost<{ deleted: boolean; collectionRevision: number }>(
    '/api/v1/vault/items/delete',
    value,
  );

export async function batch(value: Vault.ItemBatch) {
  const receipt = await doPost<Vault.BatchReceipt>(
    '/api/v1/vault/items/batch',
    value,
  );
  try {
    assert(receipt.generation === value.generation);
    assert(
      receipt.collectionRevision ===
        value.expectedCollectionRevision + value.changes.length,
    );
    assert(
      Array.isArray(receipt.results) &&
        receipt.results.length === value.changes.length,
    );
    receipt.results.forEach((result, index) => {
      const change = value.changes[index];
      assert(
        result.itemId === change.itemId &&
          result.collectionRevision === receipt.collectionRevision,
      );
      assert(result.rowVersion === (change.expectedRowVersion ?? 0) + 1);
      if (change.action === 'DELETE') assert(result.deleted === true);
      else assert(result.contentVersion === change.contentVersion);
    });
    return receipt;
  } catch {
    // The transaction may have committed. Keep the exact request available for retry.
    throw new VaultHttpError(0, 'VAULT_INVALID_RESPONSE');
  }
}
