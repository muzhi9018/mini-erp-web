import { assert, validateItem } from './protocol';

export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function parseServerTime(value: string) {
  assert(typeof value === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(value));
  const time = Date.parse(value);
  assert(Number.isFinite(time));
  return time;
}

export function validateRetentionTimes(value: {
  deletedAt: string;
  purgeAt: string;
}) {
  const deleted = parseServerTime(value.deletedAt);
  const purge = parseServerTime(value.purgeAt);
  assert(Number.isFinite(deleted) && purge - deleted === RETENTION_MS);
}

export function validateDeleted(value: Vault.DeletedItem) {
  validateItem(value);
  assert(value.deleted === true);
  validateRetentionTimes(value);
}

/** Never extend eligibility when the wall clock moves or the device sleeps. */
export class RetentionClock {
  private server = 0;
  private wall = 0;
  private mono = 0;

  calibrate(serverTime: string, requestStarted = performance.now()) {
    const value = parseServerTime(serverTime);
    assert(Number.isFinite(value));
    this.server = value + Math.max(0, performance.now() - requestStarted);
    this.wall = Date.now();
    this.mono = performance.now();
  }

  now() {
    assert(this.server > 0);
    return (
      this.server +
      Math.max(0, performance.now() - this.mono, Date.now() - this.wall)
    );
  }

  needsConfirmation() {
    return (
      !this.server ||
      Math.abs(Date.now() - this.wall - (performance.now() - this.mono)) > 2000
    );
  }
}
