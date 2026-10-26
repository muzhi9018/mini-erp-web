import { Button, Modal } from 'antd';
import { Fingerprint, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { assert, decode } from '@/security/vault/protocol';
import { getPasskey } from '@/security/vault/webauthn';
import { VaultHttpError } from '@/services/httpClient';
import { submitDeletion } from '@/services/vault/item';
import { operationOptions } from '@/services/vault/session';
import { trapDialogTab, useDialogBackground } from './dialog';
import s from './Entries.module.css';
import { type MessageKey, useText } from './text';

export type DeletePhase =
  | 'confirm'
  | 'preparing'
  | 'waiting'
  | 'submitting'
  | 'querying'
  | 'unknown'
  | 'canceled'
  | 'failed'
  | 'expired'
  | 'unavailable'
  | 'unsupported'
  | 'conflict'
  | 'missing'
  | 'locked'
  | 'service'
  | 'rateLimited'
  | 'noReceipt'
  | 'tooLarge';

function failurePhase(error: unknown): DeletePhase {
  const code = error instanceof Error ? error.message : '';
  if (code === 'VAULT_PASSKEY_CANCELLED') return 'canceled';
  if (code === 'VAULT_PASSKEY_UNSUPPORTED') return 'unsupported';
  if (code === 'VAULT_MFA_REQUIRED' || code === 'VAULT_PASSKEY_UNAVAILABLE')
    return 'unavailable';
  if (
    code === 'VAULT_OPERATION_AUTHORIZATION_INVALID' ||
    code === 'VAULT_CHALLENGE_INVALID'
  )
    return 'expired';
  if (code === 'VAULT_BATCH_TOO_LARGE') return 'tooLarge';
  if (error instanceof VaultHttpError) {
    if (error.status === 404) return 'missing';
    if (error.status === 409) return 'conflict';
    if (error.status === 423) return 'locked';
    if (error.status === 429) return 'rateLimited';
    if (error.status === 0 || error.status >= 500) return 'service';
  }
  return 'failed';
}

const feedback: Partial<Record<DeletePhase, MessageKey>> = {
  preparing: 'actions.auth.preparing',
  waiting: 'actions.auth.waiting',
  submitting: 'actions.auth.submitting',
  querying: 'actions.auth.querying',
  unknown: 'actions.auth.unknown',
  canceled: 'actions.auth.canceled',
  failed: 'actions.auth.failed',
  expired: 'actions.auth.expired',
  unavailable: 'actions.auth.unavailable',
  unsupported: 'actions.auth.unsupported',
  conflict: 'actions.auth.conflict',
  missing: 'actions.auth.missing',
  locked: 'actions.auth.locked',
  service: 'actions.auth.service',
  rateLimited: 'actions.auth.rateLimited',
  noReceipt: 'actions.auth.noReceipt',
  tooLarge: 'actions.auth.tooLarge',
};

export default function DeleteOperationDialog(props: {
  kind: 'delete' | 'purge' | 'group';
  name: string;
  impact?: string;
  editing?: boolean;
  prepare: () => Promise<Vault.DeleteOperation>;
  guard: <T>(promise: Promise<T>) => Promise<T>;
  valid: () => boolean;
  onPhase: (phase: DeletePhase | undefined) => void;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const t = useText();
  const [phase, setPhase] = useState<DeletePhase>('confirm');
  const [retryAfter, setRetryAfter] = useState(0);
  const phaseRef = useRef<DeletePhase>('confirm');
  const mounted = useRef(true);
  const serial = useRef(0);
  const controller = useRef<AbortController | undefined>(undefined);
  const frozen = useRef<Vault.DeleteOperation | undefined>(undefined);
  const live = useRef(props);
  live.current = props;
  const dialog = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useDialogBackground(dialog, ready);
  const change = (value: DeletePhase) => {
    phaseRef.current = value;
    setPhase(value);
    live.current.onPhase(value);
  };
  useEffect(() => {
    mounted.current = true;
    live.current.onPhase('confirm');
    return () => {
      mounted.current = false;
      serial.current++;
      controller.current?.abort();
      frozen.current = undefined;
      live.current.onPhase(undefined);
    };
  }, []);
  useEffect(() => {
    // Status changes do not rely on autoFocus being reapplied to reused buttons.
    dialog.current
      ?.querySelector<HTMLButtonElement>('[data-initial-focus]')
      ?.focus();
  }, [phase]);
  useEffect(() => {
    if (!retryAfter) return;
    const timer = setTimeout(() => setRetryAfter(0), retryAfter * 1000);
    return () => clearTimeout(timer);
  }, [retryAfter]);
  const current = (ticket: number) =>
    mounted.current && ticket === serial.current && live.current.valid();
  const cancel = () => {
    if (['submitting', 'querying', 'unknown'].includes(phaseRef.current))
      return;
    serial.current++;
    controller.current?.abort();
    if (['preparing', 'waiting'].includes(phaseRef.current)) change('canceled');
    else props.onClose();
  };
  const succeed = async () => {
    // A validated server receipt is the only path into local cleanup.
    change('submitting');
    try {
      await live.current.onSuccess();
    } catch {
      // A cleanup/sync failure cannot turn a confirmed receipt into an unknown write.
    } finally {
      if (mounted.current) live.current.onClose();
    }
  };
  const execute = async (queryOnly = false) => {
    if (phaseRef.current !== (queryOnly ? 'unknown' : 'confirm')) return;
    const ticket = ++serial.current;
    const abort = new AbortController();
    controller.current = abort;
    let submitted = false;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    change(queryOnly ? 'querying' : 'preparing');
    try {
      if (!frozen.current) {
        const prepared = await props.prepare();
        if (!current(ticket)) return;
        // Private immutable snapshot: never re-encrypt, re-order or change its key on retry.
        frozen.current = structuredClone(prepared);
      }
      const operation = frozen.current;
      let authorization: Vault.PasskeyAuthorization | undefined;
      if (!queryOnly) {
        if (!window.PublicKeyCredential || !navigator.credentials?.get)
          throw new Error('VAULT_PASSKEY_UNSUPPORTED');
        const options = await props.guard(
          operationOptions(operation, abort.signal),
        );
        if (!current(ticket)) return;
        assert(options.publicKey.userVerification === 'required');
        decode(options.challengeId, 32);
        decode(options.publicKey.challenge, 32);
        const expires = Date.parse(options.expiresAt);
        assert(Number.isFinite(expires));
        if (expires <= Date.now())
          throw new Error('VAULT_OPERATION_AUTHORIZATION_INVALID');
        if (!options.publicKey.allowCredentials?.length)
          throw new Error('VAULT_PASSKEY_UNAVAILABLE');
        expiryTimer = setTimeout(
          () => abort.abort(),
          Math.min(120000, expires - Date.now()),
        );
        change('waiting');
        const credential = await props.guard(
          getPasskey(options.publicKey, abort.signal),
        );
        if (!current(ticket)) return;
        if (abort.signal.aborted || Date.now() >= expires)
          throw new Error('VAULT_OPERATION_AUTHORIZATION_INVALID');
        // A native prompt can briefly hide its tab. Keep the assertion in memory
        // until foregrounded; the ordinary background/idle lock still aborts it.
        if (document.hidden)
          await new Promise<void>((resolve, reject) => {
            const cleanup = () => {
              document.removeEventListener('visibilitychange', visible);
              abort.signal.removeEventListener('abort', aborted);
            };
            const visible = () => {
              if (!document.hidden) {
                cleanup();
                resolve();
              }
            };
            const aborted = () => {
              cleanup();
              reject(new Error('VAULT_OPERATION_AUTHORIZATION_INVALID'));
            };
            document.addEventListener('visibilitychange', visible);
            abort.signal.addEventListener('abort', aborted, { once: true });
            if (abort.signal.aborted) aborted();
            else visible();
          });
        if (!current(ticket)) return;
        if (abort.signal.aborted || Date.now() >= expires)
          throw new Error('VAULT_OPERATION_AUTHORIZATION_INVALID');
        authorization = { challengeId: options.challengeId, credential };
      }
      if (!current(ticket)) return;
      clearTimeout(expiryTimer);
      change(queryOnly ? 'querying' : 'submitting');
      submitted = true;
      await props.guard(submitDeletion(operation, authorization));
      if (current(ticket)) await succeed();
    } catch (error) {
      if (!current(ticket)) return;
      if (error instanceof VaultHttpError && error.status === 429)
        setRetryAfter(Math.ceil(error.retryAfterMs / 1000));
      if (
        submitted &&
        (!(error instanceof VaultHttpError) ||
          error.status === 0 ||
          error.status >= 500)
      )
        change('unknown');
      else if (
        queryOnly &&
        error instanceof VaultHttpError &&
        error.code === 'VAULT_OPERATION_AUTHORIZATION_INVALID'
      )
        change('noReceipt');
      else if (abort.signal.aborted) change('expired');
      else change(failurePhase(error));
    } finally {
      clearTimeout(expiryTimer);
    }
  };
  const confirm = phase === 'confirm';
  const working = ['preparing', 'waiting', 'submitting', 'querying'].includes(
    phase,
  );
  const unresolved = phase === 'unknown' || phase === 'querying';
  const canClose = !['submitting', 'querying', 'unknown'].includes(phase);
  const canRetry =
    ![
      'conflict',
      'missing',
      'locked',
      'tooLarge',
      'unsupported',
      'unavailable',
    ].includes(phase) && !(phase === 'rateLimited' && retryAfter > 0);
  const title: MessageKey = unresolved
    ? 'actions.auth.unknownTitle'
    : confirm
      ? props.kind === 'purge'
        ? 'actions.purge.title'
        : props.kind === 'group'
          ? 'actions.group.title'
          : 'actions.delete.title'
      : working
        ? 'actions.auth.title'
        : 'actions.auth.stopped';
  return (
    <Modal
      open
      title={t(title)}
      className={s.dialog}
      getContainer={false}
      destroyOnHidden
      afterOpenChange={(open) => {
        setReady(open);
        if (open)
          dialog.current
            ?.querySelector<HTMLButtonElement>('[data-initial-focus]')
            ?.focus();
      }}
      closable={canClose ? { 'aria-label': t('entries.closeDialog') } : false}
      keyboard={canClose}
      mask={{ closable: false }}
      focusable={{ trap: true, focusTriggerAfterClose: true }}
      modalRender={(node) => (
        <div
          ref={dialog}
          data-vault-dialog-ready={ready || undefined}
          role="presentation"
          onKeyDownCapture={trapDialogTab}
        >
          {node}
        </div>
      )}
      onCancel={cancel}
      footer={
        <div className={s.dialogActions}>
          {canClose && (
            <Button autoFocus data-initial-focus onClick={cancel}>
              {t(
                working
                  ? 'actions.auth.cancelOperation'
                  : confirm
                    ? 'vault.cancel'
                    : props.editing
                      ? 'actions.common.backToEditor'
                      : 'actions.common.backToDetail',
              )}
            </Button>
          )}
          {confirm ? (
            <Button
              type="primary"
              danger={props.kind !== 'delete'}
              onClick={() => void execute()}
            >
              {t(
                props.kind === 'purge'
                  ? 'actions.purge.confirm'
                  : 'actions.delete.confirm',
              )}
            </Button>
          ) : phase === 'unknown' ? (
            <Button
              data-initial-focus
              type="primary"
              onClick={() => void execute(true)}
            >
              {t('actions.auth.query')}
            </Button>
          ) : (
            !working &&
            canRetry && (
              <Button type="primary" onClick={() => change('confirm')}>
                {t('actions.auth.reconfirm')}
              </Button>
            )
          )}
        </div>
      }
    >
      <div className={s.actionTarget}>
        {confirm ? (
          <Trash2 size={22} aria-hidden />
        ) : phase === 'submitting' ? (
          <ShieldCheck size={22} aria-hidden />
        ) : (
          <Fingerprint size={22} aria-hidden />
        )}
        <span>{props.name}</span>
      </div>
      {confirm ? (
        <>
          <p>
            {t(
              props.kind === 'purge'
                ? 'actions.purge.consequence'
                : props.kind === 'group'
                  ? 'actions.group.consequence'
                  : 'actions.delete.consequence',
            )}
          </p>
          {props.impact && <p className={s.help}>{props.impact}</p>}
          <p className={s.actionNote}>
            <Fingerprint size={17} aria-hidden />
            {t('actions.auth.required')}
          </p>
        </>
      ) : (
        <div role="status" aria-live="polite" aria-atomic="true">
          <p>{t(feedback[phase] || 'actions.auth.failed')}</p>
          {phase === 'rateLimited' && retryAfter > 0 && (
            <p>{t('actions.auth.retryAfter', { seconds: retryAfter })}</p>
          )}
          {working && (
            <p className={s.help}>
              {t('actions.auth.boundTo', {
                action: t(
                  props.kind === 'purge'
                    ? 'deleted.purge'
                    : props.kind === 'group'
                      ? 'groups.dissolve'
                      : 'vault.delete',
                ),
                name: props.name,
              })}
            </p>
          )}
          {unresolved ? (
            <p className={s.help}>{t('actions.auth.noUndoRequest')}</p>
          ) : (
            !working && (
              <p className={s.help}>
                {t(
                  props.kind === 'purge'
                    ? 'actions.auth.preserveDeleted'
                    : props.kind === 'group'
                      ? 'actions.auth.preserveGroup'
                      : 'actions.auth.preserveDraft',
                )}
              </p>
            )
          )}
        </div>
      )}
    </Modal>
  );
}
