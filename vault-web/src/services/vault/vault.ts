import {
  assert,
  ITEM_SCHEMA_VERSION,
  LIFECYCLE_PROTOCOL_VERSION,
  normalizeSlots,
  PROFILE,
  uuid,
  version,
} from '@/security/vault/protocol';
import {
  blockDataWrites,
  doGet,
  doPost,
  VaultHttpError,
} from '@/services/httpClient';

function parseMeta(result: Vault.Meta): Vault.Meta {
  try {
    assert(typeof result.initialized === 'boolean');
    version(result.metaRevision);
    version(result.collectionRevision);
    version(result.minimumClientSchemaVersion);
    assert(
      [
        result.allowedFormatVersions,
        result.allowedAlgorithms,
        result.allowedKdfProfiles,
        result.readableItemSchemaVersions,
      ].every((value) => Array.isArray(value) && value.length <= 16),
    );
    assert(
      result.allowedFormatVersions?.includes(1) &&
        result.allowedAlgorithms?.includes('A256GCM') &&
        result.allowedKdfProfiles?.includes(PROFILE),
    );
    if (
      result.lifecycleProtocolVersion !== LIFECYCLE_PROTOCOL_VERSION ||
      result.clientLifecycleVersionHeader !== 'X-Vault-Lifecycle-Version' ||
      result.deletedItemRetentionDays !== 30 ||
      result.writeItemSchemaVersion !== ITEM_SCHEMA_VERSION ||
      result.minimumClientSchemaVersion > ITEM_SCHEMA_VERSION ||
      result.clientSchemaVersionHeader !== 'X-Vault-Item-Schema-Version' ||
      !result.readableItemSchemaVersions?.includes(ITEM_SCHEMA_VERSION)
    ) {
      blockDataWrites();
      throw new VaultHttpError(409, 'VAULT_CLIENT_UPGRADE_REQUIRED');
    }
    if (result.initialized) {
      uuid(result.vaultId);
      version(result.generation);
      version(result.keyEpoch);
      assert(Array.isArray(result.keySlots));
      const keySlots = normalizeSlots(result.keySlots);
      return { ...result, keySlots };
    }
    return result;
  } catch (error) {
    if (error instanceof VaultHttpError) throw error;
    throw new VaultHttpError(502, 'VAULT_INVALID_RESPONSE');
  }
}

export async function meta() {
  return parseMeta(await doGet<Vault.Meta>('/vault/api/meta'));
}

export async function initialize(setup: {
  vaultId: string;
  keySlots: Vault.Slot[];
  idempotencyKey: string;
}) {
  // An idempotent receipt can contain an older compatibility declaration.
  // The caller reads GET meta before accepting the initialized state.
  return doPost<Vault.Meta>('/vault/api/initialize', setup);
}

export const changeMaster = (value: {
  expectedMetaRevision: number;
  normalSlot: Vault.Slot;
  idempotencyKey: string;
}) => doPost<Vault.Meta>('/vault/api/key-slots/change-master', value);
export const snapshot = () =>
  doGet<Vault.Snapshot>('/vault/api/backup-snapshot');
