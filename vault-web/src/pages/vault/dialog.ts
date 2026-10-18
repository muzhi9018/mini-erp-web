import type { KeyboardEvent } from 'react';

/** Wrap Tab before native focus can move to browser chrome and trigger blur cleanup. */
export function trapDialogTab(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return;
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], summary, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) => element.getClientRects().length > 0 && element.tabIndex >= 0,
  );
  const first = controls[0];
  const last = controls.at(-1);
  if (
    (event.shiftKey && document.activeElement === first) ||
    (!event.shiftKey && document.activeElement === last)
  ) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
}
