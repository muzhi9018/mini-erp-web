import { VaultEngine } from '../security/vault/engine';
import {
  WORKER_FAILURES,
  type WorkerRequest,
} from '../security/vault/messages';
import { assert, encoder } from '../security/vault/protocol';

const engine = new VaultEngine();
let queue = Promise.resolve();
let queued = 0;

async function execute(message: WorkerRequest) {
  switch (message.type) {
    case 'prepare':
      return engine.prepare(
        message.payload.ownerSubject,
        message.payload.password,
        message.payload.vaultId,
      );
    case 'verifyFiles':
      return engine.verifyFiles(
        message.payload.account,
        message.payload.recovery,
      );
    case 'setupPayload':
      return engine.setupPayload();
    case 'finishSetup':
      return engine.finishSetup(
        message.payload.meta,
        message.payload.ownerSubject,
      );
    case 'unlock':
      return engine.unlock(
        message.payload.ownerSubject,
        message.payload.meta,
        message.payload.account,
        message.payload.password,
      );
    case 'resetIndex':
      return engine.resetIndex();
    case 'ingest':
      return engine.ingest(message.payload.items);
    case 'search':
      return engine.search(message.payload.query);
    case 'reveal':
      return engine.reveal(message.payload.itemId);
    case 'encrypt':
      return engine.encrypt(message.payload.plain, message.payload.itemId);
    case 'generate':
      return engine.generate();
    default:
      throw new Error('VAULT_INVALID_FORMAT');
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  try {
    assert(
      message &&
        Number.isSafeInteger(message.id) &&
        message.id > 0 &&
        queued < 8,
    );
    assert(encoder.encode(JSON.stringify(message)).length <= 4 * 1024 * 1024);
  } catch {
    self.postMessage({ id: message?.id, error: 'VAULT_INVALID_FORMAT' });
    return;
  }
  queued++;
  queue = queue.then(async () => {
    try {
      self.postMessage({ id: message.id, result: await execute(message) });
    } catch (error) {
      const code =
        error instanceof Error &&
        WORKER_FAILURES.some((value) => value === error.message)
          ? error.message
          : 'VAULT_DECRYPT_FAILED';
      self.postMessage({ id: message.id, error: code });
    } finally {
      queued--;
    }
  });
};
