import jsQR from 'jsqr';

self.onmessage = (
  event: MessageEvent<{
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
  }>,
) => {
  const { pixels, width, height } = event.data;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 4096 ||
    height > 4096 ||
    width * height > 8_000_000 ||
    pixels.length !== width * height * 4
  ) {
    self.postMessage(null);
    return;
  }
  try {
    self.postMessage(jsQR(pixels, width, height)?.data ?? null);
  } finally {
    pixels.fill(0);
  }
};
