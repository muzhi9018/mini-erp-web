import {
  assert,
  object,
  uuid,
  validateSlots,
  version,
} from '@/security/vault/protocol';
import { doGet, doPost, VaultHttpError } from '@/services/httpClient';

function parseMeta(result: Vault.Meta): Vault.Meta {
  try {
    assert(typeof result.initialized === 'boolean');
    version(result.metaRevision);
    version(result.collectionRevision);
    if (result.initialized) {
      uuid(result.vaultId);
      version(result.generation);
      version(result.keyEpoch);
      assert(Array.isArray(result.keySlots));
      // Java's FastJson converter omits nulls. Restore only the nullable slot fields
      // before applying the unchanged strict cryptographic protocol validation.
      const keySlots = result.keySlots.map((slot) => ({
        kdfProfile: null,
        kdfSalt: null,
        wrapSalt: null,
        recoverySalt: null,
        ...object(slot),
      }));
      validateSlots(keySlots);
      return { ...result, keySlots };
    }
    return result;
  } catch {
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
