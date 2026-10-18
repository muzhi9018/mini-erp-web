import {
  assert,
  exact,
  object,
  uuid,
  version,
} from '@/security/vault/protocol';
import type { Completion } from './shared';

const key = 'vault-operation-receipt';
// Public task coordinates only. Never persist files, passwords or unlocking state.
export function rememberCompletion(value: Completion) {
  try {
    const { ownerSubject, rotationId, mode, generation, keyEpoch, count } =
      value;
    sessionStorage.setItem(
      key,
      JSON.stringify({
        ownerSubject,
        rotationId,
        mode,
        generation,
        keyEpoch,
        count,
      }),
    );
  } catch {
    /* The downloaded task file remains the cross-device checkpoint. */
  }
}
export function forgetCompletion() {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage can be unavailable. */
  }
}
export function readCompletion(): Completion | undefined {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    const value = object(JSON.parse(raw));
    exact(value, [
      'ownerSubject',
      'rotationId',
      'mode',
      'generation',
      'keyEpoch',
      'count',
    ]);
    assert(
      typeof value.ownerSubject === 'string' &&
        value.ownerSubject.length > 0 &&
        value.ownerSubject.length <= 128,
    );
    uuid(value.rotationId);
    version(value.generation);
    version(value.keyEpoch);
    assert(value.mode === 'ROTATION' || value.mode === 'RESTORE');
    assert(
      Number.isInteger(value.count) &&
        (value.count as number) >= 0 &&
        (value.count as number) <= 2000,
    );
    return value as Completion;
  } catch {
    forgetCompletion();
    return undefined;
  }
}
