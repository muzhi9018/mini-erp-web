import {
  assert,
  normalizeSlots,
  uuid,
  validateItem,
  version,
} from '@/security/vault/protocol';
import { doGet, doPost } from '@/services/httpClient';

const prefix = '/vault/api';
export const start = (value: Vault.RotationStart, restore: boolean) =>
  doPost<Vault.RotationSummary>(
    `${prefix}/${restore ? 'restores' : 'rotations'}/start`,
    restore
      ? value
      : {
          rotationId: value.rotationId,
          expectedMetaRevision: value.expectedMetaRevision,
          expectedCollectionRevision: value.expectedCollectionRevision,
          keySlots: value.keySlots,
          idempotencyKey: value.idempotencyKey,
        },
  );
export async function status(rotationId: string) {
  uuid(rotationId);
  const result = await doGet<Vault.Rotation>(`${prefix}/rotations/status`, {
    rotationId,
  });
  assert(
    result.rotationId === rotationId &&
      ['UPLOADING', 'COMMITTED', 'CANCELLED', 'EXPIRED'].includes(
        result.status,
      ),
  );
  assert(['ROTATION', 'RESTORE'].includes(result.mode));
  version(result.generation);
  version(result.keyEpoch);
  version(result.expectedCollectionRevision);
  assert(Array.isArray(result.expectedItems));
  // The current status mapper omits the nullable summary count. The explicit
  // expected set remains authoritative and is matched against the source below.
  result.expectedItemCount ??= result.expectedItems.length;
  assert(
    Number.isSafeInteger(result.expectedItemCount) &&
      result.expectedItemCount >= 0,
  );
  assert(
    Array.isArray(result.expectedItems) &&
      result.expectedItems.length === result.expectedItemCount,
  );
  const ids = new Set<string>();
  for (const item of result.expectedItems) {
    uuid(item.itemId);
    version(item.contentVersion);
    assert(!ids.has(item.itemId));
    ids.add(item.itemId);
  }
  assert(Array.isArray(result.receivedBatchIds));
  result.receivedBatchIds.forEach(uuid);
  assert(Number.isFinite(Date.parse(result.expiresAt)));
  if (result.status === 'COMMITTED') {
    assert(
      result.commitReceipt?.rotationId === rotationId &&
        result.commitReceipt.generation === result.generation &&
        result.commitReceipt.keyEpoch === result.keyEpoch,
    );
    version(result.commitReceipt.metaRevision);
    version(result.commitReceipt.collectionRevision);
  }
  // Cleaned terminal generations may no longer expose key slots.
  if (result.status === 'UPLOADING')
    result.keySlots = normalizeSlots(result.keySlots);
  return result;
}
export const batch = (
  rotationId: string,
  batchId: string,
  items: Vault.Item[],
) =>
  doPost<{ batchId: string; accepted: number }>(`${prefix}/rotations/batch`, {
    rotationId,
    batchId,
    items,
  });
export const resume = (value: Vault.RotationCommand) =>
  doPost<Vault.RotationSummary>(`${prefix}/rotations/resume`, value);
export const cancel = (value: Vault.RotationCommand) =>
  doPost<Vault.RotationSummary>(`${prefix}/rotations/cancel`, value);
export const commit = (value: Vault.RotationCommand) =>
  doPost<Vault.RotationReceipt>(`${prefix}/rotations/commit`, value);
export async function stagedItems(
  task: Vault.Rotation,
  scope: 'SOURCE' | 'STAGING' = 'STAGING',
  sourceMeta?: Vault.Meta,
) {
  const result: Vault.RotationItem[] = [];
  const seen = new Set<string>();
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await doGet<
      Vault.ItemPage & {
        rotationId: string;
        scope: string;
        serverTime: string;
        items: Vault.RotationItem[];
      }
    >(`${prefix}/rotations/items`, {
      rotationId: task.rotationId,
      scope,
      pageSize: 100,
      ...(cursor ? { cursor } : {}),
    });
    assert(
      page.rotationId === task.rotationId &&
        page.scope === scope &&
        page.generation ===
          (scope === 'SOURCE' ? sourceMeta?.generation : task.generation) &&
        Array.isArray(page.items) &&
        page.items.length <= 100,
    );
    for (const item of page.items) {
      validateItem(item);
      assert(
        item.keyEpoch ===
          (scope === 'SOURCE' ? sourceMeta?.keyEpoch : task.keyEpoch) &&
          !seen.has(item.itemId),
      );
      seen.add(item.itemId);
      result.push(item);
    }
    assert(result.length <= task.expectedItemCount);
    assert(
      page.nextCursor == null ||
        (typeof page.nextCursor === 'string' && page.nextCursor.length > 0),
    );
    cursor = page.nextCursor ?? undefined;
    if (cursor) {
      assert(cursor.length <= 342 && !cursors.has(cursor));
      cursors.add(cursor);
    }
  } while (cursor);
  return result;
}
