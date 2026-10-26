import { type KeyboardEvent, type RefObject, useEffect } from 'react';

/** Keep the background out of pointer, keyboard and accessibility navigation. */
export function useDialogBackground(
  ref: RefObject<HTMLDivElement | null>,
  open: boolean,
) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const changed: HTMLElement[] = [];
    let node: HTMLElement | null = ref.current;
    while (node?.parentElement && node !== document.body) {
      for (const sibling of node.parentElement.children) {
        if (
          sibling instanceof HTMLElement &&
          sibling !== node &&
          !sibling.inert
        ) {
          sibling.inert = true;
          changed.push(sibling);
        }
      }
      node = node.parentElement;
    }
    return () => {
      for (const node of changed) node.inert = false;
    };
  }, [open, ref]);
}

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
