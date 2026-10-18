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
    case 'unlockRecovery':
      return engine.unlockRecovery(
        message.payload.ownerSubject,
        message.payload.meta,
        message.payload.recovery,
      );
    case 'code':
      return engine.code(message.payload.itemId);
    case 'notes':
      return engine.notes(message.payload.itemId);
    case 'draftCode':
      return engine.draftCode(message.payload.config);
    case 'exportTotp':
      return engine.exportTotp(
        message.payload.itemId,
        message.payload.session,
        message.payload.checkedAt,
      );
    case 'changeMaster':
      return engine.changeMaster(
        message.payload.meta,
        message.payload.account,
        message.payload.oldPassword,
        message.payload.newPassword,
      );
    case 'exportBackup':
      return engine.exportBackup(message.payload.snapshot);
    case 'verifyBackup':
      return engine.verifyBackup(
        message.payload.backup,
        message.payload.file,
        message.payload.password,
      );
    case 'prepareTransition':
      return engine.prepareTransition(
        message.payload.ownerSubject,
        message.payload.meta,
        message.payload.password,
        message.payload.restore,
      );
    case 'verifyTransitionFiles':
      return engine.verifyTransitionFiles(
        message.payload.account,
        message.payload.recovery,
      );
    case 'transitionPayload':
      return engine.transitionPayload();
    case 'bindTransition':
      return engine.bindTransition(message.payload.task);
    case 'transitionBatch':
      return engine.transitionBatch(message.payload.itemIds);
    case 'verifyStaged':
      return engine.verifyStaged(message.payload.items);
    case 'resumeTransition':
      return engine.resumeTransition(
        message.payload.ownerSubject,
        message.payload.meta,
        message.payload.task,
        message.payload.account,
        message.payload.password,
        message.payload.recovery,
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
      return engine.encrypt(
        message.payload.plain,
        message.payload.itemId,
        message.payload.preserveTotp,
      );
    case 'generate':
      return engine.generate(message.payload.length, message.payload.symbols);
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
    assert(encoder.encode(JSON.stringify(message)).length <= 64 * 1024 * 1024);
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
