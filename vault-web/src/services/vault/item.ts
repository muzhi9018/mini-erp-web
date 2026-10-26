import {
  parseServerTime,
  validateDeleted,
  validateRetentionTimes,
} from '@/security/vault/lifecycle';
import {
  assert,
  encoder,
  validateItem,
  version,
} from '@/security/vault/protocol';
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
      '/vault/api/items',
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
  doPost<Vault.WriteReceipt>('/vault/api/items/create', value);
export const updateItem = (value: Vault.ItemWrite) =>
  doPost<Vault.WriteReceipt>('/vault/api/items/update', value);
export const deleteItem = (value: Vault.Authorized<Vault.LifecycleRequest>) =>
  doPost<Vault.DeleteReceipt>('/vault/api/items/delete', value);

export async function batch(value: Vault.Authorized<Vault.ItemBatch>) {
  const receipt = await doPost<Vault.BatchReceipt>(
    '/vault/api/items/batch',
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
      if (change.action === 'DELETE_GROUP') {
        assert(result.permanentlyDeleted === true);
        return;
      }
      assert(result.rowVersion === (change.expectedRowVersion ?? 0) + 1);
      if (change.action === 'DELETE') {
        assert(result.deleted === true);
        validateRetentionTimes(result as Vault.DeleteReceipt);
        parseServerTime(result.serverTime || '');
      } else assert(result.contentVersion === change.contentVersion);
    });
    return receipt;
  } catch {
    // The transaction may have committed. Keep the exact request available for retry.
    throw new VaultHttpError(0, 'VAULT_INVALID_RESPONSE');
  }
}

export async function deletedItems(meta: Vault.Meta, signal?: AbortSignal) {
  const items: Vault.DeletedItem[] = [];
  const cursors = new Set<string>();
  const ids = new Set<string>();
  let cursor: string | null = null;
  let serverTime = '';
  let requestStarted = performance.now();
  do {
    requestStarted = performance.now();
    const page: Vault.DeletedPage = await doGet(
      '/vault/api/items/deleted',
      { pageSize: 100, ...(cursor ? { cursor } : {}) },
      signal,
    );
    if (
      page.generation !== meta.generation ||
      page.collectionRevision !== meta.collectionRevision
    )
      throw new VaultHttpError(409, 'VAULT_VERSION_CONFLICT');
    assert(Array.isArray(page.items) && page.items.length <= 100);
    parseServerTime(page.serverTime);
    serverTime = page.serverTime;
    for (const item of page.items) {
      validateDeleted(item);
      assert(item.keyEpoch === meta.keyEpoch && !ids.has(item.itemId));
      ids.add(item.itemId);
      items.push(item);
    }
    cursor = page.nextCursor;
    assert(
      cursor === null ||
        (typeof cursor === 'string' &&
          cursor.length > 0 &&
          cursor.length <= 342 &&
          !cursors.has(cursor)),
    );
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return { items, serverTime, requestStarted };
}
export async function deletedDetail(itemId: string) {
  const value = await doGet<Vault.DeletedDetail>(
    '/vault/api/items/deleted/detail',
    { itemId },
  );
  validateDeleted(value);
  parseServerTime(value.serverTime);
  assert(
    value.itemId === itemId && Number.isFinite(Date.parse(value.serverTime)),
  );
  version(value.generation);
  version(value.collectionRevision);
  return value;
}
export async function lifecycle(
  action: 'restore' | 'purge',
  request: Vault.Authorized<Vault.LifecycleRequest>,
) {
  const value = await doPost<Vault.LifecycleReceipt>(
    `/vault/api/items/${action}`,
    request,
  );
  try {
    assert(
      value.itemId === request.itemId &&
        Number.isFinite(Date.parse(value.serverTime)),
    );
    version(value.collectionRevision);
    parseServerTime(value.serverTime);
    if (action === 'restore') {
      version(value.contentVersion);
      assert(
        value.deleted === false &&
          value.rowVersion === request.expectedRowVersion + 1,
      );
    } else
      assert(
        value.permanentlyDeleted === true &&
          Number.isFinite(Date.parse(value.purgedAt || '')),
      );
    return value;
  } catch {
    throw new VaultHttpError(0, 'VAULT_INVALID_RESPONSE');
  }
}

// Without a proof, these routes can only return an existing durable receipt.
// Never infer a successful deletion from a detail request or a 404 response.
export async function submitDeletion(
  value: Vault.DeleteOperation,
  passkeyAuthorization?: Vault.PasskeyAuthorization,
) {
  const body = {
    ...value.request,
    ...(passkeyAuthorization ? { passkeyAuthorization } : {}),
  };
  if (
    encoder.encode(JSON.stringify(body)).length >
    (value.operation === 'BATCH_ITEMS' ? 1024 * 1024 : 64 * 1024)
  )
    throw new VaultHttpError(400, 'VAULT_BATCH_TOO_LARGE');
  if (value.operation === 'BATCH_ITEMS')
    return batch({
      ...value.request,
      ...(passkeyAuthorization ? { passkeyAuthorization } : {}),
    });
  if (value.operation === 'PURGE_ITEM')
    return lifecycle('purge', {
      ...value.request,
      ...(passkeyAuthorization ? { passkeyAuthorization } : {}),
    });
  const path = value.operation === 'DELETE_GROUP' ? 'delete-group' : 'delete';
  return doPost<Vault.LifecycleReceipt | Vault.DeleteReceipt>(
    `/vault/api/items/${path}`,
    {
      ...value.request,
      ...(passkeyAuthorization ? { passkeyAuthorization } : {}),
    },
  ).then((receipt) => {
    try {
      assert(receipt.itemId === value.request.itemId);
      version(receipt.collectionRevision);
      if (value.operation === 'DELETE_GROUP')
        assert(
          'permanentlyDeleted' in receipt &&
            receipt.permanentlyDeleted === true,
        );
      else {
        assert(
          'deleted' in receipt &&
            receipt.deleted === true &&
            receipt.rowVersion === value.request.expectedRowVersion + 1,
        );
        validateRetentionTimes(receipt as Vault.DeleteReceipt);
        parseServerTime(receipt.serverTime);
      }
      return receipt;
    } catch {
      throw new VaultHttpError(0, 'VAULT_INVALID_RESPONSE');
    }
  });
}
