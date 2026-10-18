import {
  assert,
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
      result.writeItemSchemaVersion !== 2 ||
      result.minimumClientSchemaVersion > 2 ||
      result.clientSchemaVersionHeader !== 'X-Vault-Item-Schema-Version' ||
      ![1, 2].every((v) => result.readableItemSchemaVersions?.includes(v))
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
  return parseMeta(await doGet<Vault.Meta>('/api/v1/vault/meta'));
}

export async function initialize(setup: {
  vaultId: string;
  keySlots: Vault.Slot[];
  idempotencyKey: string;
}) {
  return parseMeta(await doPost<Vault.Meta>('/api/v1/vault/initialize', setup));
}

export const changeMaster = (value: {
  expectedMetaRevision: number;
  normalSlot: Vault.Slot;
  idempotencyKey: string;
}) => doPost<Vault.Meta>('/api/v1/vault/key-slots/change-master', value);
export const snapshot = () =>
  doGet<Vault.Snapshot>('/api/v1/vault/backup-snapshot');
