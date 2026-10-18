import { assert } from '@/security/vault/protocol';

export async function readQR(file: File, signal: AbortSignal): Promise<string> {
  assert(
    file.size > 0 &&
      file.size <= 2 * 1024 * 1024 &&
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type),
  );
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  assert(!signal.aborted);
  const bitmapPromise = createImageBitmap(file);
  let onAbort: (() => void) | undefined;
  // A late image decode must also release the bitmap after timeout.
  void bitmapPromise.then(
    (bitmap) => {
      if (closed) bitmap.close();
    },
    () => {},
  );
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        onAbort = () => {
          closed = true;
          worker?.terminate();
          reject(new Error('VAULT_LOCKED'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
      }),
      (async () => {
        const bitmap = await bitmapPromise;
        assert(!closed);
        try {
          assert(
            bitmap.width <= 4096 &&
              bitmap.height <= 4096 &&
              bitmap.width * bitmap.height <= 8_000_000,
          );
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          assert(context);
          context.drawImage(bitmap, 0, 0);
          const pixels = context.getImageData(
            0,
            0,
            bitmap.width,
            bitmap.height,
          );
          canvas.width = 0;
          canvas.height = 0;
          worker = new Worker(
            new URL('../../workers/qr.worker.ts', import.meta.url),
            { type: 'module' },
          );
          return await new Promise<string>((resolve, reject) => {
            if (!worker) return reject(new Error('VAULT_INVALID_FORMAT'));
            worker.onmessage = (event: MessageEvent<unknown>) => {
              if (typeof event.data === 'string' && event.data.length <= 4096)
                resolve(event.data);
              else reject(new Error('VAULT_INVALID_FORMAT'));
            };
            worker.onerror = () => reject(new Error('VAULT_INVALID_FORMAT'));
            worker.postMessage(
              {
                pixels: pixels.data,
                width: pixels.width,
                height: pixels.height,
              },
              [pixels.data.buffer],
            );
          });
        } finally {
          bitmap.close();
        }
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('VAULT_INVALID_FORMAT')),
          5000,
        );
      }),
    ]);
  } finally {
    closed = true;
    if (onAbort) signal.removeEventListener('abort', onAbort);
    clearTimeout(timer);
    worker?.terminate();
  }
}
