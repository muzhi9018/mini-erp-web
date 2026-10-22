import type { Operations } from './messages';

export class VaultClient {
  private worker?: Worker;
  private serial = 0;
  private epoch = 0;
  private pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  get revision() {
    return this.epoch;
  }

  reset() {
    this.epoch++;
    this.worker?.terminate();
    this.worker = undefined;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('VAULT_LOCKED'));
    }
    this.pending.clear();
  }

  lock() {
    this.epoch++;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('VAULT_LOCKED'));
    }
    this.pending.clear();
    return this.call('lock', {});
  }

  call<K extends keyof Operations>(
    type: K,
    payload: Operations[K]['input'],
  ): Promise<Operations[K]['output']> {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../../workers/vault.worker.ts', import.meta.url),
        { type: 'module' },
      );
      this.worker.onmessage = (
        event: MessageEvent<{ id: number; result?: unknown; error?: string }>,
      ) => {
        const pending = this.pending.get(event.data.id);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pending.delete(event.data.id);
        if (event.data.error) pending.reject(new Error(event.data.error));
        else pending.resolve(event.data.result);
      };
      this.worker.onerror = () => {
        this.reset();
        window.dispatchEvent(new Event('vault-worker-failed'));
      };
    }
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.reset();
        window.dispatchEvent(new Event('vault-worker-failed'));
      }, 45000);
      this.pending.set(id, {
        resolve: (value) => resolve(value as Operations[K]['output']),
        reject,
        timer,
      });
      this.worker?.postMessage({ id, type, payload });
    });
  }
}
